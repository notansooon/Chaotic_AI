# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for agents
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema from database folder (needs to be copied during build context setup)
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 7090

CMD ["node", "dist/server.js"]
