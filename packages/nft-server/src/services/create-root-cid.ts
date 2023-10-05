// Copyright 2021 - 2023 Transflox LLC. All rights reserved.
/// <reference lib="dom" />

import { createFileEncoderStream, CAREncoderStream } from "ipfs-car";
import { TransformStream, WritableStream } from "stream/web";
import logger from "../utils/log";

const file = new Blob(["Shimmpri"]);
export let rootCID: string;

createFileEncoderStream(file)
  .pipeThrough(
    new TransformStream({
      transform(block, controller) {
        rootCID = block.cid;
        controller.enqueue(block);
      },
    }) as any
  )
  .pipeThrough(new CAREncoderStream())
  .pipeTo(new WritableStream())
  .then(() => {
    logger.info("root cid: ", rootCID.toString());
  });
