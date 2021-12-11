FROM node:21-alpine3.18
WORKDIR /app

COPY ./package.json ./package-lock.json ./

# COPY ./public ./
# COPY ./src ./
# COPY ./index.html ./
# COPY ./package-lock.json ./
# COPY ./package.json ./
# COPY ./tsconfig.json ./
# COPY ./tsconfig.node.json ./
# COPY ./vite.config.js ./

RUN npm i
CMD npm run dev
EXPOSE 5173