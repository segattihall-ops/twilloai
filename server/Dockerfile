FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server code
COPY realtime.js ./

# Expose WebSocket port
EXPOSE 8080

# Expose health check port
EXPOSE 8081

# Start the server
CMD ["npm", "start"]
