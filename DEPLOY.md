# D1 Events — Production

## Current topology (11 September 2026)

- Application/data host: `89.104.94.114`
- Deployment directory: `/opt/d1-events`
- Docker Compose project: `d1events`
- App listener: `127.0.0.1:3100`
- Persistent volumes: `d1events_pgdata`, `d1events_uploads`
- Public hostname: `tma.d1capital.ru`
- Temporary TLS/DNS gateway: `5.42.103.212`

Until the REG.RU A record is switched, the old host terminates TLS and proxies
requests to the Production host. The old `club-app-1` and `club-db-1` remain
running as a rollback copy.

## Health checks

```bash
ssh root@89.104.94.114 \
  'cd /opt/d1-events && docker compose -p d1events --env-file .env -f docker-compose.yml ps'

ssh root@89.104.94.114 'nginx -t && systemctl is-active nginx'

curl -fsS -o /dev/null -w '%{http_code}\n' https://tma.d1capital.ru/
```

Expected result: both containers are running, PostgreSQL is healthy, nginx is
active, and the public request returns `200`.

## Finish direct DNS cutover

1. In REG.RU, change only the `A` record for `tma.d1capital.ru` from
   `5.42.103.212` to `89.104.94.114`.
2. Confirm the authoritative answer:

```bash
dig @ns1.reg.ru +short tma.d1capital.ru A
```

3. Issue the certificate on the Production host after the authoritative record
   returns `89.104.94.114`:

```bash
ssh root@89.104.94.114 '
  set -e
  email=$(grep -m1 "^EMAIL=" /opt/d1-events/.env | cut -d= -f2-)
  certbot --nginx \
    --non-interactive \
    --agree-tos \
    --redirect \
    --email "$email" \
    -d tma.d1capital.ru
  nginx -t
  systemctl reload nginx
'
```

4. Verify that the certificate is served by `89.104.94.114`, then keep the old
   host unchanged for a rollback window.

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

## CI/CD warning

The existing GitHub Actions SSH credential is authorized only on the old host.
Do not run the old deploy workflow until its target and credential are migrated
to `89.104.94.114`; otherwise it can deploy back to the temporary gateway.
