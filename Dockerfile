# syntax=docker/dockerfile:1
FROM node:18

WORKDIR /infinityedge

COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn

COPY . .

RUN apt update && apt install -y smbclient

CMD ["yarn", "run", "dev"]
