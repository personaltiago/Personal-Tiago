#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dist_root="$project_root/dist"
node "$project_root/scripts/build-web-firebase.mjs"
node "$project_root/scripts/update-web-assets.mjs"

rm -rf "$dist_root"
mkdir -p "$dist_root/server" "$dist_root/.openai"
cp "$project_root/worker/index.js" "$dist_root/server/index.js"
cp "$project_root/.openai/hosting.json" "$dist_root/.openai/hosting.json"

node "$project_root/scripts/build-aquarium.mjs"

echo "Built $dist_root"
