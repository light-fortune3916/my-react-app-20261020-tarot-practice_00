-- Supabase の SQL Editor に貼り付けて1回だけ実行してください。

-- ユーザーごとの情報(有料会員かどうか)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- 練習の記録(採点済みの鑑定)
create table if not exists public.readings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  category text not null,
  sub text not null,
  cards jsonb not null,          -- [{ id, reversed, position }]
  consultation jsonb not null,   -- 相談者と相談内容
  answer text not null,
  hint_used boolean not null default false,
  scores jsonb not null,         -- { card, story, empathy, delivery }
  total integer not null,
  feedback jsonb not null        -- { good, improve, cardFeedback, modelReading, penalty }
);
create index if not exists readings_user_created on public.readings (user_id, created_at desc);

-- 回数制限のための利用記録
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('question', 'score')),
  created_at timestamptz not null default now()
);
create index if not exists usage_user_kind_created on public.usage_events (user_id, kind, created_at);

-- 権限:本人は自分のデータを読むだけ。書き込みはサーバー(service_role)だけが行う
alter table public.profiles enable row level security;
alter table public.readings enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "read own readings" on public.readings;
create policy "read own readings" on public.readings
  for select using (auth.uid() = user_id);

drop policy if exists "read own usage" on public.usage_events;
create policy "read own usage" on public.usage_events
  for select using (auth.uid() = user_id);

-- テーブルへのアクセス権(新しい Supabase では自動で付かないため明示する)
-- 本人(ログイン中のユーザー)は読み取りだけ。行ごとの制限は上の policy で行う
grant select on public.profiles, public.readings, public.usage_events to authenticated;
-- サーバー(service_role)は読み書きできる
grant select, insert, update, delete on public.profiles, public.readings, public.usage_events to service_role;
grant usage, select on all sequences in schema public to service_role;
