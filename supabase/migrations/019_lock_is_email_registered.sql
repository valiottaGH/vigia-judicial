-- Restringir is_email_registered a service_role únicamente.
-- Evita enumeración de emails desde el cliente (anon/authenticated).

revoke all on function public.is_email_registered(text) from public;
revoke all on function public.is_email_registered(text) from anon;
revoke all on function public.is_email_registered(text) from authenticated;

grant execute on function public.is_email_registered(text) to service_role;

comment on function public.is_email_registered(text) is
  'Solo vía API server con service role. No expuesta al cliente.';
