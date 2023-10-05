// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import { Upload } from "@aws-sdk/lib-storage";
import { S3 } from "@aws-sdk/client-s3";
import fs from "fs";
import { NFT } from "../models/nft";
import logger from "../utils/log";
import { S3_BUCKET } from "../config";

const s3 = new S3({
  apiVersion: "2006-03-01",
  credentials: {
    accessKeyId: process.env.AWS_ID!,
    secretAccessKey: process.env.AWS_KEY!,
  },
  region: process.env.S3_REGION!,
});

export const uploadToS3 = async (filePath: string, uploadedFilePath: string) => {
  const fileStream = fs.createReadStream(filePath);

  fileStream.on("error", function (err) {
    logger.error({ thread: "s3", message: "load file error", error: err, filePath });
  });

  try {
    const data = new Upload({
      client: s3,
      params: {
        Bucket: S3_BUCKET,
        Key: `images/${uploadedFilePath}`,
        Body: fileStream,
        ContentType: "image/png",
        ContentDisposition: `inline; filename=${uploadedFilePath}`,
        ACL: "public-read",
      },
    });

    await data.done();

    logger.info({ thread: "s3", message: "upload image to s3 success", filePath });
  } catch (e) {
    logger.error({ thread: "s3", message: "upload image to s3 error", error: JSON.stringify(e), errorMessage: e.message, errorCode: e.code, filePath });
  }
};

export const uploadMetadataToS3 = async (data: NFT, filename: string) => {
  try {
    await s3.putObject({
      Bucket: S3_BUCKET,
      Key: filename,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
      ACL: "public-read",
    });

    logger.info({ thread: "s3", message: "upload metadata to s3 success", filename });
  } catch (error) {
    logger.error({ thread: "s3", message: "upload metadata to s3 error", errorName: error.name, errorCode: error.code, error: JSON.stringify(error), errorMessage: error.message, filename });
  }
};

export const getS3Json = async (filename: string) => {
  return new Promise((resolve, reject) => {
    s3.getObject(
      {
        Bucket: S3_BUCKET,
        Key: filename,
      },
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }
    );
  });
};

export const checkS3Exist = async (filename: string) => {
  try {
    await s3.headObject({
      Bucket: S3_BUCKET,
      Key: filename,
    });
    return true;
  } catch (error) {
    if (error.name === "NotFound") {
      return false;
    }
  }
};
