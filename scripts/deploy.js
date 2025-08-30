import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("Starting BlockCast deployment to Hedera...");
  
  // Connect to Hedera Testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);
  
  console.log("Deploying contracts with account:", signer.address);
  
  const balance = await provider.getBalance(signer.address);
  console.log("Account balance:", ethers.formatEther(balance), "HBAR");

  // Load contract artifacts
  const AdminManagerArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/AdminManager.sol/AdminManager.json', 'utf8'));
  const CastTokenArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/CastToken.sol/CastToken.json', 'utf8'));
  const TreasuryArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/Treasury.sol/Treasury.json', 'utf8'));
  const BetNFTArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/BetNFT.sol/BetNFT.json', 'utf8'));
  const PredictionMarketFactoryArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json', 'utf8'));

  // 1. Deploy AdminManager
  console.log("\n1. Deploying AdminManager...");
  const AdminManagerFactory = new ethers.ContractFactory(AdminManagerArtifact.abi, AdminManagerArtifact.bytecode, signer);
  const adminManager = await AdminManagerFactory.deploy(); // No parameters needed
  await adminManager.waitForDeployment();
  const adminManagerAddress = await adminManager.getAddress();
  console.log("AdminManager deployed to:", adminManagerAddress);

  // 2. Deploy CastToken
  console.log("\n2. Deploying CastToken...");
  const CastTokenFactory = new ethers.ContractFactory(CastTokenArtifact.abi, CastTokenArtifact.bytecode, signer);
  const castToken = await CastTokenFactory.deploy(); // No parameters needed
  await castToken.waitForDeployment();
  const castTokenAddress = await castToken.getAddress();
  console.log("CastToken deployed to:", castTokenAddress);

  // 3. Deploy Treasury
  console.log("\n3. Deploying Treasury...");
  const TreasuryFactory = new ethers.ContractFactory(TreasuryArtifact.abi, TreasuryArtifact.bytecode, signer);
  const treasury = await TreasuryFactory.deploy(adminManagerAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  // 4. Deploy BetNFT
  console.log("\n4. Deploying BetNFT...");
  const BetNFTFactory = new ethers.ContractFactory(BetNFTArtifact.abi, BetNFTArtifact.bytecode, signer);
  const betNFT = await BetNFTFactory.deploy(); // No parameters needed
  await betNFT.waitForDeployment();
  const betNFTAddress = await betNFT.getAddress();
  console.log("BetNFT deployed to:", betNFTAddress);

  // 5. Deploy PredictionMarketFactory
  console.log("\n5. Deploying PredictionMarketFactory...");
  const PredictionMarketFactoryFactory = new ethers.ContractFactory(PredictionMarketFactoryArtifact.abi, PredictionMarketFactoryArtifact.bytecode, signer);
  
  // Use CastToken as collateral since it's part of our ecosystem
  const collateralAddress = castTokenAddress; // Use the deployed CastToken address
  
  const factory = await PredictionMarketFactoryFactory.deploy(
    adminManagerAddress,
    treasuryAddress,
    collateralAddress,
    castTokenAddress,
    betNFTAddress
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("PredictionMarketFactory deployed to:", factoryAddress);

  // 6. Set up permissions
  console.log("\n6. Setting up permissions...");
  
  // Authorize factory to mint CAST tokens
  await castToken.authorizeMinter(factoryAddress);
  console.log("✓ Factory authorized to mint CAST tokens");

  // Set factory in BetNFT (if needed)
  // await betNFT.setFactory(factoryAddress);

  // 7. Save deployment info
  const deploymentInfo = {
    network: process.env.HEDERA_NETWORK || 'testnet',
    deployer: signer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AdminManager: adminManagerAddress,
      CastToken: castTokenAddress,
      Treasury: treasuryAddress,
      BetNFT: betNFTAddress,
      PredictionMarketFactory: factoryAddress
    },
    transactionHashes: {
      // Could store tx hashes here for reference
    }
  };

  // Write to file
  fs.writeFileSync(
    `deployments-${process.env.HEDERA_NETWORK || 'testnet'}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 Deployment completed!");
  console.log("📋 Contract addresses saved to:", `deployments-${process.env.HEDERA_NETWORK || 'testnet'}.json`);
  
  console.log("\n📝 Next steps:");
  console.log("1. Update .env with contract addresses");
  console.log("2. Set up collateral token (WHBAR or other)");
  console.log("3. Fund accounts for testing");
  console.log("4. Configure HCS topic IDs");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });