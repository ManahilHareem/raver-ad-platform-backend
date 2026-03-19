FROM node:20-alpine

WORKDIR /app

# Install dependencies based on package-lock.json (if present) or package.json
COPY package*.json ./
RUN npm ci || npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port (matching .env.example)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
