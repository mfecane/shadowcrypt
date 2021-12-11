FROM node:21-alpine3.18
WORKDIR /app
# COPY . .
RUN npm install -g firebase-tools
RUN apk update \
  && apk upgrade \
  && apk add --update openjdk11 tzdata curl unzip bash \
  && rm -rf /var/cache/apk/*
# RUN firebase login:ci
# CMD ["firebase", "emulators:start", "--export-on-exit=./backup", "--import=./backup"]
CMD firebase emulators:start --export-on-exit=./backup --import=./backup
EXPOSE 4001
EXPOSE 4400
EXPOSE 4500
EXPOSE 8083
EXPOSE 9099
EXPOSE 9150
EXPOSE 9199