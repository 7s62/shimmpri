# Copyright 2021 - 2023 Transflox LLC. All rights reserved.

FROM --platform=linux/arm64 node:18-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json .
COPY pnpm-*.yaml .
COPY node_modules .

COPY packages/nft-server/package.json packages/nft-server/package.json
COPY packages/nft-server/dist packages/nft-server/dist
COPY packages/nft-server/node_modules packages/nft-server/node_modules

COPY packages/nft-server/src/templates /app/templates
RUN mkdir /app/images

RUN pnpm install

CMD [ "node","--trace-warnings", "--es-module-specifier-resolution=node", "/app/packages/nft-server/dist/main.js" ]
