/**
 * Prueba de aislamiento RLS entre dos cuentas.
 *
 * Requisitos (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usuarios de prueba (crear dos cuentas en prod/staging):
 *   RLS_TEST_USER_A_EMAIL / RLS_TEST_USER_A_PASSWORD
 *   RLS_TEST_USER_B_EMAIL / RLS_TEST_USER_B_PASSWORD
 *
 * Uso: node scripts/test-rls-isolation.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    for (const line of readFileSync(resolve(".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local opcional si vars ya están en el entorno
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const emailA = process.env.RLS_TEST_USER_A_EMAIL;
const passwordA = process.env.RLS_TEST_USER_A_PASSWORD;
const emailB = process.env.RLS_TEST_USER_B_EMAIL;
const passwordB = process.env.RLS_TEST_USER_B_PASSWORD;

if (!url || !anonKey || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL, ANON_KEY o SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!emailA || !passwordA || !emailB || !passwordB) {
  console.error(`
Faltan credenciales de prueba. Agregá en .env.local:

RLS_TEST_USER_A_EMAIL=usuario-a@test.com
RLS_TEST_USER_A_PASSWORD=********
RLS_TEST_USER_B_EMAIL=usuario-b@test.com
RLS_TEST_USER_B_PASSWORD=********

Creá dos cuentas distintas en la app antes de correr este script.
`);
  process.exit(1);
}

async function signIn(email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login ${email}: ${error.message}`);
  return { client, userId: data.user.id };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("Fast Cedu — test de aislamiento RLS\n");

  const userA = await signIn(emailA, passwordA);
  const userB = await signIn(emailB, passwordB);

  console.log("Usuario A:", userA.userId);
  console.log("Usuario B:", userB.userId);

  const marker = `rls-test-${Date.now()}`;
  let expedienteIdA = null;
  let actuacionIdA = null;
  const failures = [];

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${name}: ${msg}`);
      failures.push({ name, msg });
    }
  }

  // --- Usuario A crea datos propios ---
  await test("A inserta expediente propio", async () => {
    const { data, error } = await userA.client
      .from("expedientes")
      .insert({
        numero: marker,
        caratula: "Prueba RLS A",
        jurisdiccion: "Santa Fe",
      })
      .select("id")
      .single();
    assert(!error, error?.message ?? "insert falló");
    expedienteIdA = data.id;
  });

  await test("A inserta actuación propia", async () => {
    assert(expedienteIdA, "sin expediente A");
    const { data, error } = await userA.client
      .from("actuaciones_generadas")
      .insert({
        user_id: userA.userId,
        expediente_id: expedienteIdA,
        tipo_actuacion: "cedula",
        jurisdiccion: "Santa Fe",
        plantilla_key: "santa-fe",
        zip_path: `${userA.userId}/${expedienteIdA}/rls-test.zip`,
        documentos_count: 1,
      })
      .select("id")
      .single();
    assert(!error, error?.message ?? "insert actuación falló");
    actuacionIdA = data.id;
  });

  // --- Usuario B no debe ver datos de A ---
  await test("B no lee expediente de A por id", async () => {
    const { data, error } = await userB.client
      .from("expedientes")
      .select("id")
      .eq("id", expedienteIdA)
      .maybeSingle();
    assert(!error, error?.message ?? "select error");
    assert(!data, "B pudo leer el expediente de A");
  });

  await test("B no lista expedientes de A", async () => {
    const { data, error } = await userB.client
      .from("expedientes")
      .select("id")
      .eq("numero", marker);
    assert(!error, error?.message ?? "select error");
    assert(!data?.length, `B ve ${data?.length} expediente(s) de A`);
  });

  await test("B no lee actuación de A", async () => {
    const { data, error } = await userB.client
      .from("actuaciones_generadas")
      .select("id")
      .eq("id", actuacionIdA)
      .maybeSingle();
    assert(!error, error?.message ?? "select error");
    assert(!data, "B pudo leer actuación de A");
  });

  await test("B no actualiza plan de A en profiles", async () => {
    const { data, error } = await userB.client
      .from("profiles")
      .update({ plan: "business" })
      .eq("id", userA.userId)
      .select("plan")
      .maybeSingle();
    assert(!error, error?.message ?? "update error");
    assert(!data, "B pudo actualizar perfil de A");
  });

  await test("B no inserta actuación con user_id de A", async () => {
    const { error } = await userB.client.from("actuaciones_generadas").insert({
      user_id: userA.userId,
      expediente_id: expedienteIdA,
      tipo_actuacion: "cedula",
      jurisdiccion: "Santa Fe",
      plantilla_key: "santa-fe",
      zip_path: `${userA.userId}/${expedienteIdA}/hack.zip`,
    });
    assert(error, "B insertó actuación suplantando a A");
  });

  // --- Limpieza con service role ---
  if (actuacionIdA) {
    await admin.from("actuaciones_generadas").delete().eq("id", actuacionIdA);
  }
  if (expedienteIdA) {
    await admin.from("expedientes").delete().eq("id", expedienteIdA);
  }

  console.log("\n--- Resultado ---");
  if (failures.length === 0) {
    console.log("OK: aislamiento RLS correcto entre A y B.");
    process.exit(0);
  }

  console.error(`FALLÓ: ${failures.length} prueba(s). Revisá policies en Supabase.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
