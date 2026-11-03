
# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci


# ==========================================
# Stage 2: Build
# ==========================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build NestJS application
RUN npm run build


# ==========================================
# Stage 3: Production
# ==========================================
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Use non-root user
USER node

# NestJS application port
EXPOSE 5000

# Start application
CMD ["node", "dist/main.js"]
