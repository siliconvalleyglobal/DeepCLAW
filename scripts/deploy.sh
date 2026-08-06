#!/bin/bash
set -e

echo "=========================================="
echo "  DeepCLAW One-Command Deployment"
echo "=========================================="
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting."; exit 1; }

# Build and start services
echo "[1/4] Building Docker images..."
docker compose build

echo ""
echo "[2/4] Starting services..."
docker compose up -d

echo ""
echo "[3/4] Waiting for services to be healthy..."
sleep 5

echo ""
echo "[4/4] Running health checks..."
curl -f http://localhost:3000/health || echo "Gateway health check failed"
curl -f http://localhost:5173 || echo "Dashboard health check failed"

echo ""
echo "=========================================="
echo "  DeepCLAW is running!"
echo "=========================================="
echo "  Gateway:  http://localhost:3000"
echo "  Dashboard: http://localhost:5173"
echo "  WebSocket: ws://localhost:3001"
echo ""
echo "  To view logs: docker compose logs -f"
echo "  To stop:     docker compose down"
echo "=========================================="
