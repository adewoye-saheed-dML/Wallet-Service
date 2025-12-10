# 1. Use Node.js image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy the rest of the code
COPY . .

# 5. Build the NestJS app
RUN npm run build

# 6. Create a user (Hugging Face requires a non-root user usually)
RUN adduser -D -u 1000 user
USER user

# 7. Expose the port (Hugging Face uses port 7860 by default)
ENV PORT=7860
EXPOSE 7860

# 8. Start the app
CMD ["npm", "run", "start:prod"]