#!/bin/sh
set -e

echo "Starting DeepCLAW Gateway..."
echo "  - Policy Engine: ACTIVE"
echo "  - Audit Logger: ACTIVE"
echo "  - Channel Router: ACTIVE"
echo "  - Memory Store: SQLite"
echo ""

exec node packages/gateway/dist/cli.mjs
