#!/bin/sh

# รอให้ฐานข้อมูลพร้อม (ปรับเวลาตามความจำเป็น)
sleep 10

# รัน migration ด้วย drizzle-kit ผ่าน npx (เฉพาะเมื่อจำเป็น)
bunx drizzle-kit push

# seed ข้อมูล (เฉพาะเมื่อจำเป็น)
bun run src/db/seed.ts

# รันแอป
bun run dev 