#!/bin/sh
set -e

MODE=${NODE_ENV:-development}

# รอให้ฐานข้อมูลพร้อม (ปรับเวลาตามความจำเป็น)
sleep 10

# รัน migration ด้วย drizzle-kit ผ่าน npx (เฉพาะเมื่อจำเป็น)
# bunx drizzle-kit push

# seed ข้อมูล (เฉพาะเมื่อจำเป็น)
# if [ "$MODE" != "production" ]; then
#   bun run src/db/seed.ts
# fi

# รันแอปตามโหมด
if [ "$MODE" = "production" ]; then
  exec bun run start
else
  exec bun run dev
fi
