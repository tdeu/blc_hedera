import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("🧪 Deploying test payable contract...");

  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("Deploying from:", signer.address);

  // Load the compiled contract
  const testPayableArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/TestPayable.sol/TestPayable.json', 'utf8'));

  // Deploy
  const TestPayableFactory = new ethers.ContractFactory(testPayableArtifact.abi, testPayableArtifact.bytecode, signer);
  const testPayable = await TestPayableFactory.deploy();
  await testPayable.waitForDeployment();

  const address = await testPayable.getAddress();
  console.log("✅ TestPayable deployed to:", address);

  // Test it immediately
  console.log("\n🧪 Testing with 0.02 HBAR...");

  try {
    const amount = ethers.parseEther("0.02");
    const tx = await testPayable.testPayable({ value: amount });
    console.log("📤 Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("📄 Transaction status:", receipt.status === 1 ? "SUCCESS" : "FAILED");

    if (receipt.status === 1) {
      // Check the stored values
      const [lastValue, lastSender] = await testPayable.getLastValue();
      console.log("📊 Stored value:", ethers.formatEther(lastValue), "HBAR");
      console.log("📊 Stored sender:", lastSender);

      // Parse events
      console.log("\n📋 Events:");
      for (const log of receipt.logs) {
        try {
          const parsedLog = testPayable.interface.parseLog({
            topics: log.topics,
            data: log.data
          });

          if (parsedLog.name === "ValueReceived") {
            console.log(`  💰 Value: ${ethers.formatEther(parsedLog.args[0])} HBAR from ${parsedLog.args[1]}`);
          } else if (parsedLog.name === "MinimumCheck") {
            console.log(`  🔍 Minimum check: ${ethers.formatEther(parsedLog.args[0])} >= ${ethers.formatEther(parsedLog.args[1])} = ${parsedLog.args[2]}`);
          }
        } catch (e) {
          console.log("  - Unparseable log");
        }
      }

      console.log("\n🎉 Test payable contract works correctly!");
      console.log("The issue is NOT with msg.value on Hedera.");

    } else {
      console.log("❌ Test transaction failed");
    }

  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }

  return address;
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});