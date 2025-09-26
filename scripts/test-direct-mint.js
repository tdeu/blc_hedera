import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("🔍 Testing CAST token minting directly...");

  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const castTokenAddress = "0xC78Ac73844077917E20530E36ac935c4B56236c2";
  const buyCastAddress = "0x374722b644d17f1049348E79BD8e6FA112306824";

  const castTokenABI = [
    "function mint(address to, uint256 amount) external",
    "function authorizedMinters(address) external view returns (bool)",
    "function owner() external view returns (address)"
  ];

  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  console.log("📊 CAST Token Status:");
  console.log("  - Owner:", await castToken.owner());
  console.log("  - Signer:", signer.address);

  // Check authorization
  const isAuthorized = await castToken.authorizedMinters(buyCastAddress);
  console.log("  - BuyCAST authorized:", isAuthorized);

  // Try minting directly from signer (owner)
  console.log("\n🧪 Testing direct mint from owner...");
  try {
    const mintAmount = ethers.parseEther("1.0");
    const tx = await castToken.mint(signer.address, mintAmount);
    console.log("📤 Direct mint transaction:", tx.hash);

    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("✅ Direct mint succeeded!");
    } else {
      console.log("❌ Direct mint failed");
    }
  } catch (error) {
    console.log("❌ Direct mint failed:", error.message);
  }

  // Create a simple test contract that just tries to mint
  console.log("\n🧪 Testing contract-based minting...");

  // Deploy a simple test contract
  const testContractCode = `
    pragma solidity ^0.8.20;

    interface ICastToken {
        function mint(address to, uint256 amount) external;
    }

    contract MintTest {
        function testMint(address castToken, address to, uint256 amount) external {
            ICastToken(castToken).mint(to, amount);
        }
    }
  `;

  // Instead, let's use the BuyCAST contract directly but call the CAST token
  const buyCastABI = [
    "function owner() external view returns (address)",
    "function castToken() external view returns (address)"
  ];

  const buyCast = new ethers.Contract(buyCastAddress, buyCastABI, signer);

  console.log("📊 BuyCAST Contract Status:");
  console.log("  - Owner:", await buyCast.owner());
  console.log("  - CAST Token:", await buyCast.castToken());

  // Try calling mint from BuyCAST contract address context
  // This won't work because we can't impersonate the contract, but let's see what happens

  console.log("\n💡 The issue might be that BuyCAST contract is not properly authorized.");
  console.log("Let's check if the authorization was done correctly...");

  // Re-check and potentially re-authorize
  if (!isAuthorized) {
    console.log("🔧 BuyCAST is not authorized. Authorizing now...");
    try {
      const authTx = await castToken.authorizeMinter(buyCastAddress);
      await authTx.wait();
      console.log("✅ Authorization transaction completed");

      const newAuthStatus = await castToken.authorizedMinters(buyCastAddress);
      console.log("✅ New authorization status:", newAuthStatus);
    } catch (error) {
      console.log("❌ Authorization failed:", error.message);
    }
  }

  console.log("\n✅ Direct testing complete!");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});