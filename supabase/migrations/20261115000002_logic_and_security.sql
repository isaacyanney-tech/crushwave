-- Crushwave: business rules, rate limits, app functions, row-level security,
-- grants and private photo storage.

-- ================================================================ push helper
-- Sends a push notification through Expo's push service. Never shows message
-- text on the lock screen, and never blocks the action if sending fails.
create or replace function public.send_push(p_user uuid, p_title text, p_body text, p_data jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_msgs jsonb;
begin
  select jsonb_agg(jsonb_build_object(
           'to', t.token, 'title', p_title, 'body', p_body,
           'data', coalesce(p_data, '{}'::jsonb), 'sound', 'default'))
    into v_msgs
    from public.push_tokens t
   where t.user_id = p_user;
  if v_msgs is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := v_msgs,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  null;
end;
$$;

-- ================================================================ swipes
create or replace function public.swipes_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.swipes s
       where s.swiper_id = new.swiper_id
         and s.created_at > now() - interval '1 day') >= 300 then
    raise exception 'You have reached today''s limit. Come back tomorrow!';
  end if;
  new.created_at := now();
  return new;
end;
$$;

create trigger swipes_before_insert
  before insert on public.swipes
  for each row execute function public.swipes_before_insert();

-- When two people like each other, create the match.
create or replace function public.swipes_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_match uuid;
  v_a uuid := least(new.swiper_id, new.target_id);
  v_b uuid := greatest(new.swiper_id, new.target_id);
  v_name_swiper text;
  v_name_target text;
begin
  if not new.liked then
    return null;
  end if;
  if not exists (select 1 from public.swipes s
                  where s.swiper_id = new.target_id
                    and s.target_id = new.swiper_id
                    and s.liked) then
    return null;
  end if;
  if public.is_blocked_pair(new.swiper_id, new.target_id) then
    return null;
  end if;

  insert into public.matches (user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b) do nothing
  returning id into v_match;

  if v_match is not null then
    select first_name into v_name_swiper from public.profiles where id = new.swiper_id;
    select first_name into v_name_target from public.profiles where id = new.target_id;
    perform public.send_push(new.target_id, 'It''s a match!',
      'You and ' || v_name_swiper || ' liked each other', jsonb_build_object('match_id', v_match));
    perform public.send_push(new.swiper_id, 'It''s a match!',
      'You and ' || v_name_target || ' liked each other', jsonb_build_object('match_id', v_match));
  end if;
  return null;
end;
$$;

create trigger swipes_after_insert
  after insert on public.swipes
  for each row execute function public.swipes_after_insert();

-- ================================================================ messages
create or replace function public.messages_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.messages m
       where m.sender_id = new.sender_id
         and m.created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Slow down a little. Try again in a minute.';
  end if;
  new.body := btrim(new.body);
  new.created_at := now();
  new.read_at := null;
  return new;
end;
$$;

create trigger messages_before_insert
  before insert on public.messages
  for each row execute function public.messages_before_insert();

create or replace function public.messages_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_to uuid;
  v_name text;
begin
  select case when m.user_a = new.sender_id then m.user_b else m.user_a end
    into v_to from public.matches m where m.id = new.match_id;
  select first_name into v_name from public.profiles where id = new.sender_id;
  perform public.send_push(v_to, v_name, 'Sent you a message',
    jsonb_build_object('match_id', new.match_id));
  return null;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.messages_after_insert();

-- Recipients may only change read_at; nothing else about a message can change.
create or replace function public.messages_before_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.match_id is distinct from old.match_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Messages cannot be edited';
  end if;
  return new;
end;
$$;

create trigger messages_before_update
  before update on public.messages
  for each row execute function public.messages_before_update();

-- ================================================================ blocks
-- Blocking ends any match between the two people straight away.
create or replace function public.blocks_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.matches
     set unmatched_at = now(), unmatched_by = new.blocker_id
   where user_a = least(new.blocker_id, new.blocked_id)
     and user_b = greatest(new.blocker_id, new.blocked_id)
     and unmatched_at is null;
  return null;
end;
$$;

create trigger blocks_after_insert
  after insert on public.blocks
  for each row execute function public.blocks_after_insert();

-- ================================================================ reports
create or replace function public.reports_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.reports r
       where r.reporter_id = new.reporter_id
         and r.created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have sent a lot of reports today. Our team will review them.';
  end if;
  new.status := 'open';
  new.created_at := now();
  new.reviewed_at := null;
  return new;
end;
$$;

create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();

-- Reporting someone also blocks them for the reporter. Serious reports
-- (under 18, threats) suspend the reported account until a moderator checks.
create or replace function public.reports_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.blocks (blocker_id, blocked_id)
  values (new.reporter_id, new.reported_id)
  on conflict do nothing;

  if new.reason in ('under_18', 'threats') then
    update public.profiles set status = 'suspended'
     where id = new.reported_id and status = 'active';
  end if;
  return null;
end;
$$;

create trigger reports_after_insert
  after insert on public.reports
  for each row execute function public.reports_after_insert();

-- ================================================================ verification
create or replace function public.verification_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.selfie_path !~ ('^' || new.user_id::text || '/[A-Za-z0-9_-]+\.jpg$') then
      raise exception 'Invalid selfie';
    end if;
    if exists (select 1 from public.verification_requests v
                where v.user_id = new.user_id and v.status = 'pending') then
      raise exception 'You already have a verification waiting for review';
    end if;
    new.status := 'pending';
    new.created_at := now();
    new.reviewed_at := null;
  elsif new.status <> old.status then
    -- Only moderators (dashboard / service role) reach this path.
    new.reviewed_at := now();
    if new.status = 'approved' then
      update public.profiles set is_verified = true where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger verification_before_write
  before insert or update on public.verification_requests
  for each row execute function public.verification_before_write();

-- ================================================================ app functions
create or replace function public.age_of(p_birthdate date)
returns int
language sql stable set search_path = ''
as $$
  select extract(year from age(current_date, p_birthdate))::int;
$$;

-- The swipe deck. Returns only public fields, never birthdate or email.
create or replace function public.get_discovery(
  p_limit int default 20,
  p_level smallint default null,
  p_programme text default null,
  p_hall text default null,
  p_looking_for public.looking_for default null
)
returns table (
  id uuid, first_name text, age int, gender public.gender, looking_for public.looking_for,
  bio text, programme text, level smallint, hall text, interests text[], prompts jsonb,
  photos text[], is_verified boolean
)
language sql stable security definer set search_path = ''
as $$
  select o.id, o.first_name, public.age_of(o.birthdate), o.gender, o.looking_for,
         o.bio, o.programme, o.level, o.hall, o.interests, o.prompts,
         o.photos, o.is_verified
    from public.profiles me
    join public.profiles o
      on o.school_id = me.school_id
     and o.id <> me.id
   where me.id = (select auth.uid())
     and me.status = 'active'
     and o.status = 'active'
     and not o.is_paused
     and cardinality(o.photos) > 0
     and o.gender = any (me.show_me)
     and me.gender = any (o.show_me)
     and public.age_of(o.birthdate) between me.min_age and me.max_age
     and public.age_of(me.birthdate) between o.min_age and o.max_age
     and not (o.hide_from_my_programme and o.programme is not null
              and lower(o.programme) = lower(coalesce(me.programme, '')))
     and not (o.hide_from_my_level and o.level is not null and o.level = me.level)
     and not exists (select 1 from public.swipes s where s.swiper_id = me.id and s.target_id = o.id)
     and not exists (select 1 from public.blocks b
                      where (b.blocker_id = me.id and b.blocked_id = o.id)
                         or (b.blocker_id = o.id and b.blocked_id = me.id))
     and (p_level is null or o.level = p_level)
     and (p_programme is null or lower(o.programme) = lower(p_programme))
     and (p_hall is null or lower(o.hall) = lower(p_hall))
     and (p_looking_for is null or o.looking_for = p_looking_for)
   order by o.last_active_at desc, random()
   limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

-- The matches list with the other person's public card and the latest message.
create or replace function public.get_my_matches()
returns table (
  match_id uuid, matched_at timestamptz,
  user_id uuid, first_name text, age int, programme text, level smallint, hall text,
  bio text, interests text[], prompts jsonb, photos text[], is_verified boolean,
  last_message text, last_message_at timestamptz, last_message_mine boolean, unread int
)
language sql stable security definer set search_path = ''
as $$
  select m.id, m.created_at,
         o.id, o.first_name, public.age_of(o.birthdate), o.programme, o.level, o.hall,
         o.bio, o.interests, o.prompts, o.photos, o.is_verified,
         lm.body, lm.created_at, lm.sender_id = (select auth.uid()),
         (select count(*)::int from public.messages x
           where x.match_id = m.id and x.sender_id <> (select auth.uid()) and x.read_at is null)
    from public.matches m
    join public.profiles o
      on o.id = case when m.user_a = (select auth.uid()) then m.user_b else m.user_a end
    left join lateral (
      select x.body, x.created_at, x.sender_id from public.messages x
       where x.match_id = m.id order by x.created_at desc limit 1
    ) lm on true
   where (select auth.uid()) in (m.user_a, m.user_b)
     and m.unmatched_at is null
     and o.status = 'active'
   order by coalesce(lm.created_at, m.created_at) desc;
$$;

create or replace function public.unmatch(p_match uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.matches
     set unmatched_at = now(), unmatched_by = (select auth.uid())
   where id = p_match
     and (select auth.uid()) in (user_a, user_b)
     and unmatched_at is null;
$$;

create or replace function public.mark_match_read(p_match uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.messages
     set read_at = now()
   where match_id = p_match
     and read_at is null
     and sender_id <> (select auth.uid())
     and public.is_active_match_member(p_match, (select auth.uid()));
$$;

create or replace function public.register_push_token(p_token text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not exists (select 1 from public.profiles where id = (select auth.uid())) then
    return;
  end if;
  if p_token !~ '^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'Invalid push token';
  end if;
  insert into public.push_tokens (token, user_id) values (p_token, (select auth.uid()))
  on conflict (token) do update set user_id = excluded.user_id, created_at = now();
end;
$$;

create or replace function public.remove_push_token(p_token text)
returns void
language sql security definer set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = (select auth.uid());
$$;

-- Permanently deletes the signed-in user's account and everything linked to it.
-- The app deletes the user's photo files first, then calls this.
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;

-- ================================================================ row-level security
alter table public.schools enable row level security;
alter table public.email_exceptions enable row level security;
alter table public.banned_emails enable row level security;
alter table public.admins enable row level security;
alter table public.profiles enable row level security;
alter table public.blocks enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.verification_requests enable row level security;
alter table public.push_tokens enable row level security;
-- email_exceptions, banned_emails, admins, push_tokens: no policies on purpose,
-- so only the server (dashboard / service role) can touch them.

create policy "signed-in users read enabled schools" on public.schools
  for select to authenticated using (enabled);

create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "create own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "read own blocks" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "block someone" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));

create policy "read own swipes" on public.swipes
  for select to authenticated using (swiper_id = (select auth.uid()));
create policy "swipe on visible profiles" on public.swipes
  for insert to authenticated
  with check (swiper_id = (select auth.uid())
              and public.can_view_profile((select auth.uid()), target_id));

create policy "read own active matches" on public.matches
  for select to authenticated
  using ((select auth.uid()) in (user_a, user_b) and unmatched_at is null);

create policy "read messages in my matches" on public.messages
  for select to authenticated
  using (public.is_active_match_member(match_id, (select auth.uid())));
create policy "send messages in my matches" on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid())
              and public.is_active_match_member(match_id, (select auth.uid()))
              and exists (select 1 from public.profiles p
                           where p.id = (select auth.uid()) and p.status = 'active'));
create policy "mark received messages read" on public.messages
  for update to authenticated
  using (sender_id <> (select auth.uid())
         and public.is_active_match_member(match_id, (select auth.uid())))
  with check (sender_id <> (select auth.uid()));

create policy "report someone" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy "read own verification" on public.verification_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy "request verification" on public.verification_requests
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ================================================================ grants
-- Supabase grants everything to the public roles by default. Take it all back,
-- then give only what the app needs, column by column where it matters.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select on public.schools to authenticated;

grant select on public.profiles to authenticated;
grant insert (id, first_name, birthdate, gender, show_me, looking_for, bio, programme, level,
              hall, interests, prompts, photos, min_age, max_age, is_paused,
              hide_from_my_programme, hide_from_my_level)
  on public.profiles to authenticated;
grant update (first_name, gender, show_me, looking_for, bio, programme, level, hall, interests,
              prompts, photos, min_age, max_age, is_paused, hide_from_my_programme,
              hide_from_my_level, last_active_at)
  on public.profiles to authenticated;

grant select, insert (blocker_id, blocked_id) on public.blocks to authenticated;
grant select, insert (swiper_id, target_id, liked) on public.swipes to authenticated;
grant select on public.matches to authenticated;
grant select, insert (match_id, sender_id, body), update (read_at) on public.messages to authenticated;
grant insert (reporter_id, reported_id, reason, details, match_id, message_id)
  on public.reports to authenticated;
grant select, insert (user_id, selfie_path, pose) on public.verification_requests to authenticated;

grant execute on function public.check_school_email(text) to anon, authenticated;
grant execute on function public.get_discovery(int, smallint, text, text, public.looking_for) to authenticated;
grant execute on function public.get_my_matches() to authenticated;
grant execute on function public.unmatch(uuid) to authenticated;
grant execute on function public.mark_match_read(uuid) to authenticated;
grant execute on function public.register_push_token(text) to authenticated;
grant execute on function public.remove_push_token(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
-- Used inside RLS policies, so the signed-in role must be able to run them.
grant execute on function public.can_view_profile(uuid, uuid) to authenticated;
grant execute on function public.is_active_match_member(uuid, uuid) to authenticated;
grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;
grant execute on function public.age_of(date) to authenticated;

-- New functions must not be callable by everyone by default.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ================================================================ realtime chat
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;

-- ================================================================ private storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('verifications', 'verifications', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

create or replace function public.can_view_photo_folder(p_folder text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case
    when p_folder ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_view_profile((select auth.uid()), p_folder::uuid)
    else false
  end;
$$;
grant execute on function public.can_view_photo_folder(text) to authenticated;

create policy "upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "replace own photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "view photos of visible profiles" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and public.can_view_photo_folder((storage.foldername(name))[1]));

create policy "upload own verification selfie" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "view own verification selfie" on storage.objects
  for select to authenticated
  using (bucket_id = 'verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own verification selfie" on storage.objects
  for delete to authenticated
  using (bucket_id = 'verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);
