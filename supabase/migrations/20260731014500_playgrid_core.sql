-- PlayGrid core schema
-- Play-money only. No payment, purchase, transfer, withdrawal, redemption, or
-- fiat/crypto conversion objects are permitted in this schema.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.iit_domains (
  id bigint generated always as identity primary key,
  code text not null unique,
  root_domain text not null unique,
  signup_enabled boolean not null default true,
  access_enabled boolean not null default true,
  google_workspace_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint iit_domains_root_format check (
    root_domain = lower(root_domain)
    and root_domain ~ '^[a-z0-9.-]+\.ac\.in$'
  )
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  iit_domain_id bigint not null references public.iit_domains(id),
  username text unique,
  username_set_count smallint not null default 0 check (username_set_count between 0 and 2),
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or username ~ '^[a-z0-9_]{3,20}$'
  )
);

create table public.username_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  claim_number smallint not null check (claim_number between 1 and 2),
  claimed_at timestamptz not null default now(),
  unique (user_id, claim_number)
);

create table public.credit_accounts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  asset text not null check (asset in ('sports', 'casino')),
  balance bigint not null default 0 check (balance >= 0),
  locked_balance bigint not null default 0 check (locked_balance >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, asset)
);

create table public.ledger_entries (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  asset text not null check (asset in ('sports', 'casino')),
  delta bigint not null check (delta <> 0),
  balance_after bigint not null check (balance_after >= 0),
  kind text not null check (
    kind in (
      'welcome', 'referral', 'sports_reserve', 'sports_refund',
      'sports_payout', 'casino_stake', 'casino_payout', 'casino_refund',
      'admin_correction'
    )
  ),
  reference_type text,
  reference_id text,
  idempotency_key uuid,
  created_at timestamptz not null default now()
);

create unique index ledger_entries_idempotency_idx
  on public.ledger_entries (user_id, asset, idempotency_key, kind)
  where idempotency_key is not null;
create index ledger_entries_user_created_idx
  on public.ledger_entries (user_id, created_at desc, id desc);

create table public.referrals (
  id bigint generated always as identity primary key,
  referrer_id uuid not null references public.profiles(id) on delete restrict,
  invitee_id uuid not null unique references public.profiles(id) on delete restrict,
  code text not null,
  status text not null default 'vested' check (status in ('pending', 'vested', 'rejected')),
  risk_state text not null default 'clear' check (risk_state in ('clear', 'review', 'blocked')),
  vested_at timestamptz,
  created_at timestamptz not null default now(),
  constraint referrals_no_self check (referrer_id <> invitee_id)
);
create index referrals_referrer_status_idx
  on public.referrals (referrer_id, status, created_at desc);

create table public.rpc_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  operation text not null,
  request_id uuid not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, operation, request_id)
);

create table public.sports_events (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  slug text not null unique,
  sport text not null,
  league text not null,
  title text not null,
  starts_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'open' check (
    status in ('draft', 'open', 'closed', 'proposed', 'disputed', 'finalized', 'cancelled')
  ),
  resolution_source text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint sports_event_window check (closes_at <= starts_at)
);

create table public.sports_markets (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.sports_events(id) on delete cascade,
  market_type text not null default 'winner',
  status text not null default 'open' check (
    status in ('open', 'closed', 'proposed', 'disputed', 'finalized', 'refunded')
  ),
  burn_bps smallint not null default 500 check (burn_bps between 0 and 1000),
  chain_id bigint not null default 84532 check (chain_id = 84532),
  contract_event_id numeric(78, 0),
  created_at timestamptz not null default now()
);
create index sports_markets_event_idx on public.sports_markets (event_id);
create index sports_markets_status_idx on public.sports_markets (status, created_at desc);

create table public.sports_outcomes (
  id bigint generated always as identity primary key,
  market_id bigint not null references public.sports_markets(id) on delete cascade,
  label text not null,
  display_order smallint not null,
  seed_credits bigint not null default 0 check (seed_credits >= 0),
  projected_pool bigint not null default 0 check (projected_pool >= 0),
  is_winner boolean,
  unique (market_id, display_order)
);
create index sports_outcomes_market_idx on public.sports_outcomes (market_id);

create table public.sports_commands (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  market_id bigint not null references public.sports_markets(id) on delete restrict,
  outcome_id bigint not null references public.sports_outcomes(id) on delete restrict,
  command_type text not null default 'place_bet' check (command_type = 'place_bet'),
  stake bigint not null check (stake > 0),
  state text not null default 'queued' check (
    state in ('queued', 'submitted', 'confirmed', 'rejected', 'refunded')
  ),
  projected_multiplier numeric(12, 4) not null,
  idempotency_key uuid not null,
  chain_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index sports_commands_user_created_idx
  on public.sports_commands (user_id, created_at desc, id desc);
create index sports_commands_queue_idx
  on public.sports_commands (state, created_at)
  where state in ('queued', 'submitted');
create index sports_commands_market_outcome_idx
  on public.sports_commands (market_id, outcome_id);

create table public.casino_rounds (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  game_key text not null check (game_key in ('dice', 'mines', 'plinko')),
  wager bigint not null check (wager > 0),
  payout bigint not null check (payout >= 0),
  multiplier numeric(14, 4) not null check (multiplier >= 0),
  result jsonb not null,
  client_seed text not null,
  server_seed text not null,
  commitment text not null,
  nonce bigint not null,
  algorithm_version text not null default 'PF-v1',
  idempotency_key uuid not null,
  settled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index casino_rounds_user_created_idx
  on public.casino_rounds (user_id, created_at desc, id desc);

create table public.admin_permissions (
  code text primary key,
  description text not null
);

create table public.admin_grants (
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_code text not null references public.admin_permissions(code) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, permission_code)
);

create table public.admin_audit_events (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text,
  reason text not null,
  before_state jsonb,
  after_state jsonb,
  request_id uuid not null unique,
  created_at timestamptz not null default now()
);
create index admin_audit_actor_created_idx
  on public.admin_audit_events (actor_id, created_at desc, id desc);

create or replace function private.prevent_history_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'append-only history cannot be changed';
end;
$$;

create trigger ledger_entries_immutable
before update or delete on public.ledger_entries
for each row execute function private.prevent_history_mutation();

create trigger username_history_immutable
before update or delete on public.username_history
for each row execute function private.prevent_history_mutation();

create trigger casino_rounds_immutable
before update or delete on public.casino_rounds
for each row execute function private.prevent_history_mutation();

create trigger admin_audit_immutable
before update or delete on public.admin_audit_events
for each row execute function private.prevent_history_mutation();

create or replace function private.email_domain(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(split_part(trim(p_email), '@', 2));
$$;

create or replace function private.match_iit_domain(p_candidate text)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select d.id
  from public.iit_domains d
  where d.signup_enabled
    and d.access_enabled
    and (
      lower(p_candidate) = d.root_domain
      or lower(p_candidate) like '%.' || d.root_domain
    )
  order by length(d.root_domain) desc
  limit 1;
$$;

create or replace function public.hook_restrict_iit_google(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text;
  v_email text;
  v_email_domain text;
  v_hd text;
  v_email_root bigint;
  v_hd_root bigint;
  v_verified boolean;
begin
  v_provider := event->'user'->'app_metadata'->>'provider';
  v_email := lower(trim(event->'user'->>'email'));
  v_email_domain := private.email_domain(v_email);
  v_hd := lower(trim(coalesce(
    event->'user'->'identities'->0->'identity_data'->>'hd',
    ''
  )));
  v_verified := coalesce(
    (event->'user'->'identities'->0->'identity_data'->>'email_verified')::boolean,
    false
  );

  if v_provider is distinct from 'google' or not v_verified then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Use a verified IIT Google Workspace account.'
      )
    );
  end if;

  v_email_root := private.match_iit_domain(v_email_domain);
  v_hd_root := private.match_iit_domain(v_hd);

  if v_email_root is null or v_hd_root is null or v_email_root <> v_hd_root then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'This Google Workspace domain is not eligible.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant execute on function public.hook_restrict_iit_google(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_iit_google(jsonb) from public, anon, authenticated;

create or replace function private.assert_student(p_user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile
  from public.profiles
  where id = p_user_id;

  if v_profile.id is null
    or v_profile.role <> 'student'
    or v_profile.status <> 'active'
    or v_profile.onboarded_at is null then
    raise exception 'active student account required';
  end if;
end;
$$;

create or replace function public.finish_onboarding(
  p_username text,
  p_referral_code text default null,
  p_request_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_provider text;
  v_domain_id bigint;
  v_username text := lower(trim(p_username));
  v_referrer uuid;
  v_response jsonb;
  v_sports_balance bigint;
  v_casino_balance bigint;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select lower(email), raw_app_meta_data->>'provider'
    into v_email, v_provider
  from auth.users
  where id = v_user_id;

  if v_provider is distinct from 'google' then
    raise exception 'Google authentication required';
  end if;

  v_domain_id := private.match_iit_domain(private.email_domain(v_email));
  if v_domain_id is null then
    raise exception 'IIT email domain is not eligible';
  end if;

  if v_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'username must be 3-20 lowercase letters, numbers, or underscores';
  end if;

  select response into v_response
  from public.rpc_requests
  where user_id = v_user_id
    and operation = 'finish_onboarding'
    and request_id = p_request_id;
  if v_response is not null then
    return v_response;
  end if;

  insert into public.profiles (
    id, iit_domain_id, username, username_set_count, referral_code, onboarded_at
  )
  values (
    v_user_id,
    v_domain_id,
    v_username,
    1,
    'PG-' || upper(substr(replace(v_user_id::text, '-', ''), 1, 8)),
    now()
  )
  on conflict (id) do update
  set username = case
        when public.profiles.username is null then excluded.username
        else public.profiles.username
      end,
      username_set_count = case
        when public.profiles.username is null then 1
        else public.profiles.username_set_count
      end,
      onboarded_at = coalesce(public.profiles.onboarded_at, now()),
      updated_at = now()
  returning username into v_username;

  insert into public.username_history (user_id, username, claim_number)
  values (v_user_id, v_username, 1)
  on conflict do nothing;

  insert into public.credit_accounts (user_id, asset, balance)
  values (v_user_id, 'sports', 500), (v_user_id, 'casino', 500)
  on conflict (user_id, asset) do nothing;

  insert into public.ledger_entries (
    user_id, asset, delta, balance_after, kind, reference_type,
    reference_id, idempotency_key
  )
  select
    a.user_id, a.asset, 500, a.balance, 'welcome', 'onboarding',
    v_user_id::text, p_request_id
  from public.credit_accounts a
  where a.user_id = v_user_id
    and a.asset in ('sports', 'casino')
  on conflict do nothing;

  if p_referral_code is not null and trim(p_referral_code) <> '' then
    select id into v_referrer
    from public.profiles
    where referral_code = upper(trim(p_referral_code))
      and id <> v_user_id
      and role = 'student'
      and status = 'active'
      and onboarded_at is not null;

    if v_referrer is not null then
      insert into public.referrals (
        referrer_id, invitee_id, code, status, risk_state, vested_at
      )
      values (
        v_referrer, v_user_id, upper(trim(p_referral_code)),
        'vested', 'clear', now()
      )
      on conflict (invitee_id) do nothing;

      if found then
        update public.credit_accounts
        set balance = balance + 50, updated_at = now()
        where user_id in (v_user_id, v_referrer)
          and asset in ('sports', 'casino');

        insert into public.ledger_entries (
          user_id, asset, delta, balance_after, kind, reference_type,
          reference_id, idempotency_key
        )
        select
          a.user_id, a.asset, 50, a.balance, 'referral', 'referral',
          v_user_id::text, p_request_id
        from public.credit_accounts a
        where a.user_id in (v_user_id, v_referrer)
          and a.asset in ('sports', 'casino');
      end if;
    end if;
  end if;

  select balance into v_sports_balance
  from public.credit_accounts
  where user_id = v_user_id and asset = 'sports';
  select balance into v_casino_balance
  from public.credit_accounts
  where user_id = v_user_id and asset = 'casino';

  v_response := jsonb_build_object(
    'username', v_username,
    'sports_balance', v_sports_balance,
    'casino_balance', v_casino_balance
  );

  insert into public.rpc_requests (user_id, operation, request_id, response)
  values (v_user_id, 'finish_onboarding', p_request_id, v_response);

  return v_response;
end;
$$;

create or replace function public.set_username(
  p_username text,
  p_request_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_username text := lower(trim(p_username));
  v_count smallint;
begin
  perform private.assert_student(v_user_id);
  if v_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'invalid username';
  end if;

  select username_set_count into v_count
  from public.profiles
  where id = v_user_id
  for update;

  if v_count >= 2 then
    raise exception 'lifetime rename already used';
  end if;

  insert into public.username_history (user_id, username, claim_number)
  values (v_user_id, v_username, v_count + 1);

  update public.profiles
  set username = v_username,
      username_set_count = v_count + 1,
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'username', v_username,
    'renames_remaining', 2 - (v_count + 1)
  );
end;
$$;

create or replace function public.place_sports_bet(
  p_outcome_id bigint,
  p_stake bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_market_id bigint;
  v_event_close timestamptz;
  v_market_status text;
  v_total_pool bigint;
  v_outcome_pool bigint;
  v_multiplier numeric(12, 4);
  v_balance bigint;
  v_public_id uuid;
begin
  perform private.assert_student(v_user_id);
  if p_stake <= 0 then
    raise exception 'stake must be positive';
  end if;

  select o.market_id, m.status, e.closes_at
    into v_market_id, v_market_status, v_event_close
  from public.sports_outcomes o
  join public.sports_markets m on m.id = o.market_id
  join public.sports_events e on e.id = m.event_id
  where o.id = p_outcome_id;

  if v_market_id is null or v_market_status <> 'open' or v_event_close <= now() then
    raise exception 'market is not open';
  end if;

  select coalesce(sum(stake), 0)
    into v_total_pool
  from public.sports_commands
  where market_id = v_market_id
    and state in ('queued', 'submitted', 'confirmed');

  select coalesce(sum(stake), 0)
    into v_outcome_pool
  from public.sports_commands
  where market_id = v_market_id
    and outcome_id = p_outcome_id
    and state in ('queued', 'submitted', 'confirmed');

  select
    v_total_pool + coalesce(sum(seed_credits), 0),
    v_outcome_pool + coalesce(max(seed_credits) filter (where id = p_outcome_id), 0)
    into v_total_pool, v_outcome_pool
  from public.sports_outcomes
  where market_id = v_market_id;

  v_multiplier := (0.95 * (v_total_pool + p_stake)) / nullif(v_outcome_pool + p_stake, 0);
  if v_multiplier <= 1.05 then
    raise exception 'projected multiplier must remain above 1.05x';
  end if;

  select balance into v_balance
  from public.credit_accounts
  where user_id = v_user_id and asset = 'sports'
  for update;
  if v_balance < p_stake then
    raise exception 'insufficient Sports Credits';
  end if;

  update public.credit_accounts
  set balance = balance - p_stake,
      locked_balance = locked_balance + p_stake,
      updated_at = now()
  where user_id = v_user_id and asset = 'sports'
  returning balance into v_balance;

  insert into public.sports_commands (
    user_id, market_id, outcome_id, stake, projected_multiplier, idempotency_key
  )
  values (
    v_user_id, v_market_id, p_outcome_id, p_stake, v_multiplier, p_idempotency_key
  )
  returning public_id into v_public_id;

  insert into public.ledger_entries (
    user_id, asset, delta, balance_after, kind, reference_type,
    reference_id, idempotency_key
  )
  values (
    v_user_id, 'sports', -p_stake, v_balance, 'sports_reserve',
    'sports_command', v_public_id::text, p_idempotency_key
  );

  return jsonb_build_object(
    'receipt_id', v_public_id,
    'state', 'queued',
    'projected_multiplier', v_multiplier,
    'balance', v_balance
  );
end;
$$;

create or replace function public.play_casino_round(
  p_game_key text,
  p_wager bigint,
  p_config jsonb,
  p_client_seed text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing jsonb;
  v_balance bigint;
  v_server_seed text;
  v_commitment text;
  v_hash text;
  v_random bigint;
  v_nonce bigint;
  v_multiplier numeric(14, 4) := 0;
  v_payout bigint := 0;
  v_result jsonb;
  v_public_id uuid;
  v_result_value numeric(6, 2);
  v_target numeric(6, 2);
  v_direction text;
  v_risk text;
  v_landing integer;
begin
  perform private.assert_student(v_user_id);
  if p_game_key not in ('dice', 'mines', 'plinko') then
    raise exception 'unsupported game';
  end if;
  if p_wager <= 0 then
    raise exception 'wager must be positive';
  end if;
  if length(p_client_seed) < 8 or length(p_client_seed) > 120 then
    raise exception 'invalid client seed';
  end if;

  select jsonb_build_object(
    'receipt_id', public_id,
    'result', result,
    'multiplier', multiplier,
    'payout', payout,
    'commitment', commitment,
    'server_seed', server_seed,
    'nonce', nonce
  )
  into v_existing
  from public.casino_rounds
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if v_existing is not null then
    return v_existing;
  end if;

  select balance into v_balance
  from public.credit_accounts
  where user_id = v_user_id and asset = 'casino'
  for update;
  if v_balance < p_wager then
    raise exception 'insufficient Arcade Credits';
  end if;

  select coalesce(max(nonce), 0) + 1 into v_nonce
  from public.casino_rounds
  where user_id = v_user_id and game_key = p_game_key;

  v_server_seed := encode(gen_random_bytes(32), 'hex');
  v_commitment := encode(digest(v_server_seed, 'sha256'), 'hex');
  v_hash := encode(
    hmac(
      convert_to(p_client_seed || ':' || v_nonce::text, 'utf8'),
      convert_to(v_server_seed, 'utf8'),
      'sha256'
    ),
    'hex'
  );
  v_random := ('x' || substr(v_hash, 1, 8))::bit(32)::bigint;

  if p_game_key = 'dice' then
    v_result_value := (v_random % 10000)::numeric / 100;
    v_target := greatest(2, least(98, (p_config->>'target')::numeric));
    v_direction := case when p_config->>'direction' = 'under' then 'under' else 'over' end;

    if v_direction = 'over' then
      v_multiplier := 97 / nullif(100 - v_target, 0);
      if v_result_value > v_target then
        v_payout := floor(p_wager * v_multiplier);
      end if;
    else
      v_multiplier := 97 / nullif(v_target, 0);
      if v_result_value < v_target then
        v_payout := floor(p_wager * v_multiplier);
      end if;
    end if;
    v_result := jsonb_build_object(
      'result_value', v_result_value,
      'target', v_target,
      'direction', v_direction,
      'won', v_payout > 0
    );
  elsif p_game_key = 'plinko' then
    v_risk := case
      when p_config->>'risk' in ('low', 'medium', 'high') then p_config->>'risk'
      else 'medium'
    end;
    v_landing := (v_random % 9)::integer;
    v_multiplier := case v_risk
      when 'low' then (array[3,1.8,1.2,0.8,0.5,0.8,1.2,1.8,3]::numeric[])[v_landing + 1]
      when 'high' then (array[24,7,2,0.4,0.2,0.4,2,7,24]::numeric[])[v_landing + 1]
      else (array[8,3,1.4,0.6,0.3,0.6,1.4,3,8]::numeric[])[v_landing + 1]
    end;
    v_payout := floor(p_wager * v_multiplier);
    v_result := jsonb_build_object(
      'landing_index', v_landing,
      'risk', v_risk,
      'rows', greatest(8, least(16, coalesce((p_config->>'rows')::integer, 12)))
    );
  else
    v_landing := (v_random % 25)::integer;
    v_multiplier := 1.18;
    if not (p_config->'selections') @> to_jsonb(v_landing) then
      v_payout := floor(p_wager * v_multiplier);
    end if;
    v_result := jsonb_build_object(
      'mine_index', v_landing,
      'won', v_payout > 0
    );
  end if;

  update public.credit_accounts
  set balance = balance - p_wager + v_payout,
      updated_at = now()
  where user_id = v_user_id and asset = 'casino'
  returning balance into v_balance;

  insert into public.casino_rounds (
    user_id, game_key, wager, payout, multiplier, result, client_seed,
    server_seed, commitment, nonce, idempotency_key
  )
  values (
    v_user_id, p_game_key, p_wager, v_payout, v_multiplier, v_result,
    p_client_seed, v_server_seed, v_commitment, v_nonce, p_idempotency_key
  )
  returning public_id into v_public_id;

  insert into public.ledger_entries (
    user_id, asset, delta, balance_after, kind, reference_type,
    reference_id, idempotency_key
  )
  values (
    v_user_id, 'casino', -p_wager, v_balance - v_payout,
    'casino_stake', 'casino_round', v_public_id::text, p_idempotency_key
  );

  if v_payout > 0 then
    insert into public.ledger_entries (
      user_id, asset, delta, balance_after, kind, reference_type,
      reference_id, idempotency_key
    )
    values (
      v_user_id, 'casino', v_payout, v_balance,
      'casino_payout', 'casino_round', v_public_id::text, p_idempotency_key
    );
  end if;

  return jsonb_build_object(
    'receipt_id', v_public_id,
    'result', v_result,
    'result_value', v_result->>'result_value',
    'landing_index', v_result->>'landing_index',
    'multiplier', v_multiplier,
    'payout', v_payout,
    'balance', v_balance,
    'commitment', v_commitment,
    'server_seed', v_server_seed,
    'client_seed', p_client_seed,
    'nonce', v_nonce,
    'algorithm', 'PF-v1'
  );
end;
$$;

alter table public.iit_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.username_history enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.referrals enable row level security;
alter table public.rpc_requests enable row level security;
alter table public.sports_events enable row level security;
alter table public.sports_markets enable row level security;
alter table public.sports_outcomes enable row level security;
alter table public.sports_commands enable row level security;
alter table public.casino_rounds enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_grants enable row level security;
alter table public.admin_audit_events enable row level security;

create policy profiles_read_public_identity
on public.profiles for select
to authenticated
using (status = 'active');

create policy credit_accounts_read_own
on public.credit_accounts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy ledger_entries_read_own
on public.ledger_entries for select
to authenticated
using ((select auth.uid()) = user_id);

create policy referrals_read_related
on public.referrals for select
to authenticated
using ((select auth.uid()) in (referrer_id, invitee_id));

create policy username_history_read_own
on public.username_history for select
to authenticated
using ((select auth.uid()) = user_id);

create policy sports_events_read
on public.sports_events for select
to authenticated
using (true);

create policy sports_markets_read
on public.sports_markets for select
to authenticated
using (true);

create policy sports_outcomes_read
on public.sports_outcomes for select
to authenticated
using (true);

create policy sports_commands_read_own
on public.sports_commands for select
to authenticated
using ((select auth.uid()) = user_id);

create policy casino_rounds_read_own
on public.casino_rounds for select
to authenticated
using ((select auth.uid()) = user_id);

create policy admin_audit_read_aal2
on public.admin_audit_events for select
to authenticated
using (
  (select auth.jwt()->>'aal') = 'aal2'
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

grant usage on schema public to authenticated;
grant select on
  public.profiles,
  public.username_history,
  public.credit_accounts,
  public.ledger_entries,
  public.referrals,
  public.sports_events,
  public.sports_markets,
  public.sports_outcomes,
  public.sports_commands,
  public.casino_rounds
to authenticated;

grant execute on function public.finish_onboarding(text, text, uuid) to authenticated;
grant execute on function public.set_username(text, uuid) to authenticated;
grant execute on function public.place_sports_bet(bigint, bigint, uuid) to authenticated;
grant execute on function public.play_casino_round(text, bigint, jsonb, text, uuid) to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;

insert into public.iit_domains (code, root_domain)
values
  ('IITB', 'iitb.ac.in'),
  ('IITBBS', 'iitbbs.ac.in'),
  ('IITBHILAI', 'iitbhilai.ac.in'),
  ('IITBHU', 'iitbhu.ac.in'),
  ('IITD', 'iitd.ac.in'),
  ('IITDH', 'iitdh.ac.in'),
  ('IITG', 'iitg.ac.in'),
  ('IITGN', 'iitgn.ac.in'),
  ('IITGOA', 'iitgoa.ac.in'),
  ('IITH', 'iith.ac.in'),
  ('IITI', 'iiti.ac.in'),
  ('IITISM', 'iitism.ac.in'),
  ('IITJ', 'iitj.ac.in'),
  ('IITJAMMU', 'iitjammu.ac.in'),
  ('IITK', 'iitk.ac.in'),
  ('IITKGP', 'iitkgp.ac.in'),
  ('IITM', 'iitm.ac.in'),
  ('IITMANDI', 'iitmandi.ac.in'),
  ('IITP', 'iitp.ac.in'),
  ('IITPKD', 'iitpkd.ac.in'),
  ('IITR', 'iitr.ac.in'),
  ('IITRPR', 'iitrpr.ac.in'),
  ('IITTP', 'iittp.ac.in')
on conflict (root_domain) do nothing;

insert into public.admin_permissions (code, description)
values
  ('market.create', 'Create sports market drafts'),
  ('market.close', 'Close sports markets'),
  ('market.resolve', 'Propose and finalize sports results'),
  ('dispute.resolve', 'Resolve market disputes'),
  ('member.suspend', 'Suspend a member'),
  ('referral.review', 'Review referral risk'),
  ('economy.adjust', 'Create compensating credit entries'),
  ('admin.manage', 'Manage admin grants'),
  ('audit.read', 'Read immutable admin audit events')
on conflict (code) do nothing;

insert into public.sports_events (
  slug, sport, league, title, starts_at, closes_at, status, resolution_source
)
values
  (
    'india-australia-odi', 'Cricket', 'International Cricket',
    'India vs Australia', now() + interval '2 hours',
    now() + interval '90 minutes', 'open', 'Official competition result'
  ),
  (
    'madrid-manchester', 'Football', 'Club Football',
    'Madrid vs Manchester', now() + interval '8 hours',
    now() + interval '7 hours 45 minutes', 'open', 'Official competition result'
  ),
  (
    'mumbai-chennai-t20', 'Cricket', 'T20 League',
    'Mumbai vs Chennai', now() + interval '1 day',
    now() + interval '23 hours 45 minutes', 'open', 'Official competition result'
  )
on conflict (slug) do nothing;

insert into public.sports_markets (event_id)
select e.id
from public.sports_events e
where e.slug in ('india-australia-odi', 'madrid-manchester', 'mumbai-chennai-t20')
and not exists (
  select 1 from public.sports_markets m where m.event_id = e.id
);

insert into public.sports_outcomes (
  market_id, label, display_order, seed_credits, projected_pool
)
select m.id, x.label, x.display_order, x.seed_credits, x.seed_credits
from public.sports_markets m
join public.sports_events e on e.id = m.event_id
join lateral (
  values
    (case
      when e.slug = 'india-australia-odi' then 'India'
      when e.slug = 'madrid-manchester' then 'Madrid'
      else 'Mumbai'
    end, 1::smallint, 500::bigint),
    (case
      when e.slug = 'india-australia-odi' then 'Australia'
      when e.slug = 'madrid-manchester' then 'Draw'
      else 'Chennai'
    end, 2::smallint, 400::bigint)
) as x(label, display_order, seed_credits) on true
where e.slug in ('india-australia-odi', 'madrid-manchester', 'mumbai-chennai-t20')
  and not exists (
    select 1
    from public.sports_outcomes o
    where o.market_id = m.id and o.display_order = x.display_order
  );

insert into public.sports_outcomes (
  market_id, label, display_order, seed_credits, projected_pool
)
select m.id, 'Manchester', 3, 300, 300
from public.sports_markets m
join public.sports_events e on e.id = m.event_id
where e.slug = 'madrid-manchester'
  and not exists (
    select 1 from public.sports_outcomes o
    where o.market_id = m.id and o.display_order = 3
  );
