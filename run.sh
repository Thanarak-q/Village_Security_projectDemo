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
docker volume prune --force

# FRONTEND SETUP
cd frontend || exit 1

if [ -f package.json ]; then
    if [ "$(uname)" != "Darwin" ]; then
        if [ -d node_modules ]; then
            echo "📦 Cleaning frontend dependencies..."
            sudo chown -R "$USER":"$USER" node_modules || exit 1
            rm -rf node_modules || exit 1
        fi
    fi

    if [ "$(uname)" == "Darwin" ]; then
        if [ -d node_modules ]; then
            echo "📦 Cleaning frontend dependencies..."
            sudo chown -R "$USER":"$(id -gn)" node_modules || exit 1
            rm -rf node_modules || exit 1
        fi
    fi
    
    [ -f package-lock.json ] && rm -f package-lock.json || true
    
    echo "📥 Installing frontend dependencies..."
    npm install --verbose || exit 1
else
    echo "⚠️ No package.json in frontend directory. Skipping npm install."
fi

cd ..

# BACKEND SETUP
cd backend || exit 1

if [ -f package.json ]; then
    if [ "$(uname)" != "Darwin" ]; then
        if [ -d node_modules ]; then
            echo "📦 Cleaning backend dependencies..."
            sudo chown -R "$USER":"$USER" node_modules || exit 1
            rm -rf node_modules || exit 1
        fi
    fi

    if [ "$(uname)" == "Darwin" ]; then
        if [ -d node_modules ]; then
            echo "📦 Cleaning backend dependencies..."
            sudo chown -R "$USER":"$(id -gn)" node_modules || exit 1
            rm -rf node_modules || exit 1
        fi
    fi
    
    [ -f package-lock.json ] && rm -f package-lock.json || true
    
    echo "📥 Installing backend dependencies..."
    bun install || exit 1
else
    echo "⚠️ No package.json in backend directory. Skipping bun install."
fi

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
