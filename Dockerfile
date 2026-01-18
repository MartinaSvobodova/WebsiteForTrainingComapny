# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Create the production image
FROM node:20-alpine

WORKDIR /app
# Copy the build output and node_modules from the builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

# Expose the port (SvelteKit defaults to 3000)
EXPOSE 3000
ENV NODE_ENV=production

# Start the server
CMD ["node", "build"]