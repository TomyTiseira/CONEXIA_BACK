FROM node:22-alpine3.19

WORKDIR /src/app

COPY package*.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

RUN npm install -g ts-node

COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

CMD ["/usr/src/app/entrypoint.sh"]
