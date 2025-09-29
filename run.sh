#!/bin/sh

echo "🔧 Starting the setup script..."

# Check Docker availability
if ! command -v docker; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Clean up Docker resources silently
if [ "$(docker ps -q)" ]; then
    echo "🧹 Stopping and removing running Docker containers..."
    docker compose down || exit 1
else
    echo "✅ No running Docker containers found. Skipping docker compose down."
fi

docker system prune -a --force
docker volume prune -a --force

# FRONTEND SETUP
cd frontend || exit 1
echo "📥 Installing frontend dependencies..."
bun install --frozen-lockfile || exit 1

cd ..
# BACKEND SETUP
cd backend || exit 1
echo "📥 Installing backend dependencies..."
rm -rf node_modules
bun install --frozen-lockfile || exit 1

cd ..

# Docker Compose
echo "🐳 Starting the application using Docker Compose..."
COMPOSE_BAKE=true docker compose -f docker-compose.yml build || exit 1
docker compose -f docker-compose.yml --compatibility up -d || exit 1

echo "✅ Setup completed successfully."
echo "⏳ Waiting for ngrok to generate the public HTTPS URL..."
sleep 20

NGROK_URL=$(docker compose logs ngrok 2>&1 | grep -o "https://[a-zA-Z0-9.-]*\.ngrok[^ ]*" | head -n 1)

if [ -n "$NGROK_URL" ]; then
    echo "------------------------------------------------------"
    echo "🚀 Application is live at:"
    echo "🌐 Local: http://localhost"
    echo "🌐 Public (Ngrok): $NGROK_URL"
    echo "------------------------------------------------------"
else
    echo "❌ Could not retrieve Ngrok HTTPS URL. Is the ngrok container running properly?"
fi
