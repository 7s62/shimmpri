// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import * as ethers from "ethers";
import abi from "../abi/ShimmpriNFT.json";
import { dbCollection } from "../db/collection";
import { Document, Collection, WithId } from "mongodb";
import { checkS3Exist, uploadMetadataToS3, uploadToS3 } from "../services/s3";
import lodash from "lodash";
import { IMAGE_DIR, IMAGE_PREFIX, S3_BUCKET, TEMPLATE_DIR } from "../config";
import logger from "../utils/log";
import Jimp from "jimp";

const httpProvider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!);
export const balue = new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS!, abi, httpProvider);

export type NFT = {
  name: string;
  image: any;
  description: string;

  attributes: [
    {
      trait_type: "level";
      value: number;
    },
    {
      trait_type: "point";
      value: number;
    },
    {
      trait_type: "day";
      value: number;
    }
  ];

  seller_fee_basis_points: 0;

  compiler: "shimmpri.xyz";
  external_url: "https://shimmpri.xyz/";
};

type NFTDocument = NFT & {
  _id: number;
  owner: string;
  day: number;
  level: number;
  point: number;
} & Document;
type DBNFT = WithId<NFTDocument>;

let nftColl: Collection<NFTDocument>;

export const nftCollInit = async () => {
  const { collection } = await dbCollection<NFTDocument>(process.env.DB__BALUE!, process.env.DB__BALUE__COLLECTION!);
  nftColl = collection;

  await nftColl.createIndex({ "attributes.[1].value": 1 });
  await nftColl.createIndex({ "attributes.[2].value": 1 });
  await nftColl.createIndex({ "attributes.[3].value": 1 });

  await nftColl.createIndex({ day: 1 });
  await nftColl.createIndex({ level: 1 });
  await nftColl.createIndex({ point: 1 });

  logger.info({ thread: "db", message: "db inited" });
};

const getNftByRange = async (day: number, level: number) => {
  const cursor = nftColl.aggregate([{ $match: { day, level } }, { $group: { _id: null, count: { $count: {} } } }]);

  for await (const event of cursor) {
    return event.count as number;
  }

  return 0;
};

export const handleNftId = async (id: number) => {
  logger.info({ thread: "handle", message: `handle NFT Id ${id}` });

  const total = await getTotalSupply();

  if (id >= total) {
    logger.info({ thread: "handle", message: `handle NFT id ${id}, but total supply is ${total}, return` });

    return;
  }

  const dbNft = await isExist(id);
  const s3Nft = await checkS3Exist(getJsonFilename(id));

  if (dbNft) {
    logger.info({ thread: "handle", mesasge: `handle NFT id ${id}, existed dbNft` });

    if (s3Nft) {
      logger.info({ thread: "handle", message: `handle NFT id ${id}, existed dbNft and s3Nft` });

      return;
    }

    logger.info({ thread: "handle", message: `handle NFT id ${id}, existed dbNft, do not exist s3Nft, create one` });

    const nft = dbNftToNft(dbNft);
    await uploadMetadataToS3(nft, getJsonFilename(id));
    await genImage(id, nft);
    await uploadToS3(`${IMAGE_DIR}/${id}.png`, `${id}.png`);

    return;
  }

  const owner = await balue.ownerOf(id);
  const day = (await getDayOfNFT(id)).toNumber();

  const nft = await newNft(id, day);
  await nftColl.insertOne({ ...nft, _id: id, owner, day, level: levelFromAttributes(nft), point: pointFromAttributes(nft) });

  // push to s3
  await uploadMetadataToS3(nft, getJsonFilename(id));

  await genImage(id, nft);
  await uploadToS3(`${IMAGE_DIR}/${id}.png`, `${id}.png`);

  // TO-DO: push to IPFS
};

const luckyTable = [1 / 300, 10 / 300, 30 / 300, 70 / 300, 189 / 300];
const luckyLevelRange = [0, ...Array(10).fill(1), ...Array(30).fill(2), ...Array(70).fill(3), ...Array(189).fill(4)];
const luckyMax = [1, 10, 30, 70, 189];
const luckyLevel = [5, 4, 3, 2, 1];

const range = [
  [100, 100],
  [95, 99],
  [80, 94],
  [50, 79],
  [0, 49],
];

const color = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];

const randomLuckyLevel = async (day: number) => {
  const current = lodash.sample(luckyLevelRange);
  const max = luckyMax[current];

  const count = await getNftByRange(day, current);
  if (count >= max) {
    return await randomLuckyLevel(day);
  }

  return current;
};

const randomRange = async (index: number) => {
  return lodash.random(range[index][0], range[index][1]);
};

export const getTotalSupply = async (): Promise<number> => {
  return (await balue.totalSupply()) as number;
};

const getCurrentDay = async (): Promise<number> => {
  return (await balue.getCurrentDay()) as number;
};

const isExist = async (id: number): Promise<DBNFT> => {
  const nft = await nftColl.findOne({ _id: id });
  return nft;
};

const getDayOfNFT = async (id: number) => {
  const day = (await balue.dayOfNFT(id)) as ethers.BigNumber;

  return day;
};

const dbNftToNft = (dbNft: DBNFT): NFT => {
  return {
    name: `Shimmpri #${dbNft._id}`,
    image: genImageS3URL(dbNft._id),
    description: dbNft.description,
    attributes: dbNft.attributes,
    seller_fee_basis_points: 0,
    compiler: "shimmpri.xyz",
    external_url: "https://shimmpri.xyz/",
  };
};

const newNft = async (id: number, day: number): Promise<NFT> => {
  const lucky = await randomLuckyLevel(day);
  const point = await randomRange(lucky);
  const level = luckyLevel[lucky];

  const nft: NFT = {
    name: `Shimmpri #${id}`,
    image: genImageS3URL(id),
    description: "",
    attributes: [
      {
        trait_type: "level",
        value: level,
      },
      {
        trait_type: "point",
        value: point,
      },
      {
        trait_type: "day",
        value: day,
      },
    ],
    seller_fee_basis_points: 0,
    compiler: "shimmpri.xyz",
    external_url: "https://shimmpri.xyz/",
  };

  return nft;
};

const genImageS3URL = (id: number) => {
  return `https://${S3_BUCKET}/images/${id}.png`;
};

const genMetadataS3URL = (id: number) => {
  return `https://${S3_BUCKET}/${id}.json`;
};

const getJsonFilename = (id: number) => {
  return `${id}.json`;
};

const levelFromAttributes = (nft: NFT) => {
  return nft.attributes[0].value;
};

const pointFromAttributes = (nft: NFT) => {
  return nft.attributes[1].value;
};

const dayFromAttributes = (nft: NFT) => {
  return nft.attributes[2].value;
};

const genImage = async (id: number, nft: NFT) => {
  // copy template and move to images
  // fs.copyFileSync(`${TEMPLATE_DIR}/${levelFromAttributes(nft)}.png`, `${IMAGE_DIR}/${id}.png`);

  const point = pointFromAttributes(nft);

  let image = await Jimp.read(`${TEMPLATE_DIR}/${IMAGE_PREFIX}${levelFromAttributes(nft)}-1024.png`);

  if (point === 0) {
    image = await Jimp.read(`${TEMPLATE_DIR}/${IMAGE_PREFIX}id0-1024.png`);
  }

  if (point === 50) {
    image = await Jimp.read(`${TEMPLATE_DIR}/${IMAGE_PREFIX}id50-1024.png`);
  }

  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontPoint = await Jimp.loadFont(`${TEMPLATE_DIR}/OYrmtVgCAYZDpQ8oqON0Vfor.ttf.fnt`);

  // add text to image

  const level = levelFromAttributes(nft);
  const day = dayFromAttributes(nft);

  // image.print(font, 1890, 2099, day);
  // image.print(font, 1375, 2099, level);
  // image.print(font, 890, 265, id);
  // image.print(fontPoint, 1270, 2300, point);

  image.print(font, 632, 710, day);
  image.print(font, 458, 710, level);
  image.print(font, 295, 90, id);
  image.print(fontPoint, 370, 740, point);

  await image.writeAsync(`${IMAGE_DIR}/${id}.png`);
};

export const updateOwner = async (id: number) => {
  const nft = await nftColl.findOne({ _id: id });

  if (!nft) {
    return;
  }

  const owner = await balue.ownerOf(id);

  logger.info({ thread: "model", model: "nft", message: `update owner ${id} ${owner}` });

  await nftColl.updateOne({ _id: id }, { $set: { owner } });
};

export const leaderboard = async () => {
  const cursor = nftColl.aggregate<{ address: string; point: number }>([
    {
      $group: {
        _id: "$owner",
        point: {
          $sum: "$point",
        },
        count: {
          $count: {},
        },
      },
    },
    {
      $sort: {
        point: -1,
      },
    },
    {
      $project: {
        _id: 0,
        address: "$_id",
        point: "$point",
        count: "$count",
      },
    },
  ]);

  const items: { address: string; point: number }[] = [];

  for await (const item of cursor) {
    items.push(item);
  }

  return items;
};
