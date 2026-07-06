-- ============================================================
-- PeeyashStudy — full database schema
-- Paste this entire file into: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- MIGRATION (run this if your schema.sql above already ran once before):
-- alter table profiles add column if not exists avatar_url text;
-- alter table document_cache add column if not exists worked_example jsonb;
-- (then run the CREATE TABLE blocks below for: deadlines, quiz_answers, study_rooms,
--  room_members — plus their RLS policies near the bottom of this file — since those
--  are brand new tables that won't exist yet on an already-initialized project)

-- PROFILES ----------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  school text default 'MIVA',
  plan text default 'free',
  plan_expires_at timestamptz,
  auto_renew_from_wallet boolean default false,
  referral_code text unique not null,
  referred_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- WALLETS -----------------------------------------------------
create table if not exists wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance_kobo bigint default 0 check (balance_kobo >= 0),
  updated_at timestamptz default now()
);

-- TRANSACTIONS (append-only ledger) ---------------------------
create table if not exists transactions (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  type text not null, -- referral_bonus | subscription_payment | withdrawal | withdrawal_refund | sub_renewal_from_wallet
  amount_kobo bigint not null,
  reference text,
  meta jsonb,
  created_at timestamptz default now()
);

-- DOCUMENT CACHE ----------------------------------------------
create table if not exists document_cache (
  cache_key text primary key,
  course_code text,
  doc_type text default 'tma',
  extracted_text text,
  breakdown jsonb,
  quiz jsonb,
  worked_example jsonb,
  hit_count int default 0,
  created_at timestamptz default now()
);

-- UPLOADS -----------------------------------------------------
create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  cache_key text references document_cache(cache_key),
  original_name text,
  created_at timestamptz default now()
);

-- QUIZ ATTEMPTS -----------------------------------------------
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  cache_key text references document_cache(cache_key),
  score int,
  total int,
  created_at timestamptz default now()
);

-- REFERRALS ---------------------------------------------------
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id),
  referred_id uuid unique references profiles(id),
  status text default 'signed_up', -- signed_up | credited
  credited_at timestamptz,
  created_at timestamptz default now()
);

-- WITHDRAWALS -------------------------------------------------
create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  amount_kobo bigint not null,
  bank_name text,
  account_number text,
  account_name text,
  status text default 'pending', -- pending | paid | rejected
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- DEADLINES ----------------------------------------------------
create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  course_code text,
  due_date timestamptz not null,
  created_at timestamptz default now()
);

-- QUIZ ANSWERS (per-question detail, powers "you keep missing X" aggregation) --
create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references quiz_attempts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  concept text,
  correct boolean,
  created_at timestamptz default now()
);

-- STUDY ROOMS ----------------------------------------------------
create table if not exists study_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course_code text,
  invite_code text unique not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists room_members (
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

-- FEEDBACK ----------------------------------------------------
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  rating int check (rating between 1 and 5),
  message text,
  created_at timestamptz default now()
);

-- USAGE (free-tier limits; period = 'YYYY-MM' or 'YYYY-MM-DD') -
create table if not exists usage (
  user_id uuid references profiles(id) on delete cascade,
  period text not null,
  kind text not null, -- uploads | quizzes | chat
  used int default 0,
  primary key (user_id, period, kind)
);

-- ============================================================
-- SIGNUP TRIGGER: creates profile + wallet + referral record
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_code text;
  ref_input text;
  referrer uuid;
begin
  loop
    new_code := 'PEE-' || upper(substr(md5(random()::text), 1, 5));
    exit when not exists (select 1 from profiles where referral_code = new_code);
  end loop;

  ref_input := new.raw_user_meta_data ->> 'ref';
  if ref_input is not null and ref_input <> '' then
    select id into referrer from profiles where referral_code = upper(trim(ref_input));
  end if;

  insert into profiles (id, email, full_name, referral_code, referred_by)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new_code, referrer);

  insert into wallets (user_id) values (new.id);

  if referrer is not null then
    insert into referrals (referrer_id, referred_id) values (referrer, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table document_cache enable row level security;
alter table uploads enable row level security;
alter table quiz_attempts enable row level security;
alter table referrals enable row level security;
alter table withdrawals enable row level security;
alter table feedback enable row level security;
alter table usage enable row level security;
alter table deadlines enable row level security;
alter table quiz_answers enable row level security;
alter table study_rooms enable row level security;
alter table room_members enable row level security;

create policy "own profile read" on profiles for select using (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id);

create policy "own wallet read" on wallets for select using (auth.uid() = user_id);

create policy "own transactions read" on transactions for select using (auth.uid() = user_id);

create policy "cache readable" on document_cache for select using (auth.role() = 'authenticated');

create policy "own uploads read" on uploads for select using (auth.uid() = user_id);

create policy "own attempts read" on quiz_attempts for select using (auth.uid() = user_id);
create policy "own attempts insert" on quiz_attempts for insert with check (auth.uid() = user_id);

create policy "own referrals read" on referrals for select using (auth.uid() = referrer_id);

create policy "own withdrawals read" on withdrawals for select using (auth.uid() = user_id);

create policy "own feedback insert" on feedback for insert with check (auth.uid() = user_id);
create policy "own feedback read" on feedback for select using (auth.uid() = user_id);

-- usage table: no client policies (server/service role only)

create policy "own deadlines read" on deadlines for select using (auth.uid() = user_id);
create policy "own deadlines insert" on deadlines for insert with check (auth.uid() = user_id);
create policy "own deadlines delete" on deadlines for delete using (auth.uid() = user_id);

create policy "own quiz answers read" on quiz_answers for select using (auth.uid() = user_id);
create policy "own quiz answers insert" on quiz_answers for insert with check (auth.uid() = user_id);
-- cross-member aggregation for study rooms is done server-side with the service role key,
-- so no additional cross-user policy is needed here — individual answers stay private by default.

create policy "rooms are viewable by any signed-in user" on study_rooms for select using (auth.role() = 'authenticated');
create policy "users can create rooms" on study_rooms for insert with check (auth.uid() = created_by);

create policy "members can view their own rooms roster" on room_members for select using (
  room_id in (select room_id from room_members where user_id = auth.uid())
);
create policy "users can join rooms as themselves" on room_members for insert with check (auth.uid() = user_id);
create policy "users can leave rooms" on room_members for delete using (auth.uid() = user_id);

-- ============================================================
-- STORAGE POLICIES for the 'avatars' bucket
-- Run this AFTER creating the 'avatars' bucket in Supabase Dashboard > Storage.
-- Without these, uploads will fail even if the bucket exists and is marked "Public".
-- "Public" only controls read access — write access needs these policies.
-- ============================================================
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
