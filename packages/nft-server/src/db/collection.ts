// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import { client } from ".";
import { Document } from "mongodb";

export const dbCollection = async <T extends Document>(databaseName: string, collectionName: string) => {
  const db = client.db(databaseName);
  const collection = db.collection<T>(collectionName);

  return { collection };
};
