// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import { scanNFTs } from "../action/scan-nfts";
import { createCron } from "../services/cron";
import logger from "../utils/log";

export const cronInit = () => {
  // https://crontab.cronhub.io/
  if (process.env.START_CRON === "true") {
    const scanNftsJob = createCron("0/5 * * * *", function () {
      logger.info({ thread: "cron", type: "nft scan 5mins" });

      try {
        scanNFTs();
      } catch (e) {
        logger.info({ thread: "cron", type: "nft scan 15mins", error: e });
      }
    });

    const scanNftsJobAgainJob = createCron("0/120 * * * *", function () {
      logger.info({ thread: "cron", type: "cron nft scan 120mins" });

      try {
        scanNFTs();
      } catch (e) {
        logger.info({ thread: "cron", type: "cron nft scan 120mins", error: e });
      }
    });

    (() => {
      scanNftsJob.start();
      scanNftsJobAgainJob.start();

      logger.info({ thread: "cron", message: "cron started" });
    })();
  } else {
    logger.info({ thread: "cron", message: "do not start cron" });
  }
};
