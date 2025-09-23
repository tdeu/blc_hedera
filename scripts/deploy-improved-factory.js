import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function deployImprovedFactory() {
  console.log("🚀 Deploying IMPROVED PredictionMarketFactory...");

  // Connect to Hedera Testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("Deploying with account:", signer.address);

  const balance = await provider.getBalance(signer.address);
  console.log("Account balance:", ethers.formatEther(balance), "HBAR");

  // Contract addresses from your constructor parameters
  const adminManagerAddress = "0x82B5FdaA1Fb566D1215277d40a04E369052c03E0";
  const treasuryAddress = "0xabbc9868cbfab2Db4336D0e192DF24754A8C8Da8";
  const castTokenAddress = "0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d";
  const betNFTAddress = "0x3b1E8b887162e7a58b992ad0A9b2c760D57f68C1";
  
  // Using CastToken as collateral (same as your current setup)
  const collateralAddress = castTokenAddress;

  console.log("Using contract addresses:");
  console.log("  AdminManager:", adminManagerAddress);
  console.log("  Treasury:", treasuryAddress);
  console.log("  Collateral:", collateralAddress);
  console.log("  CastToken:", castTokenAddress);
  console.log("  BetNFT:", betNFTAddress);

  // Validate addresses
  if (!collateralAddress || collateralAddress === "YOUR_COLLATERAL_TOKEN_ADDRESS") {
    console.error("❌ ERROR: Invalid collateral token address!");
    process.exit(1);
  }

  // Load contract artifact for the improved factory
  const PredictionMarketFactoryArtifact = JSON.parse(
    fs.readFileSync('./artifacts/contracts/PredictionMarketFactoryImproved.sol/PredictionMarketFactoryImproved.json', 'utf8')
  );

  // Deploy improved factory
  console.log("\n📦 Deploying PredictionMarketFactoryImproved...");
  const PredictionMarketFactoryFactory = new ethers.ContractFactory(
    PredictionMarketFactoryArtifact.abi, 
    PredictionMarketFactoryArtifact.bytecode, 
    signer
  );

  const factory = await PredictionMarketFactoryFactory.deploy(
    adminManagerAddress,    // _adminManager
    treasuryAddress,       // _treasury
    collateralAddress,     // _collateral
    castTokenAddress,      // _castToken
    betNFTAddress         // _betNFT
  );
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ IMPROVED PredictionMarketFactory deployed to:", factoryAddress);

  // Transfer BetNFT ownership to new factory
  console.log("\n🔄 Transferring BetNFT ownership to new factory...");
  const betNFTABI = ["function transferOwnership(address newOwner) external"];
  const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, signer);

  try {
    const transferTx = await betNFT.transferOwnership(factoryAddress);
    await transferTx.wait();
    console.log("✅ BetNFT ownership transferred to new factory");
  } catch (error) {
    console.log("⚠️  Warning: Could not transfer BetNFT ownership:", error.message);
    console.log("   You may need to do this manually or the factory may not be the owner");
  }

  // Authorize factory to mint CAST tokens
  console.log("\n🔐 Authorizing factory to mint CAST tokens...");
  const castTokenABI = ["function authorizeMinter(address minter) external"];
  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  try {
    const authTx = await castToken.authorizeMinter(factoryAddress);
    await authTx.wait();
    console.log("✅ Factory authorized to mint CAST tokens");
  } catch (error) {
    console.log("⚠️  Warning: Could not authorize factory to mint:", error.message);
    console.log("   You may need to do this manually");
  }

  // Test the new factory functions
  console.log("\n🧪 Testing new factory functions...");
  try {
    const marketCount = await factory.getMarketCount();
    console.log("✅ Market count:", marketCount.toString());
    
    const defaultFeeRate = await factory.getDefaultProtocolFeeRate();
    console.log("✅ Default fee rate:", defaultFeeRate.toString(), "basis points");
    
    const limits = await factory.getMarketCreationLimits();
    console.log("✅ Market creation limits:");
    console.log("   Min duration:", limits[0].toString(), "seconds");
    console.log("   Max duration:", limits[1].toString(), "seconds");
    console.log("   Max question length:", limits[2].toString(), "characters");
    console.log("   Max fee rate:", limits[3].toString(), "basis points");
  } catch (error) {
    console.log("⚠️  Warning: Could not test factory functions:", error.message);
  }

  // Update deployment info
  const deploymentInfo = {
    network: "testnet",
    deployer: signer.address,
    timestamp: new Date().toISOString(),
    note: 'IMPROVED FACTORY with enhanced features',
    contracts: {
      AdminManager: adminManagerAddress,
      Treasury: treasuryAddress,
      Collateral: collateralAddress,
      CastToken: castTokenAddress,
      BetNFT: betNFTAddress,
      PredictionMarketFactoryImproved: factoryAddress
    },
    improvements: [
      "Enhanced input validation",
      "Gas-optimized market lookup",
      "Pagination support",
      "Emergency market removal",
      "Better error handling",
      "Market creation limits"
    ]
  };

  // Write to file
  const filename = `deployments-IMPROVED-factory-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 IMPROVED factory deployment completed!");
  console.log("📋 New Factory address:", factoryAddress);
  console.log("📝 Update your .env file:");
  console.log(`CONTRACT_PREDICTION_MARKET_FACTORY=${factoryAddress}`);
  console.log(`CONTRACT_COLLATERAL_TOKEN=${collateralAddress}`);

  console.log("\n🔄 Next steps:");
  console.log("1. Update CONTRACT_PREDICTION_MARKET_FACTORY in .env");
  console.log("2. Update CONTRACT_COLLATERAL_TOKEN in .env");
  console.log("3. Test creating a market with the new validation");
  console.log("4. Test pagination functions");

  console.log("\n📊 Deployment file saved:", filename);
}

deployImprovedFactory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Factory deployment failed:", error);
    process.exit(1);
  });
