# Frontend (Angular) - Development Dockerfile
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli@latest

# Install dependencies first (leverage Docker layer cache)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose dev server port
EXPOSE 4200

# Start Angular dev server bound to 0.0.0.0 for container access
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
