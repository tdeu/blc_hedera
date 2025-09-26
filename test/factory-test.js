const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarketFactory Test", function () {
  let factory;
  let adminManager;
  let treasury;
  let castToken;
  let betNFT;
  let deployer;

  // Contract addresses from deployments-testnet.json (latest)
  const FACTORY_ADDRESS = '0x3b26e2AC3e4414fbdB9AAE8F14af863b775233D1';
  const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
  const TREASURY_ADDRESS = '0x69649cc208138B3A2c529cB301D7Bb591C53a2e2';
  const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
  const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca';

  before(async function () {
    [deployer] = await ethers.getSigners();

    console.log("Testing with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

    // Connect to deployed contracts
    factory = await ethers.getContractAt("PredictionMarketFactory", FACTORY_ADDRESS);
    adminManager = await ethers.getContractAt("AdminManager", ADMIN_MANAGER_ADDRESS);
    treasury = await ethers.getContractAt("Treasury", TREASURY_ADDRESS);
    castToken = await ethers.getContractAt("CastToken", CAST_TOKEN_ADDRESS);
    betNFT = await ethers.getContractAt("BetNFT", BET_NFT_ADDRESS);
  });

  it("Should have correct contract configuration", async function () {
    console.log("\n=== Testing Factory Configuration ===");

    const factoryAdminManager = await factory.adminManager();
    const factoryTreasury = await factory.treasury();
    const factoryCastToken = await factory.castToken();
    const factoryCollateral = await factory.collateral();
    const factoryBetNFT = await factory.betNFT();

    console.log("Factory AdminManager:", factoryAdminManager);
    console.log("Factory Treasury:", factoryTreasury);
    console.log("Factory CastToken:", factoryCastToken);
    console.log("Factory Collateral:", factoryCollateral);
    console.log("Factory BetNFT:", factoryBetNFT);

    console.log("\nExpected addresses:");
    console.log("AdminManager expected:", ADMIN_MANAGER_ADDRESS);
    console.log("Treasury expected:", TREASURY_ADDRESS);
    console.log("CastToken expected:", CAST_TOKEN_ADDRESS);
    console.log("BetNFT expected:", BET_NFT_ADDRESS);

    expect(factoryAdminManager.toLowerCase()).to.equal(ADMIN_MANAGER_ADDRESS.toLowerCase());
    expect(factoryTreasury.toLowerCase()).to.equal(TREASURY_ADDRESS.toLowerCase());
    expect(factoryCastToken.toLowerCase()).to.equal(CAST_TOKEN_ADDRESS.toLowerCase());
    expect(factoryBetNFT.toLowerCase()).to.equal(BET_NFT_ADDRESS.toLowerCase());
  });

  it("Should check if factory is paused", async function () {
    const isPaused = await factory.isFactoryPaused();
    console.log("Factory paused:", isPaused);
    expect(isPaused).to.be.false;
  });

  it("Should check admin permissions", async function () {
    const isAdmin = await adminManager.isAdmin(deployer.address);
    console.log("Deployer is admin:", isAdmin);
    expect(isAdmin).to.be.true;
  });

  it("Should create a test market", async function () {
    this.timeout(120000); // 2 minute timeout

    console.log("\n=== Testing Market Creation ===");

    const question = `Test market ${Date.now()}`;
    const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

    console.log("Creating market with question:", question);
    console.log("End time:", new Date(endTime * 1000).toISOString());

    // Try to estimate gas first
    let gasEstimate;
    try {
      gasEstimate = await factory.estimateGas.createMarket(question, endTime);
      console.log("Gas estimate:", gasEstimate.toString());
    } catch (gasError) {
      console.log("Gas estimation failed:", gasError.message);
    }

    const tx = await factory.createMarket(question, endTime, {
      gasLimit: 15000000 // 15M gas limit
    });

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");

    expect(receipt.status).to.equal(1);

    // Find the MarketCreated event
    const event = receipt.events?.find(e => e.event === 'MarketCreated');
    if (event) {
      console.log("✅ Market created successfully!");
      console.log("Market ID:", event.args.id);
      console.log("Market address:", event.args.market);
      console.log("Question:", event.args.question);

      expect(event.args.question).to.equal(question);
      expect(event.args.market).to.not.equal(ethers.constants.AddressZero);
    } else {
      throw new Error("MarketCreated event not found");
    }
  });
});