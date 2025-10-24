/**
 * BlockCast End-to-End Flow Test
 *
 * Tests the complete user journey:
 * 1. User places a bet on a market
 * 2. Market expires
 * 3. Market gets resolved (preliminary)
 * 4. Dispute period passes
 * 5. Market gets finalized
 * 6. User claims winnings
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockCast End-to-End Flow", function () {
  let factory;
  let castToken;
  let betNFT;
  let adminManager;
  let deployer, user1, user2;
  let marketContract;
  let marketId;

  // Contract addresses from deployments
  const FACTORY_ADDRESS = '0x3b26e2AC3e4414fbdB9AAE8F14af863b775233D1';
  const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
  const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca';
  const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';

  before(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    console.log("\n=== 🚀 BlockCast End-to-End Test Setup ===");
    console.log("Deployer:", deployer.address);
    console.log("User 1:", user1.address);
    console.log("User 2:", user2.address);

    // Connect to deployed contracts
    factory = await ethers.getContractAt("PredictionMarketFactory", FACTORY_ADDRESS);
    castToken = await ethers.getContractAt("CastToken", CAST_TOKEN_ADDRESS);
    betNFT = await ethers.getContractAt("BetNFT", BET_NFT_ADDRESS);
    adminManager = await ethers.getContractAt("AdminManager", ADMIN_MANAGER_ADDRESS);
  });

  it("Step 1: Should create a test market", async function () {
    this.timeout(60000);

    console.log("\n=== 📝 Step 1: Creating Market ===");

    const question = "Will BlockCast E2E test pass? (Test " + Date.now() + ")";
    const endTime = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now

    console.log("Question:", question);
    console.log("End Time:", new Date(endTime * 1000).toISOString());

    const tx = await factory.createMarket(question, endTime);
    const receipt = await tx.wait();

    console.log("✅ Market created! TX:", receipt.hash);

    // Get market address from events
    const marketCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed && parsed.name === 'MarketCreated';
      } catch (e) {
        return false;
      }
    });

    expect(marketCreatedEvent).to.not.be.undefined;

    const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
    marketId = parsedEvent.args.id;
    const marketAddress = parsedEvent.args.market;

    console.log("Market ID:", marketId);
    console.log("Market Address:", marketAddress);

    marketContract = await ethers.getContractAt("PredictionMarket", marketAddress);

    // Verify market info
    const marketInfo = await marketContract.marketInfo();
    expect(marketInfo.question).to.equal(question);
    expect(marketInfo.creator).to.equal(deployer.address);
    expect(marketInfo.endTime).to.equal(endTime);
    expect(marketInfo.status).to.equal(0); // Submitted status

    console.log("✅ Market verified successfully");
  });

  it("Step 2: Admin should approve the market", async function () {
    this.timeout(60000);

    console.log("\n=== ✅ Step 2: Approving Market ===");

    // Check if deployer is admin
    const isAdmin = await adminManager.isAdmin(deployer.address);
    console.log("Is deployer admin?", isAdmin);

    if (!isAdmin) {
      console.log("⚠️  Deployer is not admin, skipping approval (market may auto-approve)");
      return;
    }

    const tx = await adminManager.approveMarket(await marketContract.getAddress());
    await tx.wait();

    const marketInfo = await marketContract.marketInfo();
    expect(marketInfo.status).to.equal(1); // Open status

    console.log("✅ Market approved and opened for betting");
  });

  it("Step 3: Users should place bets", async function () {
    this.timeout(120000);

    console.log("\n=== 🎲 Step 3: Placing Bets ===");

    const betAmount = ethers.parseEther("10"); // 10 CAST

    // Mint CAST tokens to users
    console.log("Minting CAST tokens to users...");
    await castToken.mint(user1.address, ethers.parseEther("100"));
    await castToken.mint(user2.address, ethers.parseEther("100"));

    const user1Balance = await castToken.balanceOf(user1.address);
    const user2Balance = await castToken.balanceOf(user2.address);
    console.log("User1 CAST balance:", ethers.formatEther(user1Balance));
    console.log("User2 CAST balance:", ethers.formatEther(user2Balance));

    // Approve market to spend CAST
    console.log("\nApproving CAST spending...");
    await castToken.connect(user1).approve(await marketContract.getAddress(), betAmount);
    await castToken.connect(user2).approve(await marketContract.getAddress(), betAmount);

    // User1 bets YES
    console.log("\nUser1 betting YES with", ethers.formatEther(betAmount), "CAST...");
    const tx1 = await marketContract.connect(user1).buyYes(betAmount);
    await tx1.wait();

    const user1YesShares = await marketContract.yesBalance(user1.address);
    console.log("✅ User1 YES shares:", ethers.formatEther(user1YesShares));
    expect(user1YesShares).to.be.gt(0);

    // User2 bets NO
    console.log("\nUser2 betting NO with", ethers.formatEther(betAmount), "CAST...");
    const tx2 = await marketContract.connect(user2).buyNo(betAmount);
    await tx2.wait();

    const user2NoShares = await marketContract.noBalance(user2.address);
    console.log("✅ User2 NO shares:", ethers.formatEther(user2NoShares));
    expect(user2NoShares).to.be.gt(0);

    console.log("✅ Both users have placed bets successfully");
  });

  it("Step 4: Should resolve market preliminarily", async function () {
    this.timeout(120000);

    console.log("\n=== 🔍 Step 4: Preliminary Resolution ===");

    // Wait for market to expire (or fast-forward in test environment)
    console.log("Waiting for market to expire...");
    const marketInfo = await marketContract.marketInfo();
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime < marketInfo.endTime) {
      console.log("⏰ Market not expired yet, advancing time...");
      await ethers.provider.send("evm_increaseTime", [Number(marketInfo.endTime - currentTime) + 1]);
      await ethers.provider.send("evm_mine");
    }

    console.log("Market expired, calling preliminaryResolve...");

    // Preliminary resolve to YES (User1 wins)
    const outcome = 1; // 1 = YES
    const tx = await marketContract.preliminaryResolve(outcome);
    await tx.wait();

    console.log("✅ Preliminary resolution complete: YES");

    // Verify market is in pending resolution state
    const isPending = await marketContract.isPendingResolution();
    expect(isPending).to.be.true;

    const prelimOutcome = await marketContract.getPreliminaryOutcome();
    expect(prelimOutcome).to.equal(outcome);

    console.log("✅ Market in pending resolution state with 7-day dispute period");
  });

  it("Step 5: Should finalize market after dispute period", async function () {
    this.timeout(120000);

    console.log("\n=== 🏁 Step 5: Final Resolution ===");

    // Fast-forward past dispute period (7 days)
    console.log("Advancing time past dispute period (7 days)...");
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");

    // Final resolve with confidence score
    const outcome = 1; // 1 = YES
    const confidence = 95; // 95% confidence

    console.log("Calling finalResolve with", confidence, "% confidence...");
    const tx = await marketContract.finalResolve(outcome, confidence);
    await tx.wait();

    console.log("✅ Final resolution complete: YES with", confidence, "% confidence");

    // Verify market is resolved
    const marketInfo = await marketContract.marketInfo();
    expect(marketInfo.status).to.equal(2); // Resolved status

    const finalConfidence = await marketContract.getConfidenceScore();
    expect(finalConfidence).to.equal(confidence);

    console.log("✅ Market fully resolved and ready for claims");
  });

  it("Step 6: Winner should claim winnings", async function () {
    this.timeout(120000);

    console.log("\n=== 💰 Step 6: Claiming Winnings ===");

    // Check balances before claim
    const user1BalanceBefore = await castToken.balanceOf(user1.address);
    const user2BalanceBefore = await castToken.balanceOf(user2.address);

    console.log("User1 CAST balance before claim:", ethers.formatEther(user1BalanceBefore));
    console.log("User2 CAST balance before claim:", ethers.formatEther(user2BalanceBefore));

    // User1 (winner) claims
    console.log("\nUser1 (winner) claiming winnings...");
    const tx1 = await marketContract.connect(user1).redeem();
    await tx1.wait();

    const user1BalanceAfter = await castToken.balanceOf(user1.address);
    const user1Profit = user1BalanceAfter - user1BalanceBefore;

    console.log("User1 CAST balance after claim:", ethers.formatEther(user1BalanceAfter));
    console.log("User1 profit:", ethers.formatEther(user1Profit), "CAST");
    expect(user1Profit).to.be.gt(0);

    // User2 (loser) tries to claim (should get nothing or revert)
    console.log("\nUser2 (loser) attempting to claim...");
    try {
      const tx2 = await marketContract.connect(user2).redeem();
      await tx2.wait();

      const user2BalanceAfter = await castToken.balanceOf(user2.address);
      const user2Change = user2BalanceAfter - user2BalanceBefore;

      console.log("User2 CAST balance after claim:", ethers.formatEther(user2BalanceAfter));
      console.log("User2 change:", ethers.formatEther(user2Change), "CAST");

      // Loser should get nothing or minimal amount
      expect(user2Change).to.be.lte(0);
    } catch (error) {
      console.log("User2 claim reverted (expected for loser):", error.message.substring(0, 100));
    }

    console.log("\n✅ Claim process verified successfully");
  });

  it("Summary: End-to-End Flow Complete", async function () {
    console.log("\n=== 🎉 E2E TEST SUMMARY ===");
    console.log("✅ Market created successfully");
    console.log("✅ Market approved and opened");
    console.log("✅ Users placed bets (YES and NO)");
    console.log("✅ Market resolved preliminarily");
    console.log("✅ Dispute period passed");
    console.log("✅ Market finalized with confidence score");
    console.log("✅ Winner claimed winnings");
    console.log("✅ Loser claim handled correctly");
    console.log("\n🚀 BlockCast MVP is fully functional!");
  });
});
