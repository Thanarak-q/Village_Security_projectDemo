#!/bin/sh

# รัน migration ด้วย drizzle-kit ผ่าน npx
# bunx drizzle-kit push

# seed ข้อมูล
# bun run src/db/seed.ts

# รันแอป
bun run dev  # หรือ pm2 start dist ได้ตามต้องการ
