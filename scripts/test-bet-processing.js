async function main() {
    console.log("🎲 Testing Bet Processing on Smart Contract");
    console.log("=".repeat(50));

    const { ethers } = await import("ethers");

    // Test market - use the one from your logs
    const MARKET_ADDRESS = "0x39d64Ae0765Be566D3640024b2e0e835C033d478";
    const CAST_TOKEN_ADDRESS = "0xC78Ac73844077917E20530E36ac935c4B56236c2";

    const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";
    const rpcUrl = 'https://testnet.hashio.io/api';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("📋 Test account:", wallet.address);

    // Market ABI
    const marketABI = [
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
        "function yesShares() external view returns (uint256)",
        "function noShares() external view returns (uint256)",
        "function reserve() external view returns (uint256)",
        "function yesBalance(address) external view returns (uint256)",
        "function noBalance(address) external view returns (uint256)",
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
        const market = new ethers.Contract(MARKET_ADDRESS, marketABI, wallet);
        const castToken = new ethers.Contract(CAST_TOKEN_ADDRESS, erc20ABI, wallet);

        console.log("\n📊 Step 1: Current Market State");
        console.log("-".repeat(30));

        // Get current state
        const [priceYes, priceNo] = await market.getCurrentPrice();
        const yesShares = await market.yesShares();
        const noShares = await market.noShares();
        const reserve = await market.reserve();

        console.log("Current prices:", {
            yesPrice: ethers.formatEther(priceYes),
            noPrice: ethers.formatEther(priceNo)
        });

        console.log("Current shares:", {
            yesShares: ethers.formatEther(yesShares),
            noShares: ethers.formatEther(noShares),
            totalShares: ethers.formatEther(yesShares + noShares)
        });

        console.log("Reserve:", ethers.formatEther(reserve), "CAST");

        // Check user's current position
        const userYesBalance = await market.yesBalance(wallet.address);
        const userNoBalance = await market.noBalance(wallet.address);

        console.log("User's current position:", {
            yesShares: ethers.formatEther(userYesBalance),
            noShares: ethers.formatEther(userNoBalance)
        });

        console.log("\n💰 Step 2: User's CAST Token Balance");
        console.log("-".repeat(30));

        const userBalance = await castToken.balanceOf(wallet.address);
        console.log("CAST balance:", ethers.formatEther(userBalance));

        if (userBalance === 0n) {
            console.log("❌ User has no CAST tokens! Cannot place bets.");
            console.log("💡 You need CAST tokens to bet. Try minting some from the CastToken contract first.");
            return;
        }

        console.log("\n🎯 Step 3: Simulate Small Bet");
        console.log("-".repeat(30));

        // Test with a meaningful bet size
        const testShares = ethers.parseEther("10"); // 10 shares
        const cost = await market.getPriceYes(testShares);

        console.log("Test bet:", {
            shares: "10",
            estimatedCost: ethers.formatEther(cost) + " CAST"
        });

        if (cost > userBalance) {
            console.log("❌ Not enough CAST tokens for test bet");
            console.log("Need:", ethers.formatEther(cost), "CAST");
            console.log("Have:", ethers.formatEther(userBalance), "CAST");
            return;
        }

        // Check allowance
        const allowance = await castToken.allowance(wallet.address, MARKET_ADDRESS);
        console.log("Current allowance:", ethers.formatEther(allowance));

        if (allowance < cost) {
            console.log("📝 Approving CAST tokens...");
            const approveTx = await castToken.approve(MARKET_ADDRESS, cost);
            await approveTx.wait();
            console.log("✅ Approval confirmed");
        }

        console.log("🎲 Placing YES bet...");
        const betTx = await market.buyYes(testShares, { gasLimit: 1000000 });
        console.log("📤 Transaction sent:", betTx.hash);

        const receipt = await betTx.wait();
        console.log("✅ Bet confirmed! Status:", receipt.status);

        console.log("\n📈 Step 4: Check New State");
        console.log("-".repeat(30));

        // Get new state
        const [newPriceYes, newPriceNo] = await market.getCurrentPrice();
        const newYesShares = await market.yesShares();
        const newNoShares = await market.noShares();
        const newReserve = await market.reserve();

        console.log("NEW prices:", {
            yesPrice: ethers.formatEther(newPriceYes),
            noPrice: ethers.formatEther(newPriceNo),
            priceChanged: priceYes !== newPriceYes
        });

        console.log("NEW shares:", {
            yesShares: ethers.formatEther(newYesShares),
            noShares: ethers.formatEther(newNoShares),
            totalShares: ethers.formatEther(newYesShares + newNoShares)
        });

        console.log("NEW reserve:", ethers.formatEther(newReserve), "CAST");

        // Calculate change
        const yesSharesDelta = newYesShares - yesShares;
        const reserveDelta = newReserve - reserve;

        console.log("\n📊 Summary of Changes:");
        console.log("YES shares increased by:", ethers.formatEther(yesSharesDelta));
        console.log("Reserve increased by:", ethers.formatEther(reserveDelta), "CAST");
        console.log("Price change:", {
            yesFrom: ethers.formatEther(priceYes),
            yesTo: ethers.formatEther(newPriceYes),
            noFrom: ethers.formatEther(priceNo),
            noTo: ethers.formatEther(newPriceNo)
        });

        if (priceYes === newPriceYes) {
            console.log("⚠️  PRICES DIDN'T CHANGE - This might explain your UI issue!");
            console.log("💡 Try betting a larger amount to see price movement");
        } else {
            console.log("✅ Prices changed successfully - your UI should update!");
        }

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
        if (error.data) {
            console.error("Data:", error.data);
        }
    }
}

main().catch(console.error);