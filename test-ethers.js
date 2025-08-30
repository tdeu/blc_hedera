import hre from "hardhat";

console.log("hre keys:", Object.keys(hre));
console.log("hre.ethers:", hre.ethers);

if (hre.ethers) {
  try {
    const signers = await hre.ethers.getSigners();
    console.log("Signers:", signers.length);
  } catch (error) {
    console.error("Error getting signers:", error);
  }
} else {
  console.log("ethers is not available in hre");
}