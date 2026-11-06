#!/usr/bin/env bash
# Builds the site and uploads it to the blog host. Usage: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${DEPLOY_SSH:-root@103.27.187.131}"
KEY=".workspace/deploy_key"
SSH="ssh -i $KEY -o BatchMode=yes -o UserKnownHostsFile=.workspace/known_hosts -o StrictHostKeyChecking=accept-new"

NODE_ENV=production node site/build.mjs
node site/check.mjs
rsync -az --delete --chmod=D755,F644 -e "$SSH" dist/ "$HOST:/opt/xiaojuren-blog/site/"
rsync -az --chmod=D755,F644 -e "$SSH" deploy/blog-nginx.conf "$HOST:/opt/xiaojuren-blog/conf/default.conf"
$SSH "$HOST" 'docker exec xiaojuren-blog nginx -t -q && docker exec xiaojuren-blog nginx -s reload'
echo "deployed → https://adjens.com"
