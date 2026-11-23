-- run in Supabase SQL editor
create table if not exists remote_events (
  id bigint generated always as identity primary key,
  remote_path text not null,
  method text not null,
  direction text not null default 'outgoing',
  args jsonb not null default '[]',
  caller text,
  game_place_id bigint,
  created_at timestamptz not null default now()
);

alter table remote_events enable row level security;

drop policy if exists "allow insert for anon" on remote_events;
create policy "allow insert for anon"
  on remote_events for insert
  to anon
  with check (true);

drop policy if exists "allow select for anon" on remote_events;
create policy "allow select for anon"
  on remote_events for select
  to anon
  using (true);

-- enable realtime (Dashboard → Database → Replication also works)
alter publication supabase_realtime add table remote_events;
