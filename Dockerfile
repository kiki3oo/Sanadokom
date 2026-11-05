FROM node:20-slim

WORKDIR /app

# Install openssl required by Prisma engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies based on package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/prisma/dev.db"
ENV HOSTNAME="0.0.0.0"

# Generate Prisma client and build Next.js
RUN npx prisma generate
RUN npm run build

# Ensure database directory and files have full read-write permissions for SQLite
RUN chmod -R 777 /app/prisma

# Expose both standard Next.js port and HTTP port
EXPOSE 3000
EXPOSE 80

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npx next start -H 0.0.0.0"]
