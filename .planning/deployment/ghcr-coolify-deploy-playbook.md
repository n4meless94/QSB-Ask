# QSB Ask GHCR To Coolify Deploy Playbook

**Purpose:** repeat the current QSB Ask production deployment path without rediscovering branch, image, host, or Coolify details.

Use this for normal source changes after local verification has passed. QSB Ask must stay a Coolify-managed application; do not replace it with an ad hoc long-lived Docker service.

## Current Production Shape

| Item | Value |
| --- | --- |
| GitHub repo | `n4meless94/QSB-Ask` |
| Deploy branch | `main` |
| Local branch note | Local `main` tracks `origin/main`; do not recreate a parallel `master` branch. |
| GHCR workflow | `.github/workflows/publish-ghcr.yml` |
| Production image | `ghcr.io/n4meless94/qsb-ask:latest` |
| Coolify app UUID | `btstg1x4zzuqjc16yf4qluqv` |
| Coolify app name | `QSB Ask` |
| Public URL | `https://ask.qsbportal.com.my` |
| Health URL | `https://ask.qsbportal.com.my/api/health` |

Always verify DNS before SSH. On 2026-06-04, `ask.qsbportal.com.my` resolved to `194.195.90.73`, while the local `ssh qsb` alias pointed to a different QSB VPS host. Inspect the DNS-origin host for production QSB Ask containers.

## Golden Path

### 1. Inspect The Working Tree

```powershell
git status --short --branch
git log --oneline --decorate -n 5
git branch -a
```

Only stage files that belong to the current task. Leave unrelated local files unstaged.

### 2. Run Local Deploy Gates

```powershell
npm run lint
npm test
npx tsc --noEmit
npm run build
```

Optional focused smoke:

```powershell
npm run test:e2e -- tests/e2e/foundation.spec.ts
```

Do not deploy if a failure is plausibly caused by the current change. If an unrelated known failure blocks the gate, record the evidence and get an explicit decision before deploying.

### 3. Commit

```powershell
git add -- <intended-files>
git diff --cached --name-only
git commit -m "<type>: <summary>"
```

### 4. Push To The Deploy Branch

The GHCR `latest` image is published from `main`, so the local branch should be `main` before pushing.

```powershell
git branch --show-current
git push origin main
```

### 5. Wait For GHCR Publish

If `gh` is unavailable, use the public GitHub Actions API:

```powershell
$headers = @{ "User-Agent" = "qsb-ask-deploy-check" }
$headSha = git rev-parse HEAD
$runs = Invoke-RestMethod `
  -Uri "https://api.github.com/repos/n4meless94/QSB-Ask/actions/runs?branch=main&per_page=10" `
  -Headers $headers
$run = $runs.workflow_runs | Where-Object { $_.head_sha -eq $headSha } | Select-Object -First 1
$run | Select-Object id,name,head_sha,status,conclusion,html_url
```

Poll until the run for `HEAD` is `completed` with `conclusion=success`.

```powershell
$runId = $run.id
for ($i = 1; $i -le 40; $i++) {
  $run = Invoke-RestMethod `
    -Uri "https://api.github.com/repos/n4meless94/QSB-Ask/actions/runs/$runId" `
    -Headers $headers
  "{0:u} status={1} conclusion={2}" -f (Get-Date), $run.status, $run.conclusion
  if ($run.status -eq "completed") { break }
  Start-Sleep -Seconds 10
}
if ($run.conclusion -ne "success") { throw "GHCR publish did not succeed: $($run.html_url)" }
```

### 6. Resolve The Production Host

```powershell
$originIp = (Resolve-DnsName ask.qsbportal.com.my -Type A |
  Where-Object IPAddress |
  Select-Object -First 1 -ExpandProperty IPAddress)
$originIp
```

Check that QSB Ask exists on that host:

```powershell
ssh "r4vemaster@$originIp" "hostname; sudo docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}' | grep -Ei 'btstg1x4zzuqjc16yf4qluqv|qsb-ask|n4meless94'"
```

If this shows no QSB Ask container, stop and re-check DNS/Coolify before deploying.

### 7. Queue The Coolify Deployment

Coolify does not automatically recreate the app just because the GHCR `latest` tag changed. Queue a Coolify-managed deployment for the application.

```powershell
@'
set -euo pipefail
sudo docker exec coolify php artisan tinker --execute='$app = App\Models\Application::where("uuid", "btstg1x4zzuqjc16yf4qluqv")->firstOrFail(); $deploymentUuid = new Visus\Cuid2\Cuid2; $result = queue_application_deployment(application: $app, deployment_uuid: $deploymentUuid, force_rebuild: true, pull_request_id: 0, is_api: true); echo $deploymentUuid->toString().PHP_EOL; echo json_encode($result).PHP_EOL;'
'@ | ssh "r4vemaster@$originIp" 'bash -s'
```

Save the printed deployment UUID for polling.

### 8. Poll Coolify Until Finished

Replace `<deployment_uuid>` with the value printed above.

```powershell
$deploymentUuid = "<deployment_uuid>"
@"
set -euo pipefail
uuid='$deploymentUuid'
for i in `$(seq 1 60); do
  row=`$(sudo docker exec coolify-db psql -U coolify -d coolify -Atc "select status,coalesce(commit,''),coalesce(finished_at::text,''),updated_at from application_deployment_queues where deployment_uuid='`$uuid';")
  echo "`$(date -Is) `$row"
  status=`$(printf '%s' "`$row" | cut -d'|' -f1)
  case "`$status" in
    finished) exit 0 ;;
    failed|cancelled|cancelled-by-user) exit 1 ;;
  esac
  sleep 10
done
exit 2
"@ | ssh "r4vemaster@$originIp" 'bash -s'
```

### 9. Verify The Running Revision

This is the important proof that production is on the new image, not merely healthy on the previous image.

```powershell
$headSha = git rev-parse HEAD
@'
set -euo pipefail
name=$(sudo docker ps --format '{{.Names}}' | grep 'btstg1x4zzuqjc16yf4qluqv' | head -1)
sudo docker inspect "$name" --format '{{.Name}} {{.Image}} {{index .Config.Labels "org.opencontainers.image.revision"}} {{index .Config.Labels "org.opencontainers.image.created"}} {{index .Config.Labels "com.docker.compose.image"}}'
'@ | ssh "r4vemaster@$originIp" 'bash -s'
```

The `org.opencontainers.image.revision` value must match `git rev-parse HEAD`.

### 10. Verify Public Health

```powershell
$resp = Invoke-WebRequest `
  -Uri "https://ask.qsbportal.com.my/api/health" `
  -Headers @{ "Cache-Control" = "no-cache" } `
  -TimeoutSec 30
"HTTP $($resp.StatusCode)"
$resp.Content
```

Expected:

- HTTP `200`
- JSON includes `"ok": true`
- JSON includes `"environment": "production"`
- `configuration.configured` is `true`
- `configuration.missingKeys` is empty
- no secret values appear

## Troubleshooting

### Public Health Is OK But Revision Is Old

The site can be healthy while still running the previous image. Queue a Coolify deployment after GHCR publish succeeds, then verify the OCI revision label again.

### `ssh qsb` Shows No QSB Ask Container

Do not assume `ssh qsb` is the production QSB Ask host. Resolve `ask.qsbportal.com.my`, SSH to the DNS-origin IP, and inspect that host.

### PowerShell Breaks Nested SSH Or SQL Quoting

Prefer a PowerShell here-string piped into `ssh ... 'bash -s'`. Keep Bash quoting inside the here-string and avoid long one-line `ssh` commands for SQL or Coolify tinker calls.

### Coolify Queue Does Not Start

Check the application and recent queue state on the DNS-origin host:

```powershell
@'
set -euo pipefail
sudo docker exec coolify-db psql -U coolify -d coolify -Atc "select id,uuid,name,fqdn,status,docker_registry_image_name,docker_registry_image_tag,updated_at from applications where uuid='btstg1x4zzuqjc16yf4qluqv';"
sudo docker exec coolify-db psql -U coolify -d coolify -Atc "select deployment_uuid,status,commit,created_at,updated_at,finished_at from application_deployment_queues where application_id='btstg1x4zzuqjc16yf4qluqv' order by created_at desc limit 10;"
'@ | ssh "r4vemaster@$originIp" 'bash -s'
```

Do not print Coolify tokens, Supabase keys, or application environment values while debugging.

## Completion Checklist

- [ ] Intended files only were committed.
- [ ] Local lint, tests, typecheck, and build passed.
- [ ] `HEAD` was pushed to `origin/main`.
- [ ] GHCR publish workflow completed successfully for `HEAD`.
- [ ] Coolify deployment was queued and finished.
- [ ] Running container OCI revision matches `HEAD`.
- [ ] Public `/api/health` returns HTTP 200 with `ok=true`.
- [ ] Any durable deploy caveat was recorded in `.planning/STATE.md` or the relevant project memory.
