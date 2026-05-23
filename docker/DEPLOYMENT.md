# Nexus Dashboard — Deployment Guide

## Prerequisites

- Docker + Portainer running on tethys
- SSH access to tethys (for the one-time volume setup)

---

## One-time setup on tethys

SSH in and run:

```bash
# Create the persistent data volume (SQLite DB lives here)
docker volume create nexus-dashboard_data

# Generate secrets — copy the output values, you'll paste them into Portainer
openssl rand -hex 32   # → ENCRYPTION_KEY
openssl rand -hex 32   # → SESSION_SECRET
```

Keep the two secret values somewhere safe (Bitwarden etc). They encrypt the integration credentials stored in the DB — lose them and the credentials are unrecoverable (you'd just re-add the integrations).

---

## Portainer stack setup

1. **Stacks → Add stack → Repository**

   | Field | Value |
   |---|---|
   | Repository URL | `https://github.com/spamenigma/nexus-dashboard` |
   | Repository reference | `refs/heads/master` |
   | Compose path | `docker/docker-compose.portainer.yml` |
   | GitOps / auto-update | ✅ Enabled |

2. **Env tab** — add these two variables:

   | Name | Value |
   |---|---|
   | `ENCRYPTION_KEY` | _(hex string from openssl above)_ |
   | `SESSION_SECRET` | _(hex string from openssl above)_ |

3. **Deploy the stack.**

Dashboard will be available at `http://tethys:3000` (or whatever tethys's LAN IP is).

---

## Updates

Push to `master` → Portainer auto-pulls and rebuilds. No manual steps needed.

---

## Data & backups

All state lives in the `nexus-dashboard_data` Docker volume (`/data/nexus.db`).

```bash
# Quick backup
docker run --rm -v nexus-dashboard_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/nexus-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

## Troubleshooting

```bash
# View logs
docker logs nexus -f

# Check health
curl http://tethys:3000/api/health

# Open a shell (e.g. to inspect the DB)
docker exec -it nexus sh
```
