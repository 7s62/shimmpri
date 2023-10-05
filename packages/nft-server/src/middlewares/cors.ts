// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import cors from "@koa/cors";

export const corsMiddleware = cors({
  origin: (ctx): string => {
    const validDomains = ["http://localhost:8080", "https://staging-11e08a6f.shimmpri.xyz", "https://shimmpri.xyz", "https://testnet.shimmpri.xyz"];
    if (validDomains.indexOf(ctx.request.header.origin!) !== -1) {
      return ctx.request.header.origin || "";
    }
    return "";
  },
  credentials: true,
});
