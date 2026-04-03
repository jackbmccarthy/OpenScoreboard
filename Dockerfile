# OpenScoreboard v3 - Vite Static Deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy everything
COPY . .

# Build
RUN npm ci && npm run build

# Nginx to serve static + SPA fallback
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html/public

# Proper nginx config - serve /assets/ as static, SPA fallback for other routes
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /assets/ { \
        alias /usr/share/nginx/html/assets/; \
        add_header Cache-Control "public, max-age=31536000"; \
    } \
    \
    location /flags/ { \
        alias /usr/share/nginx/html/flags/; \
        add_header Cache-Control "public, max-age=31536000"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
