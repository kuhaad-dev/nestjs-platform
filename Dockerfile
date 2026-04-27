# ---- Stage 1: Builder ----
# Use a specific version. Never use 'node:latest' — it changes without warning.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files FIRST — before source code.
# Docker caches layers. If package.json didn't change, this layer
# is reused and npm install is skipped entirely. Huge speed win.
COPY package*.json ./

# Install ALL deps including devDependencies (needed to compile TypeScript)
RUN npm ci

# NOW copy source — changes here don't invalidate the npm install cache
COPY . .

# Compile TypeScript → /app/dist
RUN npm run build

# ---- Stage 2: Production ----
# Fresh image — no TypeScript compiler, no devDeps, no source code
FROM node:20-alpine AS production

WORKDIR /app

# Security: don't run as root inside the container
# If someone exploits your app, they get 'nodejs' user, not root
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY package*.json ./

# Only production deps — makes the image smaller and safer
RUN npm ci --omit=dev

# Copy only the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Tell Node explicitly this is production
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Document which port the app uses (doesn't actually expose — just metadata)
EXPOSE 3000

# Run the compiled JS entry point
CMD ["node", "dist/main.js"]