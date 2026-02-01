# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy both instance-manager and agents (for shared imports)
COPY servers/instance-manager/package*.json ./servers/instance-manager/
COPY servers/agents/package*.json ./servers/agents/

# Install dependencies for both
WORKDIR /app/servers/agents
RUN npm ci

WORKDIR /app/servers/instance-manager
RUN npm ci

# Copy source files
WORKDIR /app
COPY servers/instance-manager ./servers/instance-manager
COPY servers/agents/storage ./servers/agents/storage

# Build TypeScript
WORKDIR /app/servers/instance-manager
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY --from=builder /app/servers/instance-manager/package*.json ./servers/instance-manager/
COPY --from=builder /app/servers/agents/package*.json ./servers/agents/

WORKDIR /app/servers/agents
RUN npm ci --omit=dev

WORKDIR /app/servers/instance-manager
RUN npm ci --omit=dev

# Copy built files and shared modules
COPY --from=builder /app/servers/instance-manager/dist ./servers/instance-manager/dist
COPY --from=builder /app/servers/agents/storage ./servers/agents/storage

WORKDIR /app/servers/instance-manager

EXPOSE 3001

CMD ["node", "dist/index.js"]
