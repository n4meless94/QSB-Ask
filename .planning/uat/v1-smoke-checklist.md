# QSB Ask v1 Smoke Checklist

**Target:** Controlled pilot readiness for `https://ask.qsbportal.com.my`

## Local Automated Checks

Run before deployment:

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
```

Focused checks for Phase 4:

```bash
npm test -- tests/qna/realtime.test.ts tests/surveys/realtime.test.ts tests/health.test.ts
npm run test:e2e -- tests/e2e/qna-realtime.spec.ts tests/e2e/survey-presentation.spec.ts tests/e2e/foundation.spec.ts
```

## Coolify And Domain

- [ ] Coolify application resource exists for QSB Ask.
- [ ] Resource exposes port `3000`.
- [ ] Runtime environment variables are configured in Coolify.
- [ ] Health check path is `/api/health`.
- [ ] Health check returns HTTP 200 with `"ok": true`.
- [ ] Public domain is configured as `https://ask.qsbportal.com.my`.
- [ ] HTTPS certificate is active.
- [ ] Public app URL loads without mixed-content or redirect errors.

## Security And Secrets

- [ ] `/api/health` does not print secret values.
- [ ] Supabase service role key is not visible in browser source, network JSON, CSV files, or logs shared as evidence.
- [ ] Public participant and presenter views show no organiser controls.
- [ ] Pending, dismissed, and archived questions remain hidden from public/presenter views.

## Mobile And Accessibility

- [ ] Participant join page works at 360px width.
- [ ] Participant Q&A page has no horizontal overflow at 360px width.
- [ ] Presenter View has no horizontal overflow at 360px width.
- [ ] Survey submission has visible labels and touch targets.
- [ ] Survey presentation charts include readable labels and table alternatives.
- [ ] Reconnect/refresh-needed banner text is visible and not color-only.
- [ ] `Refresh view` can be reached and activated with keyboard.

## Live Session Smoke

- [ ] Approved Q&A update appears for audience within target timing under normal conditions.
- [ ] Presenter View update appears within target timing under normal conditions.
- [ ] Survey presentation chart update appears within target timing under normal conditions.
- [ ] Offline/reconnecting state appears when network is interrupted.
- [ ] Refresh-needed state prompts the user to refresh after prolonged failure.

Record observed timings and network conditions. Local fixture tests are not a substitute for hosted Supabase Realtime UAT.

## Rollback Readiness

- [ ] Previous Coolify deployment or known good commit is available.
- [ ] Operator knows how to disable routing to an unhealthy deployment.
- [ ] Failed smoke evidence can be recorded without secrets.
