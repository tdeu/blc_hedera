import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("🔍 Debugging msg.value behavior on Hedera...");

  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const buyCastAddress = "0x103eD6472e50D7746b90860aAd528E9c0F1cD5B4";

  // ABI with events to see what's actually happening
  const buyCastABI = [
    "function buyCAST() external payable",
    "event Debug(string message, uint256 value)",
    "event CastPurchased(address indexed buyer, uint256 hbarAmount, uint256 castAmount)"
  ];

  const buyCast = new ethers.Contract(buyCastAddress, buyCastABI, signer);

  console.log("📤 Attempting to send 0.02 HBAR to buyCAST() function...");

  try {
    const amount = ethers.parseEther("0.02"); // 0.02 HBAR
    console.log("Amount being sent:", ethers.formatEther(amount), "HBAR");
    console.log("Amount in wei:", amount.toString());

    const tx = await buyCast.buyCAST({
      value: amount,
      gasLimit: 500000
    });

    console.log("📄 Transaction sent:", tx.hash);
    console.log("📋 Transaction details:");
    console.log("  - to:", tx.to);
    console.log("  - value:", ethers.formatEther(tx.value), "HBAR");
    console.log("  - data:", tx.data);

    const receipt = await tx.wait();
    console.log("📄 Transaction receipt:");
    console.log("  - status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    console.log("  - gasUsed:", receipt.gasUsed.toString());

    // Parse the logs to see debug events
    console.log("\n📋 Debug Events:");
    for (const log of receipt.logs) {
      try {
        const parsedLog = buyCast.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (parsedLog.name === "Debug") {
          console.log(`  🔍 ${parsedLog.args[0]}: ${parsedLog.args[1].toString()}`);
        } else if (parsedLog.name === "CastPurchased") {
          console.log(`  ✅ CAST Purchased: ${ethers.formatEther(parsedLog.args[2])} CAST`);
        }
      } catch (e) {
        console.log("  - Unparseable log:", log.topics[0]);
      }
    }

    if (receipt.status === 1) {
      console.log("🎉 SUCCESS! BuyCAST contract is working!");
    } else {
      console.log("❌ Transaction failed");
    }

  } catch (error) {
    console.error("❌ Transaction failed:", error.message);

    if (error.receipt) {
      console.log("📋 Failure receipt status:", error.receipt.status);
    }

    // Try to get more details
    if (error.reason) {
      console.log("💡 Revert reason:", error.reason);
    }

    if (error.code === 'CALL_EXCEPTION') {
      console.log("🚨 This is a contract revert - the transaction was executed but failed");
    }
  }

  console.log("\n✅ Debug complete!");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});