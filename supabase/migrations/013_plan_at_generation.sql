-- Plan vigente al momento de cada generacion (para no resetear cupo free al cambiar de plan)
alter table public.actuaciones_generadas
  add column if not exists plan_at_generation text not null default 'free'
    check (plan_at_generation in ('free', 'pro', 'business'));

comment on column public.actuaciones_generadas.plan_at_generation is
  'Plan del usuario al generar; el cupo Gratis (5 total) cuenta solo filas con plan_at_generation = free';

create index if not exists idx_actuaciones_generadas_free_usage
  on public.actuaciones_generadas (user_id, plan_at_generation, created_at);
