# Pitfalls Research: QSB Ask

## Security And Visibility Pitfalls

- Accidentally returning pending questions to audience APIs.
- Relying on client-side filters instead of server-side visibility rules.
- Using public Supabase client access without strict Row Level Security.
- Exposing participant names/emails in public or CSV contexts where anonymity is expected.

## Live Event Pitfalls

- Vote counts and moderation state drifting between clients.
- Moderator double-action conflicts when two moderators act on the same question.
- Realtime disconnects without visible recovery state.
- Survey result charts showing stale counts during live sessions.

## Product Scope Pitfalls

- Adding Slido-adjacent features before core moderation works.
- Building a large design system before validating workflows.
- Adding Excel/PDF export before CSV export is stable.
- Treating automated moderation as a replacement for human review.

## Deployment Pitfalls

- Deploying outside Coolify and creating an unmanaged VPS service.
- Hardcoding Supabase secrets in source.
- Forgetting Coolify health checks and public HTTPS verification.
- Assuming Supabase free tier custom domains are available.

## Mitigations

- Server-side authorization for every protected action.
- Row Level Security on Supabase tables.
- Dedicated participant-visible query paths.
- Audit history for moderation and edits.
- Health route and deployment checklist.
- Keep v1 scope tied to PRD/SPEC/SRS.

