// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import { NFTStorage, File } from "nft.storage";
import fs from "fs";
import path from "path";
import mine from "mime";

async function fileFromPath(filePath: string) {
  const content = await fs.promises.readFile(filePath);

  const type = mine.getType(filePath);
  return new File([content], path.basename(filePath), { type: type! });
}

export async function storeNFT(imagePath: string, name: string, description: string) {
  const image = await fileFromPath(imagePath);

  const nftstorage = new NFTStorage({ token: process.env.NFT_STORAGE_KEY! });

  return nftstorage.store({ image, name, description });
}
