# OpenScoreboard v3 - Vite Static Deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Install dependencies
RUN npm ci

# Build the app
RUN npm run build

# Production nginx image
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html

# Remove default nginx config and create new one
RUN rm /etc/nginx/conf.d/default.conf

# Create nginx config that properly serves static files
RUN echo 'server {' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    listen 80 default_server;' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    server_name _;' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    # Serve static files directly' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    location /assets/ {' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '        try_files $uri =404;' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    }' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    # Serve flags' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    location /flags/ {' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '        try_files $uri =404;' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    }' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    # SPA fallback' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '    }' >> /etc/nginx/conf.d/openscoreboard.conf && \
    echo '}' >> /etc/nginx/conf.d/openscoreboard.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
