#!/bin/bash
# ================================================================
#  scripts/setup.sh — First-time setup
#  Run once: chmod +x scripts/setup.sh && ./scripts/setup.sh
# ================================================================
set -e

echo "🚀 Setting up AI Course Scheduler..."

# 1. Copy .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env created — please edit it before running"
fi

# 2. Backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --break-system-packages
cd ..

# 3. Frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo "   Run: ./scripts/run_dev.sh"