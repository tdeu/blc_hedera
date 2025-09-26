async function main() {
  // Use dynamic import for ethers
  const { ethers } = await import("ethers");

  console.log("🚀 Deploying FINAL PredictionMarketFactory with correct addresses...");

  // Use the LATEST addresses from deployments-testnet.json
  const ADMIN_MANAGER = "0x94FAF61DE192D1A441215bF3f7C318c236974959";
  const TREASURY = "0x69649cc208138B3A2c529cB301D7Bb591C53a2e2";
  const CAST_TOKEN = "0xC78Ac73844077917E20530E36ac935c4B56236c2";  // Use as both token AND collateral
  const BET_NFT = "0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca";

  // Use the working private key from your hederaEVMService
  const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";

  // Create provider and signer
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(privateKey, provider);

  console.log("📋 Deployer address:", signer.address);
  console.log("📋 Balance:", ethers.formatEther(await provider.getBalance(signer.address)), "HBAR");

  console.log("\n🔍 Verifying contract addresses...");
  console.log("AdminManager:", ADMIN_MANAGER);
  console.log("Treasury:", TREASURY);
  console.log("CastToken:", CAST_TOKEN);
  console.log("BetNFT:", BET_NFT);

  // Import contract ABI and bytecode manually
  const fs = await import("fs");
  const path = await import("path");

  const artifactPath = path.join(process.cwd(), "artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Deploy the contract
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  console.log("🏭 Deploying PredictionMarketFactory...");
  console.log("⚙️  Constructor parameters:");
  console.log("   - AdminManager:", ADMIN_MANAGER);
  console.log("   - Treasury:", TREASURY);
  console.log("   - Collateral (CastToken):", CAST_TOKEN);
  console.log("   - CastToken:", CAST_TOKEN);
  console.log("   - BetNFT:", BET_NFT);

  const contract = await factory.deploy(
    ADMIN_MANAGER,      // adminManager
    TREASURY,           // treasury
    CAST_TOKEN,         // collateral (using CAST token)
    CAST_TOKEN,         // castToken (same as collateral)
    BET_NFT,            // betNFT
    { gasLimit: 15000000 }
  );

  console.log("⏳ Waiting for deployment...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ PredictionMarketFactory deployed at:", address);

  // Verify the configuration
  console.log("\n🔍 Verifying deployed contract configuration...");

  try {
    const deployedAdminManager = await contract.adminManager();
    const deployedTreasury = await contract.treasury();
    const deployedCastToken = await contract.castToken();
    const deployedCollateral = await contract.collateral();
    const deployedBetNFT = await contract.betNFT();

    console.log("✅ Deployed contract configuration:");
    console.log("   AdminManager:", deployedAdminManager);
    console.log("   Treasury:", deployedTreasury);
    console.log("   CastToken:", deployedCastToken);
    console.log("   Collateral:", deployedCollateral);
    console.log("   BetNFT:", deployedBetNFT);

    // Check if all addresses match
    const configValid =
      deployedAdminManager.toLowerCase() === ADMIN_MANAGER.toLowerCase() &&
      deployedTreasury.toLowerCase() === TREASURY.toLowerCase() &&
      deployedCastToken.toLowerCase() === CAST_TOKEN.toLowerCase() &&
      deployedCollateral.toLowerCase() === CAST_TOKEN.toLowerCase() &&
      deployedBetNFT.toLowerCase() === BET_NFT.toLowerCase();

    console.log("🎯 Configuration valid:", configValid ? "✅ YES" : "❌ NO");

    if (configValid) {
      console.log("🎉 SUCCESS! Factory deployed with correct configuration!");
      console.log("\n📋 Update your constants.ts with this address:");
      console.log(`FACTORY_CONTRACT: '${address}',`);

      // Test creating a market
      console.log("\n🧪 Testing market creation...");

      const question = `Test market ${Date.now()}`;
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      console.log("Creating test market:", question);
      const testTx = await contract.createMarket(question, endTime, {
        gasLimit: 15000000
      });

      console.log("⏳ Waiting for test market creation...");
      const testReceipt = await testTx.wait();

      if (testReceipt.status === 1) {
        console.log("✅ TEST MARKET CREATION SUCCESSFUL!");
        console.log("🎉 Your factory is working correctly!");

        // Find the MarketCreated event
        const event = testReceipt.logs.find(log => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed.name === 'MarketCreated';
          } catch {
            return false;
          }
        });

        if (event) {
          const parsed = contract.interface.parseLog(event);
          console.log("📍 Test market address:", parsed.args.market);
          console.log("🆔 Market ID:", parsed.args.id);
        }
      } else {
        console.log("❌ Test market creation failed");
      }
    }

  } catch (verifyError) {
    console.error("❌ Failed to verify configuration:", verifyError);
  }

  // Update deployments-testnet.json
  try {
    const deploymentsPath = path.join(process.cwd(), "deployments-testnet.json");
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

    deployments.contracts.PredictionMarketFactory = address;
    deployments.timestamp = new Date().toISOString();

    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log("✅ Updated deployments-testnet.json");
  } catch (updateError) {
    console.warn("⚠️ Failed to update deployments-testnet.json:", updateError.message);
  }
}

main()
  .then(() => {
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("Next steps:");
    console.log("1. Update src/config/constants.ts with the new FACTORY_CONTRACT address");
    console.log("2. Test market creation from your frontend");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });