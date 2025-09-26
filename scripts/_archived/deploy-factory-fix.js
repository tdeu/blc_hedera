import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying new PredictionMarketFactory with existing contracts...");

  // Your existing deployed contract addresses
  const ADMIN_MANAGER = "0x82B5FdaA1Fb566D1215277d40a04E369052c03E0";
  const TREASURY = "0xabbc9868cbfab2Db4336D0e192DF24754A8C8Da8";
  const CAST_TOKEN = "0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d";
  const BET_NFT = "0x3b1E8b887162e7a58b992ad0A9b2c760D57f68C1";

  console.log("📋 Using existing contracts:");
  console.log("AdminManager:", ADMIN_MANAGER);
  console.log("Treasury:", TREASURY);
  console.log("CastToken:", CAST_TOKEN);
  console.log("BetNFT:", BET_NFT);

  // Deploy new factory
  const PredictionMarketFactory = await hre.ethers.getContractFactory("PredictionMarketFactory");
  
  console.log("🏭 Deploying PredictionMarketFactory...");
  const factory = await PredictionMarketFactory.deploy(
    ADMIN_MANAGER,  // _adminManager
    TREASURY,       // _treasury  
    CAST_TOKEN,     // _collateral
    CAST_TOKEN,     // _castToken
    BET_NFT         // _betNFT
  );

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("✅ PredictionMarketFactory deployed to:", factoryAddress);

  // Authorize the new factory with BetNFT
  console.log("🔗 Authorizing factory with BetNFT...");
  try {
    // Connect to existing BetNFT contract
    const BetNFTContract = await hre.ethers.getContractFactory("BetNFT");
    const betNFT = BetNFTContract.attach(BET_NFT);
    
    // Authorize the new factory
    const authTx = await betNFT.authorizeMarket(factoryAddress);
    await authTx.wait();
    console.log("✅ Factory authorized with BetNFT");
  } catch (error) {
    console.warn("⚠️ Could not authorize factory (you may need to do this manually):", error.message);
  }

  // Authorize factory with CastToken if needed
  console.log("🪙 Authorizing factory with CastToken...");
  try {
    const CastTokenContract = await hre.ethers.getContractFactory("CastToken");
    const castToken = CastTokenContract.attach(CAST_TOKEN);
    
    const authTx = await castToken.authorizeMinter(factoryAddress);
    await authTx.wait();
    console.log("✅ Factory authorized as CastToken minter");
  } catch (error) {
    console.warn("⚠️ Could not authorize factory as minter (you may need to do this manually):", error.message);
  }

  // Test the factory
  console.log("🧪 Testing factory configuration...");
  try {
    const isPaused = await factory.isFactoryPaused();
    const adminManager = await factory.adminManager();
    const treasury = await factory.treasury();
    const castToken = await factory.castToken();
    const betNFT = await factory.betNFT();

    console.log("📊 Factory configuration:");
    console.log("  - Paused:", isPaused);
    console.log("  - AdminManager:", adminManager);
    console.log("  - Treasury:", treasury);
    console.log("  - CastToken:", castToken);
    console.log("  - BetNFT:", betNFT);

    if (adminManager === ADMIN_MANAGER && treasury === TREASURY) {
      console.log("✅ Factory configuration looks correct!");
    } else {
      console.error("❌ Factory configuration mismatch!");
    }
  } catch (error) {
    console.error("❌ Factory test failed:", error.message);
  }

  console.log("\n🎉 Deployment complete!");
  console.log("📝 Update your constants.ts with this new factory address:");
  console.log(`FACTORY_CONTRACT: '${factoryAddress}',`);
  
  return {
    factory: factoryAddress,
    adminManager: ADMIN_MANAGER,
    treasury: TREASURY,
    castToken: CAST_TOKEN,
    betNFT: BET_NFT
  };
}

// Handle errors and run deployment
main()
  .then((addresses) => {
    console.log("\n✅ All contracts ready:");
    Object.entries(addresses).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });