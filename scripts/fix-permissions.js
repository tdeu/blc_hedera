import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("Fixing BetNFT permissions for existing deployment...");
  
  // Connect to Hedera Testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);
  
  console.log("Using account:", signer.address);

  // Contract addresses from .env
  const betNFTAddress = process.env.CONTRACT_BET_NFT;
  const factoryAddress = process.env.CONTRACT_PREDICTION_MARKET_FACTORY;

  if (!betNFTAddress || !factoryAddress) {
    throw new Error("Missing contract addresses in .env file");
  }

  console.log("BetNFT address:", betNFTAddress);
  console.log("Factory address:", factoryAddress);

  // BetNFT ABI (minimal)
  const betNFTABI = [
    "function owner() external view returns (address)",
    "function transferOwnership(address newOwner) external"
  ];

  const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, signer);

  // Check current owner
  const currentOwner = await betNFT.owner();
  console.log("Current BetNFT owner:", currentOwner);
  console.log("Signer address:", signer.address);

  if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Signer is not the current owner of BetNFT");
  }

  // Transfer ownership to factory
  console.log("Transferring ownership to factory...");
  const tx = await betNFT.transferOwnership(factoryAddress);
  await tx.wait();
  
  console.log("✅ Ownership transferred! Transaction hash:", tx.hash);

  // Verify the transfer
  const newOwner = await betNFT.owner();
  console.log("New BetNFT owner:", newOwner);
  
  if (newOwner.toLowerCase() === factoryAddress.toLowerCase()) {
    console.log("🎉 Success! Factory can now authorize markets.");
  } else {
    console.log("❌ Transfer failed or not confirmed yet.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fix failed:", error);
    process.exit(1);
  });