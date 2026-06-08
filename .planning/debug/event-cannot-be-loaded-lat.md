---
status: resolved
trigger: "event cannot be loaded in latest push"
created: "2026-06-09T00:20:27+08:00"
updated: "2026-06-09T00:38:00+08:00"
---

# Debug Session: event-cannot-be-loaded-lat

## Symptoms
- expected_behavior: "Signed-in Event Dashboard should list accessible Q&A and survey events."
- actual_behavior: "Production `/dashboard` renders the error card: Events could not be loaded."
- error_messages: "Events could not be loaded. Events could not be loaded. Refresh the page or try again."
- timeline: "Reported after the latest push/deploy. GHCR workflow run #48 for commit 9894dee succeeded at 2026-06-08T16:16:37Z."
- reproduction: "Sign in to production QSB Ask and open `/dashboard`."

## Current Focus
- hypothesis: "The dashboard Supabase query in `listAccessibleEvents()` fails in production because the latest app image selects a column that has not been migrated in managed Supabase."
- test: "Probe production PostgREST from inside the live app container using service-role headers without printing secrets."
- expecting: "`events?select=id` succeeds but `events?select=id,participant_realtime_enabled` fails if the migration is missing."
- next_action: "ask user to refresh signed-in production `/dashboard` in browser"
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence
- timestamp: "2026-06-09T00:20:27+08:00"
  observation: "Public health endpoint returns ok=true, so the deployed app is running and configured."
- timestamp: "2026-06-09T00:20:27+08:00"
  observation: "Run #48 built and deployed commit 9894dee successfully; run #47 failed before build due to a transient BuildKit pull timeout."
- timestamp: "2026-06-09T00:29:00+08:00"
  observation: "Official QSB VPS Coolify container is healthy and running GHCR image revision 9894dee5949a72483009f21584d5817cf3d761f5."
- timestamp: "2026-06-09T00:31:00+08:00"
  observation: "Production PostgREST probe from inside the live app container returned 200 for `events?select=id` and 400 code 42703 for `events?select=id,participant_realtime_enabled` with message `column events.participant_realtime_enabled does not exist`."
- timestamp: "2026-06-09T00:32:00+08:00"
  observation: "Repo migration `supabase/migrations/202606080001_participant_realtime_toggle.sql` adds `public.events.participant_realtime_enabled boolean not null default true`, matching the missing production column."
- timestamp: "2026-06-09T00:36:00+08:00"
  observation: "Applied the missing managed Supabase schema change with `supabase db query --linked`: `alter table public.events add column if not exists participant_realtime_enabled boolean not null default true;`."
- timestamp: "2026-06-09T00:37:00+08:00"
  observation: "Post-migration schema query confirms `participant_realtime_enabled` exists on `public.events` as `boolean not null default true`."
- timestamp: "2026-06-09T00:37:00+08:00"
  observation: "Post-migration live app container probe returns 200 for `events?select=id,participant_realtime_enabled`."
- timestamp: "2026-06-09T00:38:00+08:00"
  observation: "Post-migration dashboard-style nested PostgREST query `event_members?select=events(...participant_realtime_enabled...)` returns 200."

## Eliminated
- hypothesis: "Whole app outage or missing runtime configuration."
  reason: "Production `/api/health` returns ok=true with configured=true and no missing keys."
- hypothesis: "Latest GHCR image failed to deploy."
  reason: "Production container OCI label `org.opencontainers.image.revision` matches latest successful commit 9894dee."

## Resolution
- root_cause: "Managed Supabase production schema is behind the deployed app code. The app now selects `events.participant_realtime_enabled`, but production Postgres does not yet have that column."
- fix: "Applied `supabase/migrations/202606080001_participant_realtime_toggle.sql` to the managed Supabase project: `alter table public.events add column if not exists participant_realtime_enabled boolean not null default true;`."
- verification: "Before fix: live schema probe returned Postgres code 42703 for `participant_realtime_enabled`. After fix: schema query confirms the column exists, the live app container probe for `events?select=id,participant_realtime_enabled` returns 200, the dashboard-style nested `event_members` query returns 200, and production `/api/health` remains ok=true."
- files_changed: ".planning/debug/event-cannot-be-loaded-lat.md"
