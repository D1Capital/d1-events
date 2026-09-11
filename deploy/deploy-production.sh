#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

readonly APP_DIR="/opt/d1-events"
readonly IMAGE="ghcr.io/d1capital/d1-events:latest"
readonly BACKUP_DIR="$APP_DIR/backups/automatic"

if [ "$(id -u)" -ne 0 ]; then
  echo "deploy-production must run as root" >&2
  exit 1
fi

IFS= read -r registry_user
IFS= read -r registry_token

if [[ ! "$registry_user" =~ ^[A-Za-z0-9_.@+][A-Za-z0-9_.@+\[\]-]{0,127}$ ]]; then
  echo "Invalid registry username" >&2
  exit 1
fi

if [ -z "$registry_token" ] || [ "${#registry_token}" -gt 4096 ]; then
  echo "Invalid registry token" >&2
  exit 1
fi

exec 9>/run/lock/d1events-deploy.lock
if ! flock -n 9; then
  echo "Another d1-events deployment is already running" >&2
  exit 1
fi

docker_config=$(mktemp -d /run/d1events-docker.XXXXXX)
cleanup() {
  rm -f -- "$docker_config/config.json"
  rmdir -- "$docker_config" 2>/dev/null || true
}
trap cleanup EXIT

printf '%s\n' "$registry_token" \
  | docker --config "$docker_config" login ghcr.io \
      --username "$registry_user" \
      --password-stdin >/dev/null
unset registry_token
export DOCKER_CONFIG="$docker_config"

cd "$APP_DIR"
test -s .env
test -s docker-compose.yml
docker volume inspect d1events_uploads >/dev/null

compose=(docker compose -p d1events --env-file .env -f docker-compose.yml)
export IMAGE
"${compose[@]}" config --quiet

previous_image=$(docker inspect --format '{{.Image}}' d1events-app-1)
mkdir -p "$BACKUP_DIR"
backup_file="$BACKUP_DIR/predeploy-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker exec d1events-db-1 sh -lc \
  'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  >"$backup_file"
test -s "$backup_file"

deployment_started=0
rollback_on_error() {
  status=$?
  trap - ERR
  if [ "$deployment_started" -eq 1 ] && [ -n "$previous_image" ]; then
    echo "Deployment failed; restoring the previous application image" >&2
    docker tag "$previous_image" "$IMAGE" || true
    "${compose[@]}" up -d app || true
  fi
  exit "$status"
}
trap rollback_on_error ERR

"${compose[@]}" pull app
"${compose[@]}" up -d db
deployment_started=1

docker run --rm \
  --network d1events_default \
  --env-file .env \
  --user 0 \
  --entrypoint sh \
  "$IMAGE" \
  -c 'set -e; cd /app; NODE_PATH=/usr/local/lib/node_modules prisma db push --schema=prisma/schema.prisma'

"${compose[@]}" up -d app

healthy=0
for attempt in $(seq 1 30); do
  if curl -fsS --max-time 5 -o /dev/null http://127.0.0.1:3100/; then
    healthy=1
    break
  fi
  sleep 2
done

if [ "$healthy" -ne 1 ]; then
  echo "d1-events did not pass its local health check" >&2
  false
fi

nginx -t
curl -fsS --max-time 10 -o /dev/null https://tma.d1capital.ru/
deployment_started=0
trap - ERR

"${compose[@]}" ps
echo "d1-events deployment completed"
