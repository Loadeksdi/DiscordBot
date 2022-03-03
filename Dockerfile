FROM node:17-alpine

WORKDIR /usr/app

RUN apk add curl \
    && apk update \
    && apk upgrade \
    && curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

COPY pnpm-lock.yaml ./

RUN pnpm fetch --prod

ADD . ./
RUN pnpm install -r --offline --prod

CMD ["node","src/script.js"]