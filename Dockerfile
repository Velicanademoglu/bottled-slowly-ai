# ---- Stage 1: build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build backend ----
FROM node:20-alpine AS backend-build
RUN apk add --no-cache openssl
WORKDIR /app/backend
# Placeholder URL: prisma generate only validates the protocol, no connection is made
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY backend/ ./
RUN npx prisma generate && npm run build

# ---- Stage 3: production runtime ----
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist /app/static
ENV STATIC_DIR=/app/static
EXPOSE 8080
CMD ["node", "dist/index.js"]
