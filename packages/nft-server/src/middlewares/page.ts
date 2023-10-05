// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import Koa from "koa";

export const paginationMiddleware = async (ctx: any, next: Koa.Next) => {
  let page = Number(ctx.query["page"] || 1);
  if (isNaN(page)) {
    page = 1;
  }
  if (page < 1) {
    page = 1;
  }

  let limit = Number(ctx.query["limit"] || 50);
  if (isNaN(limit)) {
    limit = 50;
  }
  if (limit > 200) {
    limit = 200;
  }
  ctx.page = page;
  ctx.limit = limit;

  await next();
};
