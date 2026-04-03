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

# Build with Firebase env vars embedded
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_DATABASE_URL
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG VITE_USE_LOCAL_DB=false

ENV VITE_FIREBASE_API_KEY=$FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_DATABASE_URL=$FIREBASE_DATABASE_URL
ENV VITE_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$FIREBASE_APP_ID
ENV VITE_USE_LOCAL_DB=$VITE_USE_LOCAL_DB

# Install dependencies and build
RUN npm install && npm run build

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
