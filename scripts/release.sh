#!/usr/bin/env bash
set -euo pipefail

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "NPM_TOKEN is required"
  exit 1
fi

echo "=== DeepCLAW Release ==="

echo "[1/4] Authenticating npm..."
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

echo "[2/4] Building package..."
pnpm build

echo "[3/4] Publishing @svgph/deepclaw..."
npm publish --access public

echo "[4/4] Publishing extensions..."
for ext in telegram discord slack mcp a2a webhook; do
  echo "  Publishing extensions/$ext..."
  cd extensions/$ext
  npm publish --access public
  cd -
done

echo "Done."
