#!/bin/bash
# ================================================================
#  scripts/deploy.sh — Production Deployment
#  Usage: ./scripts/deploy.sh
# ================================================================

set -e  # Exit on any error

echo "AI Course Scheduler — Deploying..."

# 1. Pull latest code (if using git)
# git pull origin main

# 2. Check .env exists
if [ ! -f .env ]; then
  echo " .env file not found — copy .env.example and fill it in"
  exit 1
fi

# 3. Build and start containers
echo " Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "  Starting services..."
docker compose -f docker-compose.prod.yml up -d

# 4. Wait for backend
echo " Waiting for backend..."
sleep 5

# 5. Health check
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
if [ "$STATUS" = "200" ]; then
  echo " Deployment successful! App running at http://localhost"
else
  echo "  Health check returned $STATUS — check logs:"
  echo "   docker compose -f docker-compose.prod.yml logs backend"
fi