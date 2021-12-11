FROM node:16.18.1-alpine3.17
WORKDIR /app
COPY ./package.json ./package-lock.json ./
RUN npm i
CMD npm run serve
EXPOSE 3000