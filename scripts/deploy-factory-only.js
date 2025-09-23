import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function deployFactoryOnly() {
  console.log("Deploying new PredictionMarketFactory with correct addresses...");

  // Connect to Hedera Testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("Deploying with account:", signer.address);

  const balance = await provider.getBalance(signer.address);
  console.log("Account balance:", ethers.formatEther(balance), "HBAR");

  // Use the NEW contract addresses from .env
  const adminManagerAddress = process.env.CONTRACT_ADMIN_MANAGER;
  const treasuryAddress = process.env.CONTRACT_TREASURY;
  const castTokenAddress = process.env.CONTRACT_CAST_TOKEN; // NEW address
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

  // Use NEW CastToken as collateral
  const collateralAddress = castTokenAddress; // This is the key fix!

  const factory = await PredictionMarketFactoryFactory.deploy(
    adminManagerAddress,    // _adminManager
    treasuryAddress,       // _treasury
    collateralAddress,     // _collateral (NEW CastToken)
    castTokenAddress,      // _castToken (NEW CastToken)
    betNFTAddress         // _betNFT
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ NEW PredictionMarketFactory deployed to:", factoryAddress);

  // Transfer BetNFT ownership to new factory
  console.log("\nTransferring BetNFT ownership to new factory...");
  const betNFTABI = ["function transferOwnership(address newOwner) external"];
  const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, signer);

  const transferTx = await betNFT.transferOwnership(factoryAddress);
  await transferTx.wait();
  console.log("✅ BetNFT ownership transferred to new factory");

  // Authorize factory to mint CAST tokens
  console.log("\nAuthorizing factory to mint CAST tokens...");
  const castTokenABI = ["function authorizeMinter(address minter) external"];
  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  const authTx = await castToken.authorizeMinter(factoryAddress);
  await authTx.wait();
  console.log("✅ Factory authorized to mint CAST tokens");

  // Update deployment info
  const deploymentInfo = {
    network: process.env.HEDERA_NETWORK || 'testnet',
    deployer: signer.address,
    timestamp: new Date().toISOString(),
    note: 'NEW FACTORY with correct CastToken address',
    contracts: {
      AdminManager: adminManagerAddress,
      CastToken: castTokenAddress,
      Treasury: treasuryAddress,
      BetNFT: betNFTAddress,
      PredictionMarketFactory: factoryAddress  // NEW factory address
    }
  };

  // Write to file
  fs.writeFileSync(
    `deployments-NEW-factory-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 New factory deployment completed!");
  console.log("📋 NEW Factory address:", factoryAddress);
  console.log("📝 Update your .env file:");
  console.log(`CONTRACT_PREDICTION_MARKET_FACTORY=${factoryAddress}`);

  console.log("\n🔄 Next steps:");
  console.log("1. Update CONTRACT_PREDICTION_MARKET_FACTORY in .env");
  console.log("2. Create a test market");
  console.log("3. The new markets will use the correct CastToken as collateral");
}

deployFactoryOnly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Factory deployment failed:", error);
    process.exit(1);
  });