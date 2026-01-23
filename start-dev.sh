#!/usr/bin/env bash
set -e

echo "🚀 Starting Stock Broker App (local dev)"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"

echo "🐘 Starting Postgres via Docker..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yml" up -d db

echo "⏳ Waiting for Postgres to be ready..."
until docker exec broker_db pg_isready -U broker -d broker >/dev/null 2>&1; do
  sleep 1
done
echo "✅ Postgres ready"

echo "🗄️  Running migrations..."
cd "$API_DIR"
source .venv/bin/activate
alembic upgrade head

echo "🧠 Starting market engine (background)..."
python -m app.market.engine >/dev/null 2>&1 &
MARKET_PID=$!

echo "🌐 Starting FastAPI (background)..."
uvicorn app.main:app --reload --port 8000 >/dev/null 2>&1 &
API_PID=$!

echo "🖥️  Starting Web (foreground)..."
cd "$WEB_DIR"
npm run dev

# Cleanup when you Ctrl+C
trap "echo '🧹 Stopping...'; kill $MARKET_PID $API_PID 2>/dev/null; exit 0" INT TERM
