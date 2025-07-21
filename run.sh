#!/bin/sh

echo "Starting the setup script..."

# Clean up Docker resources
docker system prune -a --force
docker volume prune -a --force

# FRONTEND SETUP
cd frontend || exit 1
if [ -f package.json ]; then
    if [ -d node_modules ]; then
        echo "Removing existing node_modules in frontend..."
        sudo chown -R $USER:$USER node_modules || exit 1
        rm -rf node_modules || exit 1
    fi

    if [ -f package-lock.json ]; then
        echo "Removing existing package-lock.json in frontend..."
        rm -f package-lock.json || exit 1
    fi

    echo "Installing frontend dependencies..."
    npm install || exit 1
else
    echo "No package.json found in frontend directory. Skipping npm install."
fi

cd ..

# BACKEND SETUP
cd backend || exit 1

if [ -f package.json ]; then
    if [ -d node_modules ]; then
        echo "Removing existing node_modules in backend..."
        sudo chown -R $USER:$USER node_modules || exit 1
        rm -rf node_modules || exit 1
    fi

    if [ -f package-lock.json ]; then
        echo "Removing existing package-lock.json in backend..."
        rm -f package-lock.json || exit 1
    fi

    echo "Installing backend dependencies..."
    bun install || exit 1
else
    echo "No package.json found in backend directory. Skipping bun install."
fi

cd ..

# Docker Compose
echo "Starting the application using Docker Compose with COMPOSE_BAKE..."
COMPOSE_BAKE=true docker compose -f docker-compose.yml build || exit 1
docker compose -f docker-compose.yml --compatibility up -d || exit 1

echo "Setup completed successfully."
echo "You can now access the application at http://localhost"
