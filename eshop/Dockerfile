# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .
COPY .env.production .env.production

# Build Next.js application
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Set environment
ENV NODE_ENV=production

# Copy only necessary files from builder
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.production ./.env.production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run Node
ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["npm", "start"]
