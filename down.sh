#!/bin/sh

docker compose down

# Clean up Docker resources
docker system prune -a --force
docker volume prune -a --force