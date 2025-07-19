FROM oven/bun:latest

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
COPY bun*.lock ./
RUN bun install

# Copy the rest0
COPY . .

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
