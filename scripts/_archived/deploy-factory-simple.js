async function main() {
  // Use dynamic import for ethers
  const { ethers } = await import("ethers");
  
  console.log("🚀 Deploying new PredictionMarketFactory...");

  // Your existing contract addresses  
  const ADMIN_MANAGER = "0x82B5FdaA1Fb566D1215277d40a04E369052c03E0";
  const TREASURY = "0xabbc9868cbfab2Db4336D0e192DF24754A8C8Da8";
  const CAST_TOKEN = "0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d";
  const BET_NFT = "0x3b1E8b887162e7a58b992ad0A9b2c760D57f68C1";

  // Create provider and signer
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("📋 Deployer address:", signer.address);
  console.log("📋 Balance:", ethers.formatEther(await provider.getBalance(signer.address)), "HBAR");

  // Import contract ABI and bytecode manually
  const fs = await import("fs");
  const path = await import("path");
  
  const artifactPath = path.join(process.cwd(), "artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Deploy the contract
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  
  console.log("🏭 Deploying PredictionMarketFactory...");
  const contract = await factory.deploy(
    ADMIN_MANAGER,
    TREASURY,
    CAST_TOKEN,
    CAST_TOKEN,
    BET_NFT,
    { gasLimit: 10000000 }
  );

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("✅ PredictionMarketFactory deployed to:", address);
  console.log("📝 Update your constants.ts with:");
  console.log(`FACTORY_CONTRACT: '${address}',`);

  return address;
}

main()
  .then((address) => {
    console.log("✅ Success! New factory address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });