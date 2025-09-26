async function main() {
    const { ethers } = await import("ethers");
    console.log("🧪 Testing Market Creation Process...");

    const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";
    const rpcUrl = 'https://testnet.hashio.io/api';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("📋 Testing account:", wallet.address);

    // Latest contract addresses
    const FACTORY_ADDRESS = "0xa349EF5fcf17dcF2b9E45aE2993e650a2933a0f1";
    const CAST_TOKEN_ADDRESS = "0xC78Ac73844077917E20530E36ac935c4B56236c2";

    // Factory ABI - just the createMarket function
    const factoryABI = [
        "function createMarket(bytes32 id, string memory question, uint256 endTime, uint256 protocolFeeRate) external returns (address)"
    ];

    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, wallet);

    try {
        console.log("🏗️  Attempting to create market...");

        // Generate unique market ID
        const marketId = ethers.id(`test-market-${Date.now()}`);
        const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

        console.log("Market ID:", marketId);
        console.log("End time:", new Date(endTime * 1000));

        // First, let's estimate gas
        try {
            const gasEstimate = await factory.createMarket.estimateGas(
                marketId,
                "Will this test market work?",
                endTime,
                200 // 2% fee
            );
            console.log("Gas estimate:", gasEstimate.toString());
        } catch (gasError) {
            console.log("❌ Gas estimation failed:", gasError.message);

            // Try to get more details about the error
            if (gasError.data) {
                console.log("Error data:", gasError.data);
            }

            return;
        }

        // If gas estimation worked, try the actual transaction
        const tx = await factory.createMarket(
            marketId,
            "Will this test market work?",
            endTime,
            200, // 2% fee
            {
                gasLimit: 15000000 // 15M gas
            }
        );

        console.log("📝 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed!");
        console.log("Receipt status:", receipt.status);
        console.log("Gas used:", receipt.gasUsed.toString());

        // Extract the market address from logs
        if (receipt.logs && receipt.logs.length > 0) {
            console.log("📄 Logs found:", receipt.logs.length);
            receipt.logs.forEach((log, i) => {
                console.log(`Log ${i}:`, log);
            });
        }

    } catch (error) {
        console.log("❌ Market creation failed:");
        console.log("Error:", error.message);

        if (error.data) {
            console.log("Error data:", error.data);
        }

        if (error.transaction) {
            console.log("Failed transaction:", error.transaction);
        }
    }
}

main().catch(console.error);