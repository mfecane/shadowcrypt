FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

COPY . .

CMD ["sh", "-c", "npm install && npm run dev"]
