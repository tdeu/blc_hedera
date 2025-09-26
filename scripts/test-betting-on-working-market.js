async function main() {
    console.log("🎲 Testing Betting on WORKING Market");
    console.log("=".repeat(45));

    const { ethers } = await import("ethers");

    // Test with WORKING market from our fixed factory
    const WORKING_MARKET = "0x9258a916333d6745D43383374B5C8d76A503a1f2"; // Latest from working factory
    const CAST_TOKEN_ADDRESS = "0xC78Ac73844077917E20530E36ac935c4B56236c2";

    const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";
    const rpcUrl = 'https://testnet.hashio.io/api';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("📋 Test account:", wallet.address);
    console.log("🎯 Testing market:", WORKING_MARKET);

    // Market ABI
    const marketABI = [
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
        "function yesShares() external view returns (uint256)",
        "function noShares() external view returns (uint256)",
        "function reserve() external view returns (uint256)",
        "function collateral() external view returns (address)",
        "function buyYes(uint256 shares) external",
        "function getPriceYes(uint256 sharesToBuy) external view returns (uint256)"
    ];

    // ERC20 ABI
    const erc20ABI = [
        "function balanceOf(address) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)"
    ];

    try {
        const market = new ethers.Contract(WORKING_MARKET, marketABI, wallet);
        const castToken = new ethers.Contract(CAST_TOKEN_ADDRESS, erc20ABI, wallet);

        console.log("\n📊 BEFORE BET - Market State:");
        console.log("-".repeat(30));

        // Get BEFORE state
        const [beforePriceYes, beforePriceNo] = await market.getCurrentPrice();
        const beforeYesShares = await market.yesShares();
        const beforeNoShares = await market.noShares();
        const beforeReserve = await market.reserve();

        console.log("BEFORE prices:", {
            yesPrice: ethers.formatEther(beforePriceYes),
            noPrice: ethers.formatEther(beforePriceNo)
        });

        console.log("BEFORE shares:", {
            yesShares: ethers.formatEther(beforeYesShares),
            noShares: ethers.formatEther(beforeNoShares)
        });

        console.log("BEFORE reserve:", ethers.formatEther(beforeReserve), "CAST");

        console.log("\n🎲 Placing Bet:");
        console.log("-".repeat(15));

        // Place a meaningful bet
        const betShares = ethers.parseEther("50"); // 50 shares
        const cost = await market.getPriceYes(betShares);

        console.log("Bet details:", {
            shares: "50",
            estimatedCost: ethers.formatEther(cost) + " CAST"
        });

        // Approve if needed
        const allowance = await castToken.allowance(wallet.address, WORKING_MARKET);
        if (allowance < cost) {
            console.log("📝 Approving CAST tokens...");
            const approveTx = await castToken.approve(WORKING_MARKET, cost);
            await approveTx.wait();
            console.log("✅ Approved");
        }

        // Place the bet
        console.log("🎲 Placing YES bet...");
        const betTx = await market.buyYes(betShares, { gasLimit: 1000000 });
        console.log("📤 Transaction sent:", betTx.hash);

        const receipt = await betTx.wait();

        if (receipt.status === 1) {
            console.log("✅ BET SUCCESS! Transaction confirmed");
            console.log("🔥 Gas used:", receipt.gasUsed.toString());
        } else {
            console.log("❌ Bet transaction failed");
            return;
        }

        console.log("\n📈 AFTER BET - Market State:");
        console.log("-".repeat(30));

        // Get AFTER state
        const [afterPriceYes, afterPriceNo] = await market.getCurrentPrice();
        const afterYesShares = await market.yesShares();
        const afterNoShares = await market.noShares();
        const afterReserve = await market.reserve();

        console.log("AFTER prices:", {
            yesPrice: ethers.formatEther(afterPriceYes),
            noPrice: ethers.formatEther(afterPriceNo)
        });

        console.log("AFTER shares:", {
            yesShares: ethers.formatEther(afterYesShares),
            noShares: ethers.formatEther(afterNoShares)
        });

        console.log("AFTER reserve:", ethers.formatEther(afterReserve), "CAST");

        console.log("\n🎯 CHANGES ANALYSIS:");
        console.log("=".repeat(30));

        const priceChanged = beforePriceYes !== afterPriceYes;
        const yesSharesIncreased = afterYesShares > beforeYesShares;
        const reserveIncreased = afterReserve > beforeReserve;

        console.log("📊 Price changes:", {
            yesFrom: ethers.formatEther(beforePriceYes),
            yesTo: ethers.formatEther(afterPriceYes),
            noFrom: ethers.formatEther(beforePriceNo),
            noTo: ethers.formatEther(afterPriceNo),
            pricesChanged: priceChanged
        });

        console.log("📈 Share changes:", {
            yesSharesDelta: ethers.formatEther(afterYesShares - beforeYesShares),
            reserveDelta: ethers.formatEther(afterReserve - beforeReserve) + " CAST",
            yesSharesIncreased,
            reserveIncreased
        });

        if (priceChanged && yesSharesIncreased && reserveIncreased) {
            console.log("\n🎉 SUCCESS! The working market behaves correctly:");
            console.log("✅ Bet went through");
            console.log("✅ Prices changed");
            console.log("✅ Shares increased");
            console.log("✅ Reserve increased");
            console.log("\n💡 SOLUTION: Your users should create NEW markets!");
            console.log("   Old markets from broken factories won't work.");
            console.log("   New markets from the fixed factory will work perfectly.");

        } else {
            console.log("❌ Something is still not working correctly");
        }

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
    }
}

main().catch(console.error);