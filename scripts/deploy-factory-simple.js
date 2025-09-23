import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function deployFactorySimple() {
  console.log("Deploying new PredictionMarketFactory with improved price sensitivity...");

  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("Deploying with account:", signer.address);

  // Use the contract addresses from .env
  const adminManagerAddress = process.env.CONTRACT_ADMIN_MANAGER;
  const treasuryAddress = process.env.CONTRACT_TREASURY;
  const castTokenAddress = process.env.CONTRACT_CAST_TOKEN;
  const betNFTAddress = process.env.CONTRACT_BET_NFT;

  console.log("Using contract addresses:");
  console.log("  AdminManager:", adminManagerAddress);
  console.log("  Treasury:", treasuryAddress);
  console.log("  CastToken (collateral):", castTokenAddress);
  console.log("  BetNFT:", betNFTAddress);

  // Load contract artifact
  const PredictionMarketFactoryArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json', 'utf8'));

  // Deploy new factory
  console.log("\nDeploying PredictionMarketFactory...");
  const PredictionMarketFactoryFactory = new ethers.ContractFactory(PredictionMarketFactoryArtifact.abi, PredictionMarketFactoryArtifact.bytecode, signer);

  const factory = await PredictionMarketFactoryFactory.deploy(
    adminManagerAddress,    // _adminManager
    treasuryAddress,       // _treasury
    castTokenAddress,      // _collateral (CastToken)
    castTokenAddress,      // _castToken (CastToken)
    betNFTAddress         // _betNFT
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ NEW PredictionMarketFactory deployed to:", factoryAddress);

  console.log("\n🎯 NEW Factory with improved price sensitivity:");
  console.log("- Virtual liquidity reduced from 100 to 10 shares");
  console.log("- 3-5 HBAR bets will now create visible price movements");
  console.log("- Markets start at 10 YES / 10 NO shares instead of 100/100");

  console.log("\n📝 Update your .env file:");
  console.log(`CONTRACT_PREDICTION_MARKET_FACTORY=${factoryAddress}`);

  // Save new factory address
  const deploymentInfo = {
    network: 'testnet',
    timestamp: new Date().toISOString(),
    note: 'IMPROVED FACTORY - Reduced virtual liquidity for better price sensitivity',
    newFactoryAddress: factoryAddress,
    improvement: 'Virtual liquidity reduced from 100 to 10 shares for 3-5 HBAR bet sensitivity'
  };

  fs.writeFileSync(
    `factory-improved-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🔄 Next steps:");
  console.log("1. Update CONTRACT_PREDICTION_MARKET_FACTORY in .env");
  console.log("2. Create a new market");
  console.log("3. Place a 3-5 HBAR bet");
  console.log("4. Watch odds change from 1.00x to something meaningful!");
}

deployFactorySimple()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Factory deployment failed:", error);
    process.exit(1);
  });