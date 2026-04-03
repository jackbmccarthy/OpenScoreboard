# OpenScoreboard v3 - Vite Static Deployment

FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files needed for build
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./
COPY src ./src
COPY public ./public

# Install dependencies
RUN npm install

# Build
RUN npm run build

# Production image with nginx
FROM nginx:alpine

# Copy built files to nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config for SPA routing
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Serve static assets with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
