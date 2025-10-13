#!/bin/sh
set -e

MODE=${NODE_ENV:-development}

if [ "$MODE" = "production" ]; then
  exec bun run start
else
  exec bun run dev
fi
