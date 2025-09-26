async function main() {
  const { ethers } = await import("ethers");

  console.log("🧪 Testing UI integration with working factory...");

  // Simulate the exact same flow your UI uses
  const WORKING_FACTORY = "0x0C3053f1868DE318DDd68c142F4686f1c2305870";
  const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || "0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9";

  try {
    // Use your HederaEVMService configuration
    const config = {
      rpcUrl: 'https://testnet.hashio.io/api',
      privateKey: privateKey,
      factoryAddress: WORKING_FACTORY
    };

    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);

    console.log("📋 Configuration:");
    console.log("  Factory:", config.factoryAddress);
    console.log("  Signer:", signer.address);

    // Test the exact same market creation call your UI would make
    const factoryABI = [
      "function createMarket(string question, uint256 endTime) external returns (bytes32)",
      "event MarketCreated(bytes32 indexed id, address market, string question)"
    ];

    const factory = new ethers.Contract(config.factoryAddress, factoryABI, signer);

    // Create a market like your UI would
    const claim = "UI Integration Test Market";
    const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

    console.log("🎯 Creating market through UI flow...");
    console.log("  Claim:", claim);
    console.log("  End time:", new Date(endTime * 1000).toISOString());

    const tx = await factory.createMarket(claim, endTime, {
      gasLimit: 15000000
    });

    console.log("📤 Transaction sent:", tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log("✅ Market creation successful!");

      // Parse the event like your UI would
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === 'MarketCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = factory.interface.parseLog(event);
        const contractAddress = parsed.args.market;

        console.log("📍 NEW MARKET CREATED:");
        console.log("  Contract Address:", contractAddress);
        console.log("  Market ID:", parsed.args.id);
        console.log("  Question:", parsed.args.question);

        console.log("\n💡 ACTION REQUIRED:");
        console.log("1. Create a new market in your UI (don't use existing ones)");
        console.log("2. The new market should get this contract address:", contractAddress);
        console.log("3. Then try betting on the NEW market");
        console.log("\nExisting markets in your DB have contractAddress: undefined");
        console.log("because they were created with the broken factory.");

      }
    } else {
      console.log("❌ Market creation failed");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });