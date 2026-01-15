FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build 2>/dev/null || npx tsc --outDir dist

# Expose port
EXPOSE 4318

# Start the server
CMD ["node", "dist/server.js"]
