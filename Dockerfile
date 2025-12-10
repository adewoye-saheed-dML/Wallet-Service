# 1. Base image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy source code
COPY . .

# 6. Build the app
RUN npm run build

# 7. Expose the port (Fly.io will use 8080 internally)
EXPOSE 8080

# 8. Start command
CMD ["npm", "run", "start:prod"]
