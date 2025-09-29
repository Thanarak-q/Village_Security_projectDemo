FROM node:24-alpine

WORKDIR /app

# ใช้ lockfile เพื่อ cache ที่แม่นยำ
COPY package.json package-lock.json ./
RUN npm ci --verbose 

# ค่อย copy โค้ด เพื่อไม่ให้ invalid cache ง่าย ๆ
COPY . .

EXPOSE 3000
# dev server เท่านั้น (อย่าใช้ใน prod)
CMD ["npm", "run", "dev"]
