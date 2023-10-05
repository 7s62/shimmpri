// Copyright 2021 - 2023 Transflox LLC. All rights reserved.

import "@nomicfoundation/hardhat-chai-matchers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("Shimmpri NFT", function () {
  let shimmpriNFT: Contract;

  let owner: SignerWithAddress, addr1: SignerWithAddress, addr2: SignerWithAddress;

  let startTime = 0;

  const deploy = async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ShimmpriNFT = await ethers.getContractFactory("ShimmpriNFT");
    const deployShimmpriNFT = await upgrades.deployProxy(ShimmpriNFT);
    shimmpriNFT = await deployShimmpriNFT.deployed();
  };

  const setSpec = async () => {
    await expect(shimmpriNFT.connect(owner).setSpec()).to.not.reverted;
    await expect(shimmpriNFT.connect(addr1).setSpec()).to.be.reverted;
  };

  const unpause = async () => {
    await expect(shimmpriNFT.connect(owner).unpause()).to.not.reverted;
    await expect(shimmpriNFT.connect(addr1).unpause()).to.be.reverted;
  };

  const setStartTimeNow = async () => {
    const now = Math.floor(Date.now() / 1000);
    startTime = now;
    await expect(shimmpriNFT.connect(owner).setStartTime(now)).to.not.reverted;
  };

  const setMultiPerAddress = async () => {
    expect(shimmpriNFT.connect(owner).setOneNftPerAddress(false)).to.not.reverted;
  };

  const setOnePerAddress = async () => {
    expect(shimmpriNFT.connect(owner).setOneNftPerAddress(true)).to.not.reverted;
  };

  describe("Shimmpri NFT - mint max all", async () => {
    beforeEach(async () => {
      await ethers.provider.send("evm_setAutomine", [true]);
      await ethers.provider.send("evm_setIntervalMining", [0]);

      await deploy();
      await setSpec();
      await setStartTimeNow();
      await setMultiPerAddress();

      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Pausable: paused");
      await unpause();
    });

    it("max of all mint", async function () {
      for (let day = 0; day < 6; day++) {
        for (let index = 0; index < 300; index++) {
          await expect(shimmpriNFT.connect(owner).safeMint()).to.be.not.reverted;
        }

        if (day == 5) {
          await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Reach max supply");
          continue;
        }

        await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Reach max per day");

        const left = (await time.latest()) - (startTime + day * 86400);

        expect(await shimmpriNFT.connect(owner).currentDay()).to.eq(ethers.BigNumber.from(day));

        await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + (day + 1) * 86400 + left]);
        await ethers.provider.send("evm_mine", []);
      }
    });
  });

  describe("Shimmpri NFT - time", async () => {
    beforeEach(async () => {
      await ethers.provider.send("hardhat_reset", []);

      await deploy();
      await setSpec();
    });

    it("not start yet", async function () {
      await unpause();

      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Not start yet");
    });

    it("can get currentDay", async function () {
      expect(await shimmpriNFT.connect(owner).currentDay()).to.be.eq(ethers.BigNumber.from(0));
    });

    it("can get currentDay + 1 day", async function () {
      await setStartTimeNow();

      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 1 * 86400]);
      await ethers.provider.send("evm_mine", []);

      expect(await shimmpriNFT.connect(owner).currentDay()).to.be.eq(ethers.BigNumber.from(1));
    });

    it("can get currentDay + 2 days", async function () {
      await setStartTimeNow();

      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 2 * 86400]);
      await ethers.provider.send("evm_mine", []);

      expect(await shimmpriNFT.connect(owner).currentDay()).to.be.eq(ethers.BigNumber.from(2));
    });

    it("can get currentDay + 3 days", async function () {
      await setStartTimeNow();

      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 3 * 86400]);
      await ethers.provider.send("evm_mine", []);

      expect(await shimmpriNFT.connect(owner).currentDay()).to.be.eq(ethers.BigNumber.from(3));
    });
  });

  describe("Shimmpri NFT - one per address", async () => {
    beforeEach(async () => {
      await ethers.provider.send("hardhat_reset", []);
      await ethers.provider.send("evm_setIntervalMining", [50]);

      await deploy();
      await setSpec();
      await setStartTimeNow();
      await setOnePerAddress();

      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]);
    });

    it("can be catch one nft per address only", async function () {
      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Pausable: paused");

      await unpause();

      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.not.reverted;
      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Minted today");
    });
  });

  describe("Shimmpri NFT - mint max day", async () => {
    beforeEach(async () => {
      await ethers.provider.send("hardhat_reset", []);
      await ethers.provider.send("evm_setIntervalMining", [50]);

      await deploy();
      await setSpec();
      await setStartTimeNow();
      await setMultiPerAddress();

      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]);
    });

    it("pause, unpause and can mint", async function () {
      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Pausable: paused");

      await unpause();

      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.not.reverted;
    });

    it("max of day mint", async function () {
      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Pausable: paused");

      await unpause();

      for (let index = 0; index < 300; index++) {
        await expect(shimmpriNFT.connect(owner).safeMint()).to.be.not.reverted;
      }

      await expect(shimmpriNFT.connect(owner).safeMint()).to.be.revertedWith("Reach max per day");
    });
  });

  describe("Shimmpri NFT - total supply", async () => {
    beforeEach(async () => {
      await ethers.provider.send("hardhat_reset", []);
      await ethers.provider.send("evm_setIntervalMining", [50]);

      await deploy();
      await setSpec();
      await setStartTimeNow();
      await setMultiPerAddress();

      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]);
    });

    it("can get total supply", async () => {
      expect(await shimmpriNFT.connect(owner).totalSupply()).to.be.eq(ethers.BigNumber.from(0));
    });
  });
});
