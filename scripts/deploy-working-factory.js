async function main() {
  const { ethers } = await import("ethers");
  const fs = await import("fs");

  console.log("🚀 Deploying WORKING PredictionMarketFactoryFixed...");

  // Use the LATEST addresses from deployments-testnet.json
  const ADMIN_MANAGER = "0x94FAF61DE192D1A441215bF3f7C318c236974959";
  const TREASURY = "0x69649cc208138B3A2c529cB301D7Bb591C53a2e2";
  const CAST_TOKEN = "0xC78Ac73844077917E20530E36ac935c4B56236c2";
  const BET_NFT = "0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca";

  const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(privateKey, provider);

  console.log("📋 Deployer address:", signer.address);
  console.log("📋 Balance:", ethers.formatEther(await provider.getBalance(signer.address)), "HBAR");

  console.log("\n🔍 Constructor parameters:");
  console.log("AdminManager:", ADMIN_MANAGER);
  console.log("Treasury:", TREASURY);
  console.log("CastToken:", CAST_TOKEN);
  console.log("BetNFT:", BET_NFT);

  try {
    // Compile the new contract first
    console.log("🔨 Compiling contracts...");
    const { execSync } = await import("child_process");
    execSync("npx hardhat compile", { stdio: 'inherit' });

    // Load the new contract artifact
    const artifactPath = "./artifacts/contracts/PredictionMarketFactoryFixed.sol/PredictionMarketFactoryFixed.json";
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

    console.log("🏭 Deploying PredictionMarketFactoryFixed...");
    const contract = await factory.deploy(
      ADMIN_MANAGER,
      TREASURY,
      CAST_TOKEN,
      CAST_TOKEN,
      BET_NFT,
      { gasLimit: 15000000 }
    );

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("✅ PredictionMarketFactoryFixed deployed at:", address);

    // Verify the configuration
    console.log("\n🔍 Verifying deployed contract configuration...");
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

    // Test creating a market immediately
    console.log("\n🧪 Testing market creation...");
    const question = `Working test market ${Date.now()}`;
    const endTime = Math.floor(Date.now() / 1000) + 86400;

    console.log("📝 Creating market:", question);
    const testTx = await contract.createMarket(question, endTime, {
      gasLimit: 15000000
    });

    console.log("⏳ Waiting for market creation...");
    const testReceipt = await testTx.wait();

    if (testReceipt.status === 1) {
      console.log("🎉 SUCCESS! Market creation works!");
      console.log("📊 Gas used:", testReceipt.gasUsed.toString());

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
        console.log("📍 New market address:", parsed.args.market);
        console.log("🆔 Market ID:", parsed.args.id);
        console.log("📝 Question:", parsed.args.question);
      }

      console.log("\n✅ YOUR BLOCKCAST SMART CONTRACT SYSTEM IS NOW WORKING!");
      console.log("📋 Update your constants.ts with this address:");
      console.log(`FACTORY_CONTRACT: '${address}',`);

    } else {
      console.log("❌ Market creation failed");
    }

    // Update deployments-testnet.json
    const deploymentsPath = "./deployments-testnet.json";
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    deployments.contracts.PredictionMarketFactoryFixed = address;
    deployments.timestamp = new Date().toISOString();
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log("✅ Updated deployments-testnet.json");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main()
  .then(() => {
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("Next step: Update src/config/constants.ts with the new FACTORY_CONTRACT address");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });