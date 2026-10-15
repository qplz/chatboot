# ==============================================================================
# Production Dockerfile for AI Chatbot MVP
# Optimized for Ubuntu 22.04 LTS & Docker 29.x+ (Compose V2)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Ensure curl/libc dependencies if needed
RUN apk add --no-cache libc6-compat

# Install dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile || npm install

# Copy application source code
COPY . .

# Build production distribution
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Server
# ------------------------------------------------------------------------------
FROM nginx:alpine-slim AS runner

# Add curl for robust container health checks
RUN apk add --no-cache curl

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration optimized for SPA & Port 3000
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root cache directories and permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx

# Expose internal listening port
EXPOSE 3000

# Health check to verify web server readiness
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

# Start nginx daemon in foreground
CMD ["nginx", "-g", "daemon off;"]
