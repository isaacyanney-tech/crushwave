-- Crushwave core schema
-- Security model: every table has row-level security (RLS) on. The app only
-- holds the public key, so these rules are what keep each student's data safe.
-- Other people's profiles are never read straight from the table; the app asks
-- for them through functions that return only safe, public fields.

create extension if not exists pg_net;

-- ---------------------------------------------------------------- types
create type public.gender as enum ('man', 'woman', 'nonbinary');
create type public.looking_for as enum ('dating', 'friendship', 'study_partner');
create type public.account_status as enum ('active', 'suspended', 'banned');
create type public.report_reason as enum
  ('fake_profile', 'harassment', 'nudity', 'scam', 'under_18', 'threats', 'other');

-- ---------------------------------------------------------------- schools
-- One row per campus. Adding a school later = add a row and set enabled = true.
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  email_domains text[] not null check (cardinality(email_domains) > 0),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.schools (name, short_name, email_domains, enabled)
values ('University of Professional Studies, Accra', 'UPSA', array['upsamail.edu.gh'], true);

-- Exact emails allowed outside the school domains (e.g. an app store reviewer).
create table public.email_exceptions (
  email text primary key check (email = lower(email)),
  school_id uuid not null references public.schools (id),
  note text,
  created_at timestamptz not null default now()
);

-- Emails that may never sign up again (repeat offenders).
create table public.banned_emails (
  email text primary key check (email = lower(email)),
  reason text,
  created_at timestamptz not null default now()
);

-- People allowed to moderate. Add rows from the Supabase dashboard only.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.school_for_email(p_email text)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select e.school_id from public.email_exceptions e
       join public.schools s on s.id = e.school_id and s.enabled
      where e.email = lower(btrim(p_email))),
    (select s.id from public.schools s
      where s.enabled
        and lower(substring(btrim(p_email) from '@([^@]+)$')) = any (s.email_domains)
      limit 1)
  );
$$;

-- Called by the app before asking for a code, so it can say "use your school email".
create or replace function public.check_school_email(p_email text)
returns table (school_name text, short_name text)
language sql stable security definer set search_path = ''
as $$
  select s.name, s.short_name from public.schools s
   where s.id = public.school_for_email(p_email);
$$;

-- Blocks sign-up at the source: Supabase Auth cannot create a user whose
-- email is not from an enabled school, even if someone bypasses the app.
create or replace function public.enforce_school_email()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.email is null or public.school_for_email(new.email) is null then
    raise exception 'Crushwave is only open to verified student emails';
  end if;
  if exists (select 1 from public.banned_emails b where b.email = lower(new.email)) then
    raise exception 'This email can no longer be used on Crushwave';
  end if;
  return new;
end;
$$;

create trigger enforce_school_email
  before insert or update of email on auth.users
  for each row execute function public.enforce_school_email();

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid not null references public.schools (id),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 30),
  birthdate date not null,
  gender public.gender not null,
  show_me public.gender[] not null default '{man,woman,nonbinary}'
    check (cardinality(show_me) between 1 and 3),
  looking_for public.looking_for not null default 'dating',
  bio text not null default '' check (char_length(bio) <= 500),
  programme text check (char_length(programme) <= 80),
  level smallint check (level in (100, 200, 300, 400, 500)),
  hall text check (char_length(hall) <= 80),
  interests text[] not null default '{}' check (cardinality(interests) <= 10),
  prompts jsonb not null default '[]'
    check (jsonb_typeof(prompts) = 'array' and jsonb_array_length(prompts) <= 3),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  min_age smallint not null default 18 check (min_age >= 18),
  max_age smallint not null default 35 check (max_age <= 99),
  is_paused boolean not null default false,
  hide_from_my_programme boolean not null default false,
  hide_from_my_level boolean not null default false,
  is_verified boolean not null default false,
  status public.account_status not null default 'active',
  accepted_rules_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint age_range_valid check (min_age <= max_age)
);

create index profiles_discovery_idx on public.profiles (school_id, status, is_paused);

create or replace function public.profiles_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text;
  v_item jsonb;
  v_photo text;
  v_interest text;
begin
  if tg_op = 'INSERT' then
    select u.email into v_email from auth.users u where u.id = new.id;
    new.school_id := public.school_for_email(v_email);
    if new.school_id is null then
      raise exception 'Your email is not from a school on Crushwave';
    end if;
    new.is_verified := false;
    new.status := 'active';
    new.accepted_rules_at := now();
    new.created_at := now();
  end if;

  if new.birthdate > (current_date - interval '18 years')::date then
    raise exception 'You must be 18 or older to use Crushwave';
  end if;
  if new.birthdate < (current_date - interval '100 years')::date then
    raise exception 'Please enter your real date of birth';
  end if;

  new.first_name := btrim(new.first_name);

  for v_item in select * from jsonb_array_elements(new.prompts) loop
    if jsonb_typeof(v_item) <> 'object'
       or jsonb_typeof(v_item -> 'q') is distinct from 'string'
       or jsonb_typeof(v_item -> 'a') is distinct from 'string'
       or char_length(v_item ->> 'q') > 120
       or char_length(v_item ->> 'a') > 200 then
      raise exception 'Invalid prompt answer';
    end if;
  end loop;

  foreach v_photo in array new.photos loop
    if v_photo !~ ('^' || new.id::text || '/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$') then
      raise exception 'Invalid photo';
    end if;
  end loop;

  foreach v_interest in array new.interests loop
    if char_length(v_interest) > 30 then
      raise exception 'Interest too long';
    end if;
  end loop;

  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_before_write
  before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

-- ---------------------------------------------------------------- blocks
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
     where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Can viewer see owner's profile and photos? Same school, both active, not blocked.
create or replace function public.can_view_profile(viewer uuid, owner uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select viewer is not null and (
    viewer = owner or exists (
      select 1
        from public.profiles v
        join public.profiles o on o.id = owner
       where v.id = viewer
         and v.school_id = o.school_id
         and v.status = 'active'
         and o.status = 'active'
         and not public.is_blocked_pair(viewer, owner)
    )
  );
$$;

-- ---------------------------------------------------------------- swipes & matches
create table public.swipes (
  swiper_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (swiper_id, target_id),
  check (swiper_id <> target_id)
);
create index swipes_target_idx on public.swipes (target_id) where liked;
create index swipes_recent_idx on public.swipes (swiper_id, created_at);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unmatched_at timestamptz,
  unmatched_by uuid references public.profiles (id) on delete set null,
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index matches_user_b_idx on public.matches (user_b);

create or replace function public.is_active_match_member(p_match uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
     where m.id = p_match
       and m.unmatched_at is null
       and p_user in (m.user_a, m.user_b)
  );
$$;

-- ---------------------------------------------------------------- messages
create table public.messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_match_idx on public.messages (match_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id, created_at desc);

-- ---------------------------------------------------------------- reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason public.report_reason not null,
  details text not null default '' check (char_length(details) <= 1000),
  match_id uuid references public.matches (id) on delete set null,
  message_id bigint references public.messages (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (reporter_id <> reported_id)
);
create index reports_open_idx on public.reports (status, created_at);
create index reports_reporter_idx on public.reports (reporter_id, created_at);
create index reports_reported_idx on public.reports (reported_id);

-- ---------------------------------------------------------------- verification & push
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  selfie_path text not null,
  pose text not null check (char_length(pose) <= 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index verification_requests_user_idx on public.verification_requests (user_id);

create table public.push_tokens (
  token text primary key check (char_length(token) <= 200),
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
