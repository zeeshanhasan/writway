FROM node:18-alpine

WORKDIR /app

# 1) Copy monorepo root manifests (requires build context = repo root)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY database/package.json ./database/package.json

# 2) Install dependencies for all workspaces
RUN npm ci

# 3) Copy full source (backend + database for Prisma schema)
COPY . .

# 4) Generate Prisma Client using database schema
RUN npx prisma generate --schema ./database/prisma/schema.prisma

# 5) Build backend
RUN npm run --workspace backend build

# 6) Expose and start
EXPOSE 4000
CMD ["npm", "run", "--workspace", "backend", "start"]
