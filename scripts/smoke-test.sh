#!/usr/bin/env bash
set -euo pipefail

echo "=== DeepCLAW Docker Compose Smoke Test ==="

echo "[1/5] Building images..."
docker compose build

echo "[2/5] Starting services..."
docker compose up -d

echo "[3/5] Waiting for gateway health..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "Gateway is healthy."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Gateway did not become healthy in time."
    docker compose logs gateway
    docker compose down -v
    exit 1
  fi
  sleep 2
done

echo "[4/5] Running endpoint checks..."
PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expected="$3"
  if curl -sf "$url" | grep -q "$expected"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label"
    FAIL=$((FAIL + 1))
  fi
}

check "health" "http://localhost:3000/health" '"status":"ok"'
check "status" "http://localhost:3000/api/v1/status" '"status":"operational"'
check "budget" "http://localhost:3000/api/v1/budget" '"success":true'
check "observability" "http://localhost:3000/api/v1/observability/otel" '"scopeSpans"'

echo "[5/5] Tearing down..."
docker compose down -v

echo ""
echo "=== Results ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

echo "Smoke test passed."
