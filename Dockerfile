FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Copiar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar artefactos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]