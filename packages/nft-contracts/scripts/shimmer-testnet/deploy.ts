// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { ethers, upgrades } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", owner.address);
  console.log("Account balance:", (await owner.getBalance()).toString());

  const ShimmpriNFT = await ethers.getContractFactory("ShimmpriNFT");
  const deployShimmpriNFT = await upgrades.deployProxy(ShimmpriNFT);
  const ShimmpriNFT = await deployShimmpriNFT.deployed();

  console.table({
    ShimmpriNFT: ShimmpriNFT.address,
  });

  // 0xbaB32969C57aED080CA56749184Df04dCB6c2F40
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
