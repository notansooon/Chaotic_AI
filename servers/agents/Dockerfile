# Kyntrix Agents Server
# Build from repository root: docker build -f servers/agents/Dockerfile .

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for prisma
COPY package*.json ./
COPY database/prisma ./database/prisma/

# Copy agents package files
COPY servers/agents/package*.json ./servers/agents/

# Install root dependencies (prisma)
RUN npm ci

# Install agents dependencies
WORKDIR /app/servers/agents
RUN npm ci

# Copy all agents source
COPY servers/agents/ ./

# Generate Prisma client
RUN npx prisma generate --schema=../../database/prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 kyntrix

# Copy built files and dependencies
COPY --from=builder /app/servers/agents/dist ./dist
COPY --from=builder /app/servers/agents/node_modules ./node_modules
COPY --from=builder /app/servers/agents/package.json ./package.json
COPY --from=builder /app/database/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER kyntrix

EXPOSE 4318

ENV NODE_ENV=production
ENV HTTP_PORT=4318

CMD ["node", "dist/server.js"]
