FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 4202

# Development command (will be overridden in docker-compose)
CMD ["npm", "run", "dev"]
