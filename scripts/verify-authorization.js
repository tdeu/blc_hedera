import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("🔍 Verifying CAST token authorization...");

  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const castTokenAddress = "0xC78Ac73844077917E20530E36ac935c4B56236c2";
  const buyCastAddress = "0x374722b644d17f1049348E79BD8e6FA112306824";

  const castTokenABI = [
    "function authorizedMinters(address) external view returns (bool)",
    "function owner() external view returns (address)",
    "function authorizeMinter(address minter) external",
    "function mint(address to, uint256 amount) external",
    "function ownerMint(address to, uint256 amount) external"
  ];

  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  console.log("📊 Current Status:");
  console.log("  - CAST Owner:", await castToken.owner());
  console.log("  - Our Address:", signer.address);
  console.log("  - BuyCAST Address:", buyCastAddress);

  const isOwner = (await castToken.owner()).toLowerCase() === signer.address.toLowerCase();
  console.log("  - We are owner:", isOwner);

  const isBuyCastAuthorized = await castToken.authorizedMinters(buyCastAddress);
  console.log("  - BuyCAST authorized:", isBuyCastAuthorized);

  // Check if we (owner) are also in authorized minters
  const isOwnerAuthorized = await castToken.authorizedMinters(signer.address);
  console.log("  - Owner also authorized as minter:", isOwnerAuthorized);

  // If BuyCAST is not authorized, authorize it
  if (!isBuyCastAuthorized) {
    console.log("\n🔧 Authorizing BuyCAST contract...");
    try {
      const tx = await castToken.authorizeMinter(buyCastAddress);
      await tx.wait();
      console.log("✅ BuyCAST authorization completed");
    } catch (error) {
      console.log("❌ Authorization failed:", error.message);
      return;
    }
  }

  // Test using ownerMint instead of regular mint
  console.log("\n🧪 Testing ownerMint (should work)...");
  try {
    const amount = ethers.parseEther("1.0");
    const tx = await castToken.ownerMint(signer.address, amount);
    await tx.wait();
    console.log("✅ ownerMint succeeded!");
  } catch (error) {
    console.log("❌ ownerMint failed:", error.message);
  }

  // Test if BuyCAST can now mint (by simulating with owner)
  console.log("\n🧪 Testing regular mint with authorized address...");

  // First, make sure owner is also an authorized minter for testing
  if (!isOwnerAuthorized) {
    console.log("🔧 Authorizing owner as minter for testing...");
    try {
      const tx = await castToken.authorizeMinter(signer.address);
      await tx.wait();
      console.log("✅ Owner authorization completed");
    } catch (error) {
      console.log("❌ Owner authorization failed:", error.message);
    }
  }

  // Now test regular mint
  try {
    const amount = ethers.parseEther("0.5");
    const tx = await castToken.mint(signer.address, amount);
    await tx.wait();
    console.log("✅ Regular mint succeeded!");
  } catch (error) {
    console.log("❌ Regular mint failed:", error.message);
  }

  // Final verification
  console.log("\n📊 Final Authorization Status:");
  const finalBuyCastAuth = await castToken.authorizedMinters(buyCastAddress);
  const finalOwnerAuth = await castToken.authorizedMinters(signer.address);
  console.log("  - BuyCAST authorized:", finalBuyCastAuth);
  console.log("  - Owner authorized:", finalOwnerAuth);

  console.log("\n✅ Authorization verification complete!");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});