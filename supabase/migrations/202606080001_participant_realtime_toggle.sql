alter table public.events
add column if not exists participant_realtime_enabled boolean not null default true;
