create or replace function public.moderate_question_action(
  target_event_id uuid,
  target_question_id uuid,
  actor_user_id uuid,
  expected_status public.question_status,
  expected_updated_at timestamptz,
  moderation_action public.moderation_action,
  target_status public.question_status,
  action_metadata jsonb default '{}'::jsonb
)
returns setof public.questions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_question public.questions%rowtype;
  next_status public.question_status;
  next_previous_status public.question_status;
  updated_question public.questions%rowtype;
begin
  if actor_user_id is null or actor_user_id <> auth.uid() then
    raise exception 'Moderator identity could not be verified.';
  end if;

  if not public.has_event_role(
    target_event_id,
    actor_user_id,
    array['organiser', 'moderator']::public.event_role[]
  ) then
    raise exception 'You do not have access to moderate this event.';
  end if;

  select *
  into current_question
  from public.questions
  where id = target_question_id
    and event_id = target_event_id
  for update;

  if not found
    or current_question.status <> expected_status
    or current_question.updated_at <> expected_updated_at then
    return;
  end if;

  next_status := target_status;
  next_previous_status := current_question.previous_status;

  if moderation_action = 'approve' then
    if expected_status <> 'pending' or target_status <> 'live' then
      raise exception 'Question cannot be approved from this state.';
    end if;
    next_previous_status := null;
  elsif moderation_action = 'dismiss' then
    if target_status <> 'archived' or expected_status = 'archived' then
      raise exception 'Question cannot be dismissed from this state.';
    end if;
    next_previous_status := current_question.status;
  elsif moderation_action = 'archive' then
    if target_status <> 'archived' or expected_status = 'archived' then
      raise exception 'Question cannot be archived from this state.';
    end if;
    next_previous_status := current_question.status;
  elsif moderation_action = 'restore' then
    if expected_status <> 'archived' or current_question.previous_status is null then
      raise exception 'Question cannot be restored from this state.';
    end if;
    next_status := current_question.previous_status;
    next_previous_status := null;
  elsif moderation_action = 'mark_answered' then
    if expected_status <> 'live' or target_status <> 'answered' then
      raise exception 'Only live questions can be marked answered.';
    end if;
    next_previous_status := null;
  else
    raise exception 'Unsupported moderation action.';
  end if;

  update public.questions
  set status = next_status,
      previous_status = next_previous_status
  where id = current_question.id
  returning * into updated_question;

  insert into public.moderation_actions (
    question_id,
    event_id,
    actor_user_id,
    action,
    from_status,
    to_status,
    metadata
  )
  values (
    current_question.id,
    current_question.event_id,
    actor_user_id,
    moderation_action,
    current_question.status,
    updated_question.status,
    coalesce(action_metadata, '{}'::jsonb)
  );

  return next updated_question;
end;
$$;

create or replace function public.edit_question_action(
  target_event_id uuid,
  target_question_id uuid,
  actor_user_id uuid,
  expected_status public.question_status,
  expected_updated_at timestamptz,
  next_text text
)
returns setof public.questions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_question public.questions%rowtype;
  next_version integer;
  normalized_text text;
  updated_question public.questions%rowtype;
begin
  if actor_user_id is null or actor_user_id <> auth.uid() then
    raise exception 'Moderator identity could not be verified.';
  end if;

  if not public.has_event_role(
    target_event_id,
    actor_user_id,
    array['organiser', 'moderator']::public.event_role[]
  ) then
    raise exception 'You do not have access to moderate this event.';
  end if;

  normalized_text := btrim(regexp_replace(coalesce(next_text, ''), '\s+', ' ', 'g'));

  if length(normalized_text) = 0 then
    raise exception 'Question text is required.';
  end if;

  select *
  into current_question
  from public.questions
  where id = target_question_id
    and event_id = target_event_id
  for update;

  if not found
    or current_question.status <> expected_status
    or current_question.updated_at <> expected_updated_at then
    return;
  end if;

  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.question_versions
  where question_id = current_question.id;

  update public.questions
  set current_text = normalized_text,
      is_edited = true
  where id = current_question.id
  returning * into updated_question;

  insert into public.question_versions (
    question_id,
    version_number,
    text,
    edited_by
  )
  values (
    current_question.id,
    next_version,
    normalized_text,
    actor_user_id
  );

  insert into public.moderation_actions (
    question_id,
    event_id,
    actor_user_id,
    action,
    from_status,
    to_status,
    metadata
  )
  values (
    current_question.id,
    current_question.event_id,
    actor_user_id,
    'edit',
    current_question.status,
    current_question.status,
    jsonb_build_object(
      'previous_text', current_question.current_text,
      'next_text', normalized_text,
      'version_number', next_version
    )
  );

  return next updated_question;
end;
$$;

create index if not exists questions_event_status_vote_submitted_idx
on public.questions(event_id, status, vote_count desc, submitted_at desc);
