#!/usr/bin/env bash

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
deploy_script="$repo_root/deploy/deploy-production.sh"
workflow="$repo_root/.github/workflows/deploy.yml"

test -f "$deploy_script"
bash -n "$deploy_script"

grep -Fq 'readonly APP_DIR="/opt/d1-events"' "$deploy_script"
grep -Fq 'readonly IMAGE="ghcr.io/d1capital/d1-events:latest"' "$deploy_script"
grep -Fq 'flock -n 9' "$deploy_script"
grep -Fq 'mktemp -d /run/d1events-docker.XXXXXX' "$deploy_script"
grep -Fq 'docker --config "$docker_config" login ghcr.io' "$deploy_script"
grep -Fq 'http://127.0.0.1:3100/' "$deploy_script"

if grep -Eq '(^|[[:space:]])(eval|source)[[:space:]]' "$deploy_script"; then
  echo "Deploy script must not eval input or source .env" >&2
  exit 1
fi

grep -Fq 'd1events-deploy@89.104.94.114' "$workflow"
grep -Fq 'SHA256:jZJ1TKQjfzdF0morgmYTyqUcZX6Fy96vJXOfuZVwC2Y' "$workflow"

if grep -Fq 'username: root' "$workflow" || grep -Fq 'appleboy/scp-action' "$workflow"; then
  echo "Workflow must not use root SSH or upload arbitrary files" >&2
  exit 1
fi

echo "deploy-production security checks passed"
