import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("🏭 Starting BuyCAST contract deployment to Hedera...");

  // Connect to Hedera Testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("Deploying with account:", signer.address);

  const balance = await provider.getBalance(signer.address);
  console.log("Account balance:", ethers.formatEther(balance), "HBAR");

  // Load deployment information to get CastToken address
  let deployments = {};
  try {
    const deploymentsData = fs.readFileSync('./deployments-testnet.json', 'utf8');
    deployments = JSON.parse(deploymentsData);
    console.log("Loaded existing deployments");
  } catch (error) {
    console.log("⚠️ No deployments file found - you may need to deploy CastToken first");
    console.log("Expected to find ./deployments-testnet.json with CAST_TOKEN address");
    process.exit(1);
  }

  const castTokenAddress = deployments.contracts?.CastToken || deployments.CAST_TOKEN;
  if (!castTokenAddress) {
    console.log("❌ CastToken address not found in deployments file");
    console.log("Available contracts:", Object.keys(deployments.contracts || {}));
    console.log("Please deploy CastToken first or update deployments-testnet.json");
    process.exit(1);
  }

  console.log("📄 Using CastToken at:", castTokenAddress);

  // Load BuyCAST contract artifact
  const BuyCastArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/BuyCAST.sol/BuyCAST.json', 'utf8'));

  // Deploy BuyCAST contract
  console.log("\n🚀 Deploying BuyCAST contract...");
  const BuyCastFactory = new ethers.ContractFactory(BuyCastArtifact.abi, BuyCastArtifact.bytecode, signer);

  // Deploy with CastToken address as constructor parameter
  const buyCast = await BuyCastFactory.deploy(castTokenAddress);
  await buyCast.waitForDeployment();
  const buyCastAddress = await buyCast.getAddress();

  console.log("✅ BuyCAST deployed to:", buyCastAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  try {
    const info = await buyCast.getInfo();
    console.log("Contract info:", {
      castTokenAddress: info[0],
      exchangeRate: ethers.formatEther(info[1]),
      minPurchase: ethers.formatEther(info[2]),
      maxPurchase: ethers.formatEther(info[3]),
      contractBalance: ethers.formatEther(info[4])
    });
    console.log("✅ Contract verification successful!");
  } catch (error) {
    console.log("❌ Contract verification failed:", error.message);
  }

  // Now we need to authorize BuyCAST contract to mint CAST tokens
  console.log("\n🔐 Authorizing BuyCAST contract to mint CAST tokens...");
  try {
    // Load CastToken contract
    const CastTokenArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/CastToken.sol/CastToken.json', 'utf8'));
    const castToken = new ethers.Contract(castTokenAddress, CastTokenArtifact.abi, signer);

    // Authorize BuyCAST as minter
    const authTx = await castToken.authorizeMinter(buyCastAddress);
    await authTx.wait();

    console.log("✅ BuyCAST contract authorized as CAST minter!");

    // Verify authorization
    const isAuthorized = await castToken.authorizedMinters(buyCastAddress);
    console.log("🔍 Authorization verification:", isAuthorized ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED");

  } catch (error) {
    console.log("❌ Failed to authorize BuyCAST as minter:", error.message);
    console.log("⚠️ You may need to manually authorize the BuyCAST contract");
    console.log("Run: castToken.authorizeMinter('" + buyCastAddress + "')");
  }

  // Update deployments file
  console.log("\n📝 Updating deployments file...");
  if (!deployments.contracts) {
    deployments.contracts = {};
  }
  deployments.contracts.BuyCAST = buyCastAddress;
  deployments.BUYCAST_DEPLOYED_AT = new Date().toISOString();
  deployments.lastUpdated = new Date().toISOString();

  fs.writeFileSync('./deployments-testnet.json', JSON.stringify(deployments, null, 2));
  console.log("✅ Deployments file updated with BuyCAST contract address");

  // Final summary
  console.log("\n🎉 BuyCAST Deployment Complete!");
  console.log("=====================================");
  console.log("BuyCAST Contract:", buyCastAddress);
  console.log("CastToken Address:", castTokenAddress);
  console.log("Exchange Rate: 1 HBAR = 1 CAST");
  console.log("Min Purchase: 0.1 HBAR");
  console.log("Max Purchase: 1000 HBAR");
  console.log("=====================================");

  // Instructions for frontend
  console.log("\n📋 Next Steps:");
  console.log("1. Update TOKEN_ADDRESSES.BUYCAST_CONTRACT in src/config/constants.ts");
  console.log("2. The frontend will automatically switch from mock to real BuyCAST implementation");
  console.log("3. Test by purchasing CAST tokens through the UI");

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});