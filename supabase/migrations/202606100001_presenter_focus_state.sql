create table if not exists public.event_presenter_state (
  event_id uuid primary key references public.events(id) on delete cascade,
  focused_question_id uuid references public.questions(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists event_presenter_state_focused_question_idx
on public.event_presenter_state(focused_question_id);

alter table public.event_presenter_state enable row level security;

drop policy if exists event_presenter_state_select_for_event_members
on public.event_presenter_state;

create policy event_presenter_state_select_for_event_members
on public.event_presenter_state
for select
to authenticated
using (public.is_active_event_member(event_presenter_state.event_id, auth.uid()));

drop policy if exists event_presenter_state_insert_for_moderators
on public.event_presenter_state;

create policy event_presenter_state_insert_for_moderators
on public.event_presenter_state
for insert
to authenticated
with check (
  updated_by = auth.uid()
  and public.has_event_role(event_id, auth.uid(), array['organiser', 'moderator']::public.event_role[])
  and (
    focused_question_id is null
    or exists (
      select 1
      from public.questions
      where questions.id = focused_question_id
        and questions.event_id = event_presenter_state.event_id
        and questions.status in ('live', 'answered')
    )
  )
);

drop policy if exists event_presenter_state_update_for_moderators
on public.event_presenter_state;

create policy event_presenter_state_update_for_moderators
on public.event_presenter_state
for update
to authenticated
using (public.has_event_role(event_id, auth.uid(), array['organiser', 'moderator']::public.event_role[]))
with check (
  updated_by = auth.uid()
  and public.has_event_role(event_id, auth.uid(), array['organiser', 'moderator']::public.event_role[])
  and (
    focused_question_id is null
    or exists (
      select 1
      from public.questions
      where questions.id = focused_question_id
        and questions.event_id = event_presenter_state.event_id
        and questions.status in ('live', 'answered')
    )
  )
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'event_presenter_state'
    ) then
      alter publication supabase_realtime add table public.event_presenter_state;
    end if;
  end if;
end;
$$;
