FROM node:20-alpine

WORKDIR /app

# Cài dependencies trước (tận dụng Docker cache)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
