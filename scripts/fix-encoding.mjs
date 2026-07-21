/**
 * Detecta archivos UTF-16 (Windows) y los convierte a UTF-8 sin BOM.
 * Uso: node scripts/fix-encoding.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skip = /[\\/](node_modules|\.next|\.git)[\\/]/;

function isUtf16(bytes) {
  if (bytes.length < 2) return false;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return "le-bom";
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return "be-bom";
  const nulls = bytes.filter((b) => b === 0).length;
  if (nulls < 10) return false;
  if (bytes[0] === 0 && bytes[1] !== 0) return "be";
  if (bytes[0] !== 0 && bytes[1] === 0) return "le";
  return false;
}

function decode(bytes, kind) {
  if (kind === "le-bom") {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  if (kind === "be-bom") {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }
  if (kind === "le") {
    return new TextDecoder("utf-16le").decode(bytes);
  }
  return new TextDecoder("utf-16be").decode(bytes);
}

function walk(dir, fixed) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (skip.test(full)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, fixed);
      continue;
    }
    const bytes = fs.readFileSync(full);
    const kind = isUtf16(bytes);
    if (!kind) continue;
    const text = decode(bytes, kind);
    fs.writeFileSync(full, text, "utf8");
    fixed.push(full);
    console.log("Fixed:", full);
  }
}

const fixed = [];
walk(root, fixed);
console.log(`Total convertidos: ${fixed.length}`);

if (fs.existsSync(path.join(root, ".next"))) {
  fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
  console.log("Deleted .next cache");
}

try {
  JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  console.log("package.json OK");
} catch (e) {
  console.error("package.json still invalid:", e.message);
  process.exit(1);
}
