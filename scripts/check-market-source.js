async function main() {
    console.log("🔍 Checking Market Contract Source");
    console.log("=".repeat(40));

    const { ethers } = await import("ethers");

    // Market from your logs
    const PROBLEM_MARKET = "0x39d64Ae0765Be566D3640024b2e0e835C033d478";

    // Our working factory
    const WORKING_FACTORY = "0x6A108622e5B0F2Db7f6118E71259F34937225809";

    const rpcUrl = 'https://testnet.hashio.io/api';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Factory ABI
    const factoryABI = [
        "function getAllMarkets() external view returns (address[] memory)",
        "function markets(bytes32) external view returns (address)"
    ];

    try {
        const workingFactory = new ethers.Contract(WORKING_FACTORY, factoryABI, provider);

        console.log("📦 Checking markets from WORKING factory:", WORKING_FACTORY);

        const workingMarkets = await workingFactory.getAllMarkets();
        console.log("✅ Markets from working factory:");
        workingMarkets.forEach((addr, i) => {
            const isTheProblemMarket = addr.toLowerCase() === PROBLEM_MARKET.toLowerCase();
            console.log(`  ${i + 1}. ${addr} ${isTheProblemMarket ? '← ⚠️  PROBLEM MARKET' : ''}`);
        });

        if (workingMarkets.find(m => m.toLowerCase() === PROBLEM_MARKET.toLowerCase())) {
            console.log("\n❌ PROBLEM: This market WAS created by the working factory!");
            console.log("   The issue might be in the contract logic or dependencies.");
        } else {
            console.log("\n✅ SOLUTION FOUND: This market was NOT created by the working factory!");
            console.log("   This market is probably from an old, broken factory deployment.");
            console.log("   Your users need to create NEW markets using the working factory.");
        }

        console.log("\n🎯 RECOMMENDATION:");
        console.log("1. Create a NEW market using your current UI");
        console.log("2. Test betting on the NEW market");
        console.log("3. The NEW market should work correctly");

        console.log("\n🔧 Quick test - let's create a market with the working factory:");

        const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";
        const wallet = new ethers.Wallet(privateKey, provider);

        const workingFactoryWithSigner = new ethers.Contract(WORKING_FACTORY, factoryABI, wallet);

        const testQuestion = `Quick test market ${Date.now()}`;
        const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

        console.log("Creating test market:", testQuestion);

        const createTx = await workingFactoryWithSigner.createMarket(testQuestion, endTime, {
            gasLimit: 15000000
        });

        const receipt = await createTx.wait();

        if (receipt.status === 1) {
            console.log("✅ NEW market created successfully!");

            // Get the new market list
            const newMarkets = await workingFactory.getAllMarkets();
            const latestMarket = newMarkets[newMarkets.length - 1];

            console.log("🆕 LATEST working market address:", latestMarket);
            console.log("\n💡 SOLUTION: Use THIS market address for testing bets!");
            console.log("   Your UI should automatically use new markets from the working factory.");

        } else {
            console.log("❌ Test market creation failed");
        }

    } catch (error) {
        console.error("❌ Check failed:", error.message);
    }
}

main().catch(console.error);