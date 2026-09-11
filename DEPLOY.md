# D1 Events — Production

## Current topology (11 September 2026)

- Application/data host: `89.104.94.114`
- Deployment directory: `/opt/d1-events`
- Docker Compose project: `d1events`
- App listener: `127.0.0.1:3100`
- Persistent volumes: `d1events_pgdata`, `d1events_uploads`
- Public hostname: `tma.d1capital.ru`
- TLS terminates directly on `89.104.94.114` with automatic Certbot renewal
- Rollback host: `5.42.103.212`

The old `club-app-1` and `club-db-1` remain running as a rollback copy. They are
not in the public request path after the REG.RU A record switched to Production.

## Health checks

```bash
ssh root@89.104.94.114 \
  'cd /opt/d1-events && docker compose -p d1events --env-file .env -f docker-compose.yml ps'

ssh root@89.104.94.114 'nginx -t && systemctl is-active nginx'

curl -fsS -o /dev/null -w '%{http_code}\n' https://tma.d1capital.ru/
```

Expected result: both containers are running, PostgreSQL is healthy, nginx is
active, and the public request returns `200`.

## Verify direct DNS and TLS

Confirm the authoritative answer:

```bash
dig @ns1.reg.ru +short tma.d1capital.ru A
```

Expected result: `89.104.94.114`.

Check the installed certificate and renewal timer:

```bash
ssh root@89.104.94.114 \
  'certbot certificates -d tma.d1capital.ru && systemctl status certbot.timer'
```

Keep the old host unchanged for the agreed rollback window.

## Temporary rollback

The pre-cutover nginx configuration is stored on the old host at:

`/root/club/deploy/nginx.conf.pre-migration-20260911`

To restore the old local application route:

```bash
ssh root@5.42.103.212 '
  set -e
  cd /root/club
  export IMAGE=ghcr.io/d1capital/d1-events:latest
  cp deploy/nginx.conf.pre-migration-20260911 deploy/nginx.conf
  docker compose -p club --env-file .env -f deploy/docker-compose.yml \
    up -d --force-recreate nginx
  curl -fsS -o /dev/null https://tma.d1capital.ru/
'
```

## CI/CD access model

GitHub Actions connects as `d1events-deploy`. Its authorized key is constrained
to `/usr/bin/sudo -n /usr/local/sbin/deploy-d1-events`; it cannot request an
interactive shell, forward ports, or upload arbitrary files. The root-owned
script accepts only the temporary GHCR username/token on stdin and deploys the
fixed `ghcr.io/d1capital/d1-events:latest` image from `/opt/d1-events`.

Each deployment creates a PostgreSQL custom-format backup in
`/opt/d1-events/backups/automatic`, validates Compose, applies the Prisma schema,
checks the local app and public HTTPS endpoint, and restores the previous app
image if the application health check fails.
