// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", owner.address);
  console.log("Account balance:", (await owner.getBalance()).toString());

  const ShimmpriNFT = await ethers.getContractFactory("ShimmpriNFT");
  const ShimmpriNFT = ShimmpriNFT.attach("0xFDD8077253237cAdEd0FE662e6755F26886b3CC0");

  const tx = await ShimmpriNFT.connect(owner).unpause();
  console.log(tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
