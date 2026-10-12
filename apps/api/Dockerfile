# Build context: repository root
#   docker build -f apps/api/Dockerfile .

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# openssl for Prisma engines, build tools for bcrypt native module
RUN apk add --no-cache openssl python3 make g++

# Root + all workspace manifests so `npm ci` matches the lockfile
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY prisma/ prisma/

RUN npm ci --workspace=@car/api --include-workspace-root

# Source
COPY apps/api/ apps/api/

# Prisma client + API build
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build --workspace=@car/api

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
