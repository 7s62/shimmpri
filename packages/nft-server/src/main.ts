// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import Koa from "koa";
import koaLogger from "koa-pino-logger";
import { client } from "./db";
import logger from "./utils/log";
import Router from "@koa/router";
import helmet from "koa-helmet";
import { corsMiddleware } from "./middlewares/cors";
import { cacheMiddleware } from "./middlewares/cache";
import { dateRangeMiddleware } from "./middlewares/date-range";
import { paginationMiddleware } from "./middlewares/page";
import { cronInit } from "./cron";
import { limiter } from "./middlewares/limiter";
import { notFound } from "./middlewares/not-found";
import bodyParser from "koa-bodyparser";
import { leaderboard, nftCollInit } from "./models/nft";
import { listenerInit } from "./listener/mintNftListener";

(async function main() {
  // create app
  const app = new Koa();

  app.use(cacheMiddleware);
  app.use(koaLogger());
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  app.use(corsMiddleware);
  app.use(bodyParser());

  await client.connect();
  client.on("close", () => {
    client.connect();
  });

  await nftCollInit();

  // app router
  const router = new Router({ prefix: "/v1" });
  router.use(dateRangeMiddleware);
  router.use(paginationMiddleware);

  router.get("/", (ctx) => {
    ctx.body = "API";
  });

  router.get("/leaderboard", async (ctx) => {
    if (await ctx.cashed()) return;

    ctx.body = await leaderboard();
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(limiter);
  app.use(notFound);

  const port = 3333;

  // app
  app.listen(port);

  // app info
  logger.info({ thread: "main", data: "service started", port });

  cronInit();
  listenerInit();
})();
