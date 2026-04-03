# OpenScoreboard v3 - Vite Static Deployment
FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install and build
RUN npm install && npm run build

# Serve with npx serve (simple SPA fallback)
EXPOSE 8080
CMD ["npx", "serve", "dist", "-s", "-l", "8080"]
