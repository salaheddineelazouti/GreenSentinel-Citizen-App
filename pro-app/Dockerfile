# Production Dockerfile for Pro App (Vite React)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install Express for a simple static file server
RUN npm install express

# Copy source code and server.js
COPY . .

# Build the app for production
RUN npm run build

# Expose port
EXPOSE 5173

# Start the Express server
CMD ["node", "server.js"]
