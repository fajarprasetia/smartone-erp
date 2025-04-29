FROM node:20-alpine AS build

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all files
COPY . .

# Create .env.production file for build
RUN echo "DATABASE_URL=postgresql://postgres:0135@db:5432/smartone_erp\nNEXTAUTH_URL=http://localhost:3100" > .env.production

# Build the app
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Copy necessary files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.env.production ./.env.production

EXPOSE 3000

# Start the app
CMD ["pnpm", "start"] 