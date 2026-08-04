-- Database-level fallback guard. The Before User Created hook remains the
-- preferred path because it can compare Google's signed hosted-domain claim.

create or replace function private.enforce_iit_google_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text;
  v_domain_id bigint;
begin
  v_provider := new.raw_app_meta_data->>'provider';
  v_domain_id := private.match_iit_domain(private.email_domain(new.email));

  if v_provider is distinct from 'google'
    or new.email_confirmed_at is null
    or v_domain_id is null then
    raise exception using
      errcode = '42501',
      message = 'Use a verified Google account from an approved IIT domain.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_iit_google_auth_user on auth.users;
create trigger enforce_iit_google_auth_user
before insert on auth.users
for each row execute function private.enforce_iit_google_auth_user();

revoke execute on function private.enforce_iit_google_auth_user()
  from public, anon, authenticated;
