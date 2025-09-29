FROM oven/bun:latest

WORKDIR /app

# 1. Copy only files needed to install dependencies
COPY package.json bun.lock ./

# 2. Install dependencies exactly as in lockfile
RUN bun install --frozen-lockfile

# 3. Copy the rest of the app source code
COPY . .

# 4. Make entrypoint executable (ถ้า script อยู่ใน repo)
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
