# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY prisma/ prisma/

# Install all dependencies (including dev)
RUN npm ci --workspace=@car/api

# Copy source
COPY apps/api/ apps/api/
COPY tsconfig.base.json* ./

# Generate Prisma client
RUN npx prisma generate

# Build the API
RUN npm run build --workspace=@car/api

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package files and install production deps only
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY prisma/ prisma/

RUN npm ci --workspace=@car/api --omit=dev

# Copy built app
COPY --from=builder /app/apps/api/dist apps/api/dist

# Copy Prisma schema and generated client
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma node_modules/@prisma

EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
