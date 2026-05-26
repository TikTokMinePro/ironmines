
-- Ativar extensões
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
grant usage on schema cron to postgres;

-- Função auxiliar para verificar jobs ativos
create or replace function public.get_cron_jobs()
returns table(jobid bigint, jobname text, schedule text, active boolean)
language sql security definer
set search_path = public
as $$
  select jobid, jobname, schedule, active from cron.job;
$$;

grant execute on function public.get_cron_jobs() to authenticated;
