# OpenScoreboard v3 - Static Build for Coolify/Caddy
FROM node:20-alpine

WORKDIR /app

# Copy source and build
COPY . .
RUN npm ci && npm run build

# Copy built files to /app/public (Coolify/Caddy serves from here)
RUN mkdir -p /app/public && cp -r /app/dist/* /app/public/

# Use simple HTTP server to serve files on port 8080
EXPOSE 8080
CMD ["npx", "serve", "/app/public", "-l", "8080"]
