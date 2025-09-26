import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("🔧 Fixing BuyCAST contract authorization...");

  // Connect to Hedera Testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("🔍 Using account:", signer.address);

  const buyCastAddress = "0xBFb0c38CAD4660ff775180AA3c02e94006A40Fd0";
  const castTokenAddress = "0xC78Ac73844077917E20530E36ac935c4B56236c2";

  // Load CAST Token contract
  const castTokenABI = [
    "function owner() external view returns (address)",
    "function authorizeMinter(address minter) external",
    "function authorizedMinters(address) external view returns (bool)",
    "function mint(address to, uint256 amount) external"
  ];

  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  // Check current state
  console.log("📊 Current State:");
  console.log("  - CAST Token owner:", await castToken.owner());
  console.log("  - Signer address:", signer.address);
  console.log("  - BuyCAST address:", buyCastAddress);

  // Check if BuyCAST is already authorized
  try {
    const isAuthorized = await castToken.authorizedMinters(buyCastAddress);
    console.log("  - BuyCAST authorization status:", isAuthorized ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED");

    if (!isAuthorized) {
      console.log("🔐 Authorizing BuyCAST contract to mint CAST tokens...");
      const tx = await castToken.authorizeMinter(buyCastAddress);
      console.log("📤 Authorization transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("✅ Authorization transaction confirmed:", receipt.hash);

      // Verify authorization
      const isNowAuthorized = await castToken.authorizedMinters(buyCastAddress);
      console.log("🔍 Verification:", isNowAuthorized ? "✅ SUCCESSFULLY AUTHORIZED" : "❌ AUTHORIZATION FAILED");
    } else {
      console.log("✅ BuyCAST contract is already authorized!");
    }
  } catch (error) {
    console.error("❌ Authorization failed:", error.message);

    // Check if we're the owner
    const owner = await castToken.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error("❌ You are not the owner of the CAST token contract!");
      console.error("   - Owner:", owner);
      console.error("   - Your address:", signer.address);
      process.exit(1);
    }
  }

  // Test BuyCAST contract functionality
  console.log("\n🧪 Testing BuyCAST contract...");
  const buyCastABI = [
    "function buyCAST() external payable",
    "function getInfo() external view returns (address, uint256, uint256, uint256, uint256)"
  ];

  const buyCast = new ethers.Contract(buyCastAddress, buyCastABI, signer);

  try {
    const info = await buyCast.getInfo();
    console.log("📋 BuyCAST Contract Info:");
    console.log("  - CAST Token:", info[0]);
    console.log("  - Exchange Rate:", ethers.formatEther(info[1]), "CAST per HBAR");
    console.log("  - Min Purchase:", ethers.formatEther(info[2]), "HBAR");
    console.log("  - Max Purchase:", ethers.formatEther(info[3]), "HBAR");
    console.log("  - Contract Balance:", ethers.formatEther(info[4]), "HBAR");

    // Test purchase with 0.1 HBAR
    console.log("\n🧪 Testing purchase with 0.1 HBAR...");
    const testAmount = ethers.parseEther("0.1");

    const tx = await buyCast.buyCAST({ value: testAmount });
    console.log("📤 Test purchase transaction sent:", tx.hash);

    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("✅ Test purchase successful!");
    } else {
      console.log("❌ Test purchase failed");
    }

  } catch (error) {
    console.error("❌ BuyCAST test failed:", error.message);
  }

  console.log("\n🎉 Authorization fix complete!");
  console.log("The BuyCAST contract should now be able to mint CAST tokens when users purchase them.");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});