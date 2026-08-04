-- Advisor-driven hardening after the core migration.

revoke execute on function public.finish_onboarding(text, text, uuid)
  from public, anon;
revoke execute on function public.set_username(text, uuid)
  from public, anon;
revoke execute on function public.place_sports_bet(bigint, bigint, uuid)
  from public, anon;
revoke execute on function public.play_casino_round(text, bigint, jsonb, text, uuid)
  from public, anon;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable()
      from public, anon, authenticated;
  end if;
end;
$$;

create index if not exists profiles_iit_domain_idx
  on public.profiles (iit_domain_id);
create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by)
  where referred_by is not null;
create index if not exists admin_grants_permission_idx
  on public.admin_grants (permission_code);
create index if not exists sports_commands_outcome_idx
  on public.sports_commands (outcome_id);
create index if not exists sports_events_created_by_idx
  on public.sports_events (created_by)
  where created_by is not null;

drop policy if exists admin_audit_read_aal2 on public.admin_audit_events;
create policy admin_audit_read_aal2
on public.admin_audit_events for select
to authenticated
using (
  ((select auth.jwt())->>'aal') = 'aal2'
  and exists (
    select 1
    from public.profiles p
    join public.admin_grants g on g.user_id = p.id
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.status = 'active'
      and g.permission_code = 'audit.read'
  )
);
