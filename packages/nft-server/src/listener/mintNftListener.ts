// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import { ethers } from "ethers";
import { handleNftId } from "../models/nft";
import logger from "../utils/log";
import abi from "../abi/ShimmpriNFT.json";
import sleep from "../utils/sleep";

export const listenerInit = () => {
  logger.info({ thread: "listener", message: "listener started" });

  const wssProvider = new ethers.providers.WebSocketProvider(process.env.RPC_WSS!);
  const baluewss = new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS!, abi, wssProvider);

  wssProvider._websocket.on("close", async () => {
    wssProvider._websocket.terminate();
    await sleep(500);

    listenerInit();
  });

  baluewss.on("Transfer", (from, to, value: ethers.BigNumber, event) => {
    if (from !== "0x0000000000000000000000000000000000000000") {
      return;
    }

    const nftId = value.toNumber();

    logger.info("mint listener", nftId);

    handleNftId(nftId);
  });
};
