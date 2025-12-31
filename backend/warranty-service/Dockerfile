FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3006

CMD ["node", "src/server.js"]