#!/usr/bin/env bash
set -euo pipefail

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "NPM_TOKEN is required"
  exit 1
fi

echo "=== DeepCLAW Release ==="

echo "[1/4] Authenticating npm..."
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

echo "[2/4] Building all packages..."
pnpm -r build

echo "[3/4] Publishing Node packages..."
for pkg in packages/sdk packages/gateway packages/plugin-sdk packages/core extensions/telegram extensions/discord extensions/slack extensions/mcp extensions/a2a extensions/webhook; do
  echo "  Publishing $pkg..."
  cd "$pkg"
  npm publish --access public
  cd -
done

echo "[4/4] Done."
