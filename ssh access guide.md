# QSB VPS SSH Access Guide

This guide is for agents using the local Windows SSH profile `qsb`.

## Canonical QSB VPS Repo

This file may be copied into other project folders when those projects need to test against the QSB VPS with `ssh qsb`.

The authoritative SOP, playbooks, and current VPS state remain in the QSB VPS documentation repo:

```text
C:\Users\User\OneDrive - Qhazanah Sabah Berhad\Documents\Claude Cowork\PROJECTS\QSB VPS
```

Before any SSH, firewall, server access, Coolify, DNS, deployment, n8n, or Zammad change from another project folder, read the current files from that canonical repo, not the copied folder:

```powershell
Get-Content -LiteralPath 'C:\Users\User\OneDrive - Qhazanah Sabah Berhad\Documents\Claude Cowork\PROJECTS\QSB VPS\state.md'
Get-Content -LiteralPath 'C:\Users\User\OneDrive - Qhazanah Sabah Berhad\Documents\Claude Cowork\PROJECTS\QSB VPS\playbook\PLAYBOOK_INDEX.md'
Get-Content -LiteralPath 'C:\Users\User\OneDrive - Qhazanah Sabah Berhad\Documents\Claude Cowork\PROJECTS\QSB VPS\playbook\SSH_ACCESS_RECOVERY_PLAYBOOK.md'
Get-Content -LiteralPath 'C:\Users\User\OneDrive - Qhazanah Sabah Berhad\Documents\Claude Cowork\PROJECTS\QSB VPS\playbook\CHANGE_MANAGEMENT_PLAYBOOK.md'
Get-Content -LiteralPath 'C:\Users\User\OneDrive - Qhazanah Sabah Berhad\Documents\Claude Cowork\PROJECTS\QSB VPS\playbook\PRE_POST_CHANGE_CHECKLIST.md'
```

If the task is only app testing through SSH and makes no live change, use this guide plus `state.md`. If the task changes anything on the VPS, follow the matching playbook from `playbook\PLAYBOOK_INDEX.md` and update `state.md` in the canonical repo after verification.

## Primary SSH Access

Use the existing local SSH profile:

```powershell
ssh qsb
```

The profile is stored at:

```text
C:\Users\User\.ssh\config
```

Expected profile shape:

```sshconfig
Host qsb
    HostName 115.187.22.166
    Port 6262
    User jerry
    IdentityFile ~/.ssh/id_ed25519_qsb
```

Do not use password SSH. The VPS is configured for key-based SSH.

## Windows Multiline Bash Scripts

When sending multiline bash from Windows PowerShell to the VPS, make sure the script reaches bash with LF line endings. Raw PowerShell here-strings piped directly into SSH can preserve CRLF and contaminate bash tokens or variable values, which can create bad paths or partial backup artifacts.

Safer patterns:

- Normalize before piping, for example replace `` `r`n `` with `` `n `` before `ssh qsb 'bash -s'`.
- Prefer the workspace runner for long or destructive scripts:

```powershell
@'
set -euo pipefail
printf '%q\n' "lf_only"
'@ | .\scripts\Invoke-QsbBash.ps1
```

The runner strips CRLF/CR line endings before sending stdin to `ssh qsb bash -s`, avoiding stray `$'\r'` characters in remote bash variables.
- For simple read-only checks, use one-line `ssh qsb 'command'` calls.

## Quick Health Check

Run:

```powershell
ssh qsb 'echo ssh_ok; hostname; whoami; sudo ss -tulpn | grep sshd'
```

Expected:

```text
ssh_ok
v102503
jerry
... LISTEN ... :6262 ... sshd
```

## Important SSH Config Notes

The server's SSH config must preserve the custom port:

```text
Port 6262
```

Before restarting SSH, always validate config:

```bash
sudo sshd -t
```

Then restart:

```bash
sudo systemctl restart ssh
```

After restart, verify:

```bash
sudo ss -tulpn | grep sshd
```

Expected:

```text
LISTEN ... 0.0.0.0:6262 ... sshd
LISTEN ... [::]:6262 ... sshd
```

## Coolify Internal SSH

Coolify manages the local Docker host through its generated SSH key from inside the `coolify` container.

Current intended behavior:

- Public root SSH remains disabled.
- Root SSH is allowed only from Docker internal network `10.0.0.0/8`.
- Coolify uses this internal root path to manage Docker and Traefik files.

Relevant `/etc/ssh/sshd_config` section:

```sshconfig
Port 6262
PermitRootLogin no
PasswordAuthentication no
AllowUsers jerry root

Match Address 10.0.0.0/8
    PermitRootLogin prohibit-password
```

Check public root remains blocked:

```bash
sudo sshd -T -C user=root,addr=103.179.70.1,host=coolify.qsbportal.com.my | grep '^permitrootlogin'
```

Expected:

```text
permitrootlogin no
```

Check Coolify internal root is allowed:

```bash
sudo sshd -T -C user=root,addr=10.0.1.5,host=host.docker.internal | grep '^permitrootlogin'
```

Expected:

```text
permitrootlogin without-password
```

## If SSH Breaks

If `ssh qsb` returns `connection refused`, SSH is likely not listening on `6262`.

Recover from YeahHost console or Coolify terminal:

```bash
sudo grep -q '^Port 6262' /etc/ssh/sshd_config || sudo sed -i '1i Port 6262' /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl restart ssh
sudo ufw allow 6262/tcp
sudo ss -tulpn | grep sshd
```

Do not close the recovery terminal until a separate terminal confirms:

```powershell
ssh qsb 'echo ssh_ok'
```

## Coolify Access

Dashboard:

```text
https://coolify.qsbportal.com.my
```

The old bootstrap port may still exist at Docker level:

```text
http://coolify.qsbportal.com.my:8000
```

Use the HTTPS dashboard as the normal access path.
