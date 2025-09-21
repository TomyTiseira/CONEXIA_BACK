FROM node:22-alpine3.19

WORKDIR /src/app

COPY package*.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

RUN npm install -g ts-node

# Copiar entrypoint y asegurar que funcione en todos los SO
COPY entrypoint.sh /src/app/entrypoint.sh
RUN chmod +x /src/app/entrypoint.sh && \
    dos2unix /src/app/entrypoint.sh 2>/dev/null || true

CMD ["/src/app/entrypoint.sh"]
