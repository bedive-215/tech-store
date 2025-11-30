FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json + package-lock.json (nếu có)
COPY package*.json ./

# Cài tất cả dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

EXPOSE 3000

# CMD đúng file index.js
CMD ["node", "index.js"]
