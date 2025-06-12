FROM node:22-alpine3.19

WORKDIR /src/app

COPY package*.json ./
COPY package-lock.json ./

RUN npm install

COPY . .
