# OpenScoreboard v3 - Static Build for Coolify/Caddy
FROM node:20-alpine

WORKDIR /app

# Copy all source files
COPY . .

# Install and build
RUN npm ci && npm run build

# Caddy serves from /app/public by default, so copy dist there
RUN mkdir -p public && cp -r dist/* public/

EXPOSE 8080

# Don't run a server - Coolify/Caddy serves the static files
CMD ["tail", "-f", "/dev/null"]
