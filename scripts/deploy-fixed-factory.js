async function main() {
    const { ethers } = await import("ethers");
    const fs = await import("fs/promises");

    console.log("🚀 Deploying FIXED PredictionMarketFactory (without betNFT authorization)...");

    // Use the LATEST addresses from deployments-testnet.json
    const ADMIN_MANAGER = "0x94FAF61DE192D1A441215bF3f7C318c236974959";
    const TREASURY = "0x69649cc208138B3A2c529cB301D7Bb591C53a2e2";
    const CAST_TOKEN = "0xC78Ac73844077917E20530E36ac935c4B56236c2";  // Use as both token AND collateral
    const BET_NFT = "0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca";

    const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";
    const rpcUrl = 'https://testnet.hashio.io/api';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("📋 Deployer address:", wallet.address);
    console.log("💰 Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "HBAR");

    // Read the contract artifacts
    const factoryArtifact = await fs.readFile('artifacts/contracts/PredictionMarketFactoryFixed.sol/PredictionMarketFactoryFixed.json', 'utf8');
    const factoryContract = JSON.parse(factoryArtifact);

    console.log("🏗️  Deploying with parameters:");
    console.log("  AdminManager:", ADMIN_MANAGER);
    console.log("  Treasury:", TREASURY);
    console.log("  Collateral (CastToken):", CAST_TOKEN);
    console.log("  CastToken:", CAST_TOKEN);
    console.log("  BetNFT:", BET_NFT);

    const factory = new ethers.ContractFactory(
        factoryContract.abi,
        factoryContract.bytecode,
        wallet
    );

    try {
        const deployedFactory = await factory.deploy(
            ADMIN_MANAGER,
            TREASURY,
            CAST_TOKEN,  // collateral
            CAST_TOKEN,  // castToken (same as collateral for simplicity)
            BET_NFT,
            {
                gasLimit: 10000000 // 10M gas
            }
        );

        console.log("⏳ Deployment transaction sent:", deployedFactory.deploymentTransaction()?.hash);
        console.log("⏳ Waiting for confirmation...");

        await deployedFactory.waitForDeployment();
        const factoryAddress = await deployedFactory.getAddress();

        console.log("✅ FIXED Factory deployed successfully!");
        console.log("🏭 Factory address:", factoryAddress);

        // Update deployments file
        const deploymentsPath = 'deployments-testnet.json';
        let deployments = {};

        try {
            const existing = await fs.readFile(deploymentsPath, 'utf8');
            deployments = JSON.parse(existing);
        } catch (e) {
            console.log("Creating new deployments file");
        }

        deployments.PredictionMarketFactoryFixed = factoryAddress;
        deployments.lastUpdated = new Date().toISOString();

        await fs.writeFile(deploymentsPath, JSON.stringify(deployments, null, 2), 'utf8');
        console.log("📝 Updated deployments-testnet.json");

        // Test creating a market immediately
        console.log("\n🧪 Testing market creation...");

        const testQuestion = `Test market ${Date.now()}`;
        const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

        console.log("Creating market:", testQuestion);
        console.log("End time:", new Date(endTime * 1000));

        const createTx = await deployedFactory.createMarket(testQuestion, endTime, {
            gasLimit: 15000000 // 15M gas
        });

        console.log("📝 Create market transaction:", createTx.hash);
        const createReceipt = await createTx.wait();

        if (createReceipt.status === 1) {
            console.log("✅ Market created successfully!");
            console.log("🔥 Gas used:", createReceipt.gasUsed.toString());

            // Find the MarketCreated event
            const event = createReceipt.logs?.find(log => log.topics[0] === ethers.id("MarketCreated(bytes32,address,string)"));
            if (event) {
                // Decode the event
                const decoded = deployedFactory.interface.parseLog(event);
                console.log("📊 Market ID:", decoded?.args?.id);
                console.log("📍 Market address:", decoded?.args?.market);
                console.log("❓ Market question:", decoded?.args?.question);
            }
        } else {
            console.log("❌ Market creation failed");
        }

    } catch (error) {
        console.log("❌ Deployment failed:", error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
    }
}

main().catch(console.error);