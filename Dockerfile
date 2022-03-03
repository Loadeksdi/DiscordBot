FROM node:17-alpine

WORKDIR /usr/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

CMD ["node","src/script.js"]