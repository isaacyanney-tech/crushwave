-- Demo profiles for testing before launch.
-- Demo accounts are marked with is_demo. They can never sign in (their emails use
-- the reserved .invalid domain). When someone likes a demo profile, it likes
-- them back straight away and sends the first message, so matching and chat can
-- be tested alone. Remove them all before launch with supabase/demo/remove_demo_profiles.sql.

alter table public.profiles add column is_demo boolean not null default false;
-- Users can't set is_demo themselves: the column-level grants don't include it.

create or replace function public.demo_like_back()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_match uuid;
begin
  if not new.liked then
    return null;
  end if;
  if not exists (select 1 from public.profiles where id = new.target_id and is_demo) then
    return null;
  end if;

  -- The demo likes back, which creates the match through swipes_after_insert.
  insert into public.swipes (swiper_id, target_id, liked)
  values (new.target_id, new.swiper_id, true)
  on conflict (swiper_id, target_id) do update set liked = true;

  select m.id into v_match from public.matches m
   where m.user_a = least(new.swiper_id, new.target_id)
     and m.user_b = greatest(new.swiper_id, new.target_id)
     and m.unmatched_at is null;

  if v_match is not null then
    insert into public.messages (match_id, sender_id, body)
    select v_match, new.target_id,
           (array['Hey! 👋 Glad we matched. How''s your semester going?',
                  'Hi! Nice to match with you 😊 What are you studying?',
                  'Heyy, jollof or waakye? Choose wisely 😄',
                  'Hello! What do you do for fun after lectures?'])[1 + floor(random() * 4)::int];
  end if;
  return null;
end;
$$;

create trigger swipes_demo_like_back
  after insert on public.swipes
  for each row execute function public.demo_like_back();

revoke execute on function public.demo_like_back() from public, anon, authenticated;
