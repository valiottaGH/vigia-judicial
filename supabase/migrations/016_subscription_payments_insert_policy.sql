-- Permitir al usuario autenticado crear registros de pago propios (fallback si no usa service role)

drop policy if exists "Usuarios crean sus pagos" on public.subscription_payments;
create policy "Usuarios crean sus pagos"
  on public.subscription_payments for insert
  to authenticated
  with check (user_id = auth.uid());
