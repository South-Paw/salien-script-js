FROM node:10-alpine

WORKDIR /app

COPY . /app

RUN npm install

ENTRYPOINT ["node", "bin/cli.js"]

CMD ["--help"]
