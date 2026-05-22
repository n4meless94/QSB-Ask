create extension if not exists pgcrypto with schema extensions;

create type public.event_status as enum ('draft', 'active', 'ended', 'archived');
create type public.identity_mode as enum ('anonymous', 'name_required', 'name_email_required');
create type public.event_role as enum ('organiser', 'moderator', 'speaker');
create type public.member_status as enum ('invited', 'active', 'removed');
create type public.question_status as enum ('pending', 'live', 'answered', 'archived');
create type public.moderation_action as enum ('approve', 'dismiss', 'edit', 'archive', 'restore', 'mark_answered');
create type public.survey_status as enum ('draft', 'published', 'closed');
create type public.survey_question_type as enum ('multiple_choice', 'multiple_select', 'rating', 'open_text');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_unique_join_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  index_value integer;
begin
  loop
    candidate := '';

    for index_value in 1..8 loop
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet) + 1)::integer, 1);
    end loop;

    exit when not exists (
      select 1
      from public.events
      where join_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint users_email_key unique (email),
  constraint users_email_lowercase check (email = lower(email)),
  constraint users_display_name_not_blank check (length(btrim(display_name)) > 0)
);

create table public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  join_code text not null default public.generate_unique_join_code(),
  starts_at timestamptz not null,
  ends_at timestamptz,
  time_zone text not null default 'Asia/Kuala_Lumpur',
  status public.event_status not null default 'draft',
  identity_mode public.identity_mode not null default 'anonymous',
  moderation_enabled boolean not null default true,
  question_character_limit integer not null default 280,
  duplicate_block_enabled boolean not null default true,
  question_rate_limit_seconds integer not null default 30,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_join_code_key unique (join_code),
  constraint events_name_not_blank check (length(btrim(name)) > 0),
  constraint events_time_zone_not_blank check (length(btrim(time_zone)) > 0),
  constraint events_end_after_start check (ends_at is null or ends_at > starts_at),
  constraint events_question_character_limit_range check (question_character_limit between 50 and 1000),
  constraint events_question_rate_limit_seconds_range check (question_rate_limit_seconds between 5 and 300),
  constraint events_join_code_format check (join_code ~ '^[A-Z2-9]{8}$')
);

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create table public.event_members (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role public.event_role not null,
  invited_email text,
  status public.member_status not null default 'invited',
  created_at timestamptz not null default now(),
  constraint event_members_user_or_invite check (user_id is not null or invited_email is not null),
  constraint event_members_invited_email_lowercase check (invited_email is null or invited_email = lower(invited_email)),
  constraint event_members_user_role_key unique (event_id, user_id, role),
  constraint event_members_invited_email_role_key unique (event_id, invited_email, role)
);

create table public.participant_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text,
  email text,
  session_token_hash text not null,
  created_at timestamptz not null default now(),
  constraint participant_sessions_token_hash_key unique (session_token_hash),
  constraint participant_sessions_email_lowercase check (email is null or email = lower(email))
);

create table public.questions (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_session_id uuid not null references public.participant_sessions(id) on delete restrict,
  current_text text not null,
  status public.question_status not null default 'pending',
  previous_status public.question_status,
  vote_count integer not null default 0,
  is_edited boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_current_text_not_blank check (length(btrim(current_text)) > 0),
  constraint questions_vote_count_non_negative check (vote_count >= 0),
  constraint questions_previous_status_not_archived check (previous_status is null or previous_status <> 'archived')
);

create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create table public.question_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  version_number integer not null,
  text text not null,
  edited_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint question_versions_version_positive check (version_number > 0),
  constraint question_versions_text_not_blank check (length(btrim(text)) > 0),
  constraint question_versions_question_version_key unique (question_id, version_number)
);

create table public.question_votes (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  participant_session_id uuid not null references public.participant_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint question_votes_one_per_session unique (question_id, participant_session_id)
);

create table public.moderation_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action public.moderation_action not null,
  from_status public.question_status,
  to_status public.question_status,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint moderation_actions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.surveys (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  status public.survey_status not null default 'draft',
  results_visible_to_participants boolean not null default false,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint surveys_title_not_blank check (length(btrim(title)) > 0)
);

create trigger surveys_set_updated_at
before update on public.surveys
for each row execute function public.set_updated_at();

create table public.survey_questions (
  id uuid primary key default extensions.gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  type public.survey_question_type not null,
  prompt text not null,
  position integer not null,
  rating_scale integer,
  created_at timestamptz not null default now(),
  constraint survey_questions_prompt_not_blank check (length(btrim(prompt)) > 0),
  constraint survey_questions_position_non_negative check (position >= 0),
  constraint survey_questions_rating_scale check (
    (type = 'rating' and rating_scale in (5, 10))
    or (type <> 'rating' and rating_scale is null)
  ),
  constraint survey_questions_survey_position_key unique (survey_id, position)
);

create table public.survey_options (
  id uuid primary key default extensions.gen_random_uuid(),
  survey_question_id uuid not null references public.survey_questions(id) on delete cascade,
  label text not null,
  position integer not null,
  constraint survey_options_label_not_blank check (length(btrim(label)) > 0),
  constraint survey_options_position_non_negative check (position >= 0),
  constraint survey_options_question_position_key unique (survey_question_id, position)
);

create table public.survey_responses (
  id uuid primary key default extensions.gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  participant_session_id uuid not null references public.participant_sessions(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  constraint survey_responses_one_per_session unique (survey_id, participant_session_id)
);

create table public.survey_answers (
  id uuid primary key default extensions.gen_random_uuid(),
  survey_response_id uuid not null references public.survey_responses(id) on delete cascade,
  survey_question_id uuid not null references public.survey_questions(id) on delete cascade,
  selected_option_ids uuid[],
  rating_value integer,
  text_value text,
  constraint survey_answers_response_question_key unique (survey_response_id, survey_question_id),
  constraint survey_answers_rating_value_range check (rating_value is null or rating_value between 1 and 10)
);

create table public.login_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  email text not null,
  attempted_at timestamptz not null default now(),
  success boolean not null,
  ip_hash text,
  constraint login_attempts_email_lowercase check (email = lower(email))
);

create index events_created_by_idx on public.events(created_by);
create index events_status_starts_at_idx on public.events(status, starts_at);
create index event_members_user_status_idx on public.event_members(user_id, status);
create index event_members_event_role_status_idx on public.event_members(event_id, role, status);
create index participant_sessions_event_id_idx on public.participant_sessions(event_id);
create index questions_event_status_submitted_idx on public.questions(event_id, status, submitted_at desc);
create index questions_event_vote_count_idx on public.questions(event_id, vote_count desc);
create index question_versions_question_id_idx on public.question_versions(question_id);
create index question_votes_participant_session_id_idx on public.question_votes(participant_session_id);
create index moderation_actions_event_created_idx on public.moderation_actions(event_id, created_at desc);
create index surveys_event_status_idx on public.surveys(event_id, status);
create index survey_questions_survey_position_idx on public.survey_questions(survey_id, position);
create index survey_options_question_position_idx on public.survey_options(survey_question_id, position);
create index survey_responses_survey_id_idx on public.survey_responses(survey_id);
create index survey_answers_question_id_idx on public.survey_answers(survey_question_id);
create index login_attempts_email_attempted_idx on public.login_attempts(email, attempted_at desc);

create or replace function public.is_active_event_member(target_event_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_members
    where event_id = target_event_id
      and user_id = target_user_id
      and status = 'active'
  );
$$;

create or replace function public.has_event_role(
  target_event_id uuid,
  target_user_id uuid,
  allowed_roles public.event_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_members
    where event_id = target_event_id
      and user_id = target_user_id
      and role = any(allowed_roles)
      and status = 'active'
  );
$$;

create or replace function public.current_participant_session_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'participant_session_id',
      current_setting('request.headers', true)::jsonb ->> 'x-qsb-participant-session-id'
    ),
    ''
  )::uuid;
$$;

create or replace function public.is_current_participant_for_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.participant_sessions
    where id = public.current_participant_session_id()
      and event_id = target_event_id
  );
$$;

create or replace function public.create_event_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_members (event_id, user_id, role, status)
  values (new.id, new.created_by, 'organiser', 'active')
  on conflict (event_id, user_id, role) do update
  set status = 'active';

  return new;
end;
$$;

create trigger events_create_owner_membership
after insert on public.events
for each row execute function public.create_event_owner_membership();

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.participant_sessions enable row level security;
alter table public.questions enable row level security;
alter table public.question_versions enable row level security;
alter table public.question_votes enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_options enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers enable row level security;
alter table public.login_attempts enable row level security;

create policy users_select_own
on public.users
for select
to authenticated
using (id = auth.uid());

create policy users_insert_own
on public.users
for insert
to authenticated
with check (id = auth.uid());

create policy users_update_own
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy events_select_for_members
on public.events
for select
to authenticated
using (
  events.created_by = auth.uid()
  or public.is_active_event_member(events.id, auth.uid())
);

create policy events_insert_for_authenticated
on public.events
for insert
to authenticated
with check (created_by = auth.uid());

create policy events_update_for_organisers
on public.events
for update
to authenticated
using (public.has_event_role(events.id, auth.uid(), array['organiser']::public.event_role[]))
with check (public.has_event_role(events.id, auth.uid(), array['organiser']::public.event_role[]));

create policy event_members_select_for_members
on public.event_members
for select
to authenticated
using (public.is_active_event_member(event_members.event_id, auth.uid()));

create policy event_members_insert_for_organisers
on public.event_members
for insert
to authenticated
with check (public.has_event_role(event_id, auth.uid(), array['organiser']::public.event_role[]));

create policy event_members_update_for_organisers
on public.event_members
for update
to authenticated
using (public.has_event_role(event_members.event_id, auth.uid(), array['organiser']::public.event_role[]))
with check (public.has_event_role(event_members.event_id, auth.uid(), array['organiser']::public.event_role[]));

create policy participant_sessions_insert_for_active_events
on public.participant_sessions
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.events
    where events.id = participant_sessions.event_id
      and events.status = 'active'
  )
);

create policy participant_sessions_select_for_members
on public.participant_sessions
for select
to authenticated
using (public.is_active_event_member(participant_sessions.event_id, auth.uid()));

create policy participant_sessions_select_current
on public.participant_sessions
for select
to anon, authenticated
using (id = public.current_participant_session_id());

create policy questions_select_for_event_members
on public.questions
for select
to authenticated
using (public.is_active_event_member(questions.event_id, auth.uid()));

create policy questions_participant_select_public_visible
on public.questions
for select
to anon, authenticated
using (
  status in ('live', 'answered')
  and public.is_current_participant_for_event(questions.event_id)
);

create policy questions_insert_for_current_participant
on public.questions
for insert
to anon, authenticated
with check (
  participant_session_id = public.current_participant_session_id()
  and public.is_current_participant_for_event(event_id)
);

create policy questions_update_for_moderators
on public.questions
for update
to authenticated
using (public.has_event_role(questions.event_id, auth.uid(), array['organiser', 'moderator']::public.event_role[]))
with check (public.has_event_role(questions.event_id, auth.uid(), array['organiser', 'moderator']::public.event_role[]));

create policy question_versions_select_for_event_members
on public.question_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.questions
    where questions.id = question_versions.question_id
      and public.is_active_event_member(questions.event_id, auth.uid())
  )
);

create policy question_versions_select_for_visible_questions
on public.question_versions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.questions
    where questions.id = question_versions.question_id
      and questions.status in ('live', 'answered')
      and public.is_current_participant_for_event(questions.event_id)
  )
);

create policy question_versions_insert_for_moderators
on public.question_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.questions
    where questions.id = question_versions.question_id
      and public.has_event_role(questions.event_id, auth.uid(), array['organiser', 'moderator']::public.event_role[])
  )
);

create policy question_votes_select_for_event_members
on public.question_votes
for select
to authenticated
using (
  exists (
    select 1
    from public.questions
    where questions.id = question_votes.question_id
      and public.is_active_event_member(questions.event_id, auth.uid())
  )
);

create policy question_votes_insert_for_current_participant
on public.question_votes
for insert
to anon, authenticated
with check (
  participant_session_id = public.current_participant_session_id()
  and exists (
    select 1
    from public.questions
    where questions.id = question_votes.question_id
      and questions.status = 'live'
      and public.is_current_participant_for_event(questions.event_id)
  )
);

create policy moderation_actions_select_for_event_members
on public.moderation_actions
for select
to authenticated
using (public.is_active_event_member(moderation_actions.event_id, auth.uid()));

create policy moderation_actions_insert_for_moderators
on public.moderation_actions
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and public.has_event_role(event_id, auth.uid(), array['organiser', 'moderator']::public.event_role[])
);

create policy surveys_select_for_event_members
on public.surveys
for select
to authenticated
using (public.is_active_event_member(surveys.event_id, auth.uid()));

create policy surveys_select_published_for_participants
on public.surveys
for select
to anon, authenticated
using (
  status = 'published'
  and public.is_current_participant_for_event(surveys.event_id)
);

create policy surveys_insert_for_organisers
on public.surveys
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_event_role(event_id, auth.uid(), array['organiser']::public.event_role[])
);

create policy surveys_update_for_organisers
on public.surveys
for update
to authenticated
using (public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[]))
with check (public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[]));

create policy survey_questions_select_for_event_members
on public.survey_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.surveys
    where surveys.id = survey_questions.survey_id
      and public.is_active_event_member(surveys.event_id, auth.uid())
  )
);

create policy survey_questions_select_for_participants
on public.survey_questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.surveys
    where surveys.id = survey_questions.survey_id
      and surveys.status = 'published'
      and public.is_current_participant_for_event(surveys.event_id)
  )
);

create policy survey_questions_insert_for_organisers
on public.survey_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.surveys
    where surveys.id = survey_questions.survey_id
      and public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[])
  )
);

create policy survey_questions_update_for_organisers
on public.survey_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.surveys
    where surveys.id = survey_questions.survey_id
      and public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[])
  )
)
with check (
  exists (
    select 1
    from public.surveys
    where surveys.id = survey_questions.survey_id
      and public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[])
  )
);

create policy survey_options_select_for_event_members
on public.survey_options
for select
to authenticated
using (
  exists (
    select 1
    from public.survey_questions
    join public.surveys on surveys.id = survey_questions.survey_id
    where survey_questions.id = survey_options.survey_question_id
      and public.is_active_event_member(surveys.event_id, auth.uid())
  )
);

create policy survey_options_select_for_participants
on public.survey_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.survey_questions
    join public.surveys on surveys.id = survey_questions.survey_id
    where survey_questions.id = survey_options.survey_question_id
      and surveys.status = 'published'
      and public.is_current_participant_for_event(surveys.event_id)
  )
);

create policy survey_options_insert_for_organisers
on public.survey_options
for insert
to authenticated
with check (
  exists (
    select 1
    from public.survey_questions
    join public.surveys on surveys.id = survey_questions.survey_id
    where survey_questions.id = survey_options.survey_question_id
      and public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[])
  )
);

create policy survey_options_update_for_organisers
on public.survey_options
for update
to authenticated
using (
  exists (
    select 1
    from public.survey_questions
    join public.surveys on surveys.id = survey_questions.survey_id
    where survey_questions.id = survey_options.survey_question_id
      and public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[])
  )
)
with check (
  exists (
    select 1
    from public.survey_questions
    join public.surveys on surveys.id = survey_questions.survey_id
    where survey_questions.id = survey_options.survey_question_id
      and public.has_event_role(surveys.event_id, auth.uid(), array['organiser']::public.event_role[])
  )
);

create policy survey_responses_select_for_event_members
on public.survey_responses
for select
to authenticated
using (
  exists (
    select 1
    from public.surveys
    where surveys.id = survey_responses.survey_id
      and public.is_active_event_member(surveys.event_id, auth.uid())
  )
);

create policy survey_responses_select_own
on public.survey_responses
for select
to anon, authenticated
using (participant_session_id = public.current_participant_session_id());

create policy survey_responses_insert_for_current_participant
on public.survey_responses
for insert
to anon, authenticated
with check (
  participant_session_id = public.current_participant_session_id()
  and exists (
    select 1
    from public.surveys
    where surveys.id = survey_responses.survey_id
      and surveys.status = 'published'
      and public.is_current_participant_for_event(surveys.event_id)
  )
);

create policy survey_answers_select_for_event_members
on public.survey_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.survey_responses
    join public.surveys on surveys.id = survey_responses.survey_id
    where survey_responses.id = survey_answers.survey_response_id
      and public.is_active_event_member(surveys.event_id, auth.uid())
  )
);

create policy survey_answers_select_own
on public.survey_answers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.survey_responses
    where survey_responses.id = survey_answers.survey_response_id
      and survey_responses.participant_session_id = public.current_participant_session_id()
  )
);

create policy survey_answers_insert_for_current_participant
on public.survey_answers
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.survey_responses
    where survey_responses.id = survey_answers.survey_response_id
      and survey_responses.participant_session_id = public.current_participant_session_id()
  )
);

create policy login_attempts_insert_audit_records
on public.login_attempts
for insert
to anon, authenticated
with check (true);
