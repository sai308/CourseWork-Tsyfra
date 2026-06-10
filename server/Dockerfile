# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies required for native modules (like bcrypt) and Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package management files
COPY package*.json ./

# Install all dependencies (including devDependencies for Prisma CLI)
RUN npm ci

# Copy Prisma files and generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

# Install runtime dependencies (like openssl and CA certificates for secure connections)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set Node environment to production
ENV NODE_ENV=production

# Copy node_modules and package.json from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copy source code and entrypoint
COPY src ./src
COPY entrypoint.sh ./

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Expose backend port
EXPOSE 3344

# Set the entrypoint script
CMD ["./entrypoint.sh"]
