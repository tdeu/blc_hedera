import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testSimpleBet() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const marketAddress = '0xD752e8E83165fa3993eA5897276ffe4109a21af3';
  const castTokenAddress = '0x5e383bD628a0cda81913bbd5EfB4DD1989fCc6e2';

  const marketABI = [
    "function buyYes(uint256 shares) external",
    "function getPriceYes(uint256 sharesToBuy) external view returns (uint256)",
    "function collateral() external view returns (address)",
    "function factory() external view returns (address)",
    "function betNFT() external view returns (address)"
  ];

  const castTokenABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  const betNFTABI = [
    "function owner() external view returns (address)",
    "function isApprovedForAll(address owner, address operator) external view returns (bool)"
  ];

  const market = new ethers.Contract(marketAddress, marketABI, signer);
  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  try {
    // Check factory setup
    const factoryAddress = await market.factory();
    const betNFTAddress = await market.betNFT();
    console.log('🏭 Factory address:', factoryAddress);
    console.log('🎫 BetNFT address:', betNFTAddress);

    const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, provider);
    const nftOwner = await betNFT.owner();
    console.log('👤 BetNFT owner:', nftOwner);

    // Try a smaller bet first - 1 share
    const sharesToBuy = ethers.parseEther('1');
    const betCost = await market.getPriceYes(sharesToBuy);
    console.log('💸 Cost for 1 share:', ethers.formatEther(betCost));

    // Check allowance
    const allowance = await castToken.allowance(signer.address, marketAddress);
    console.log('💳 Current allowance:', ethers.formatEther(allowance));

    if (allowance < betCost) {
      console.log('🔄 Approving...');
      const approveTx = await castToken.approve(marketAddress, betCost);
      await approveTx.wait();
      console.log('✅ Approved');
    }

    // Try the bet with more detailed error handling
    console.log('🎯 Attempting bet...');
    try {
      // Estimate gas first
      const gasEstimate = await market.buyYes.estimateGas(sharesToBuy);
      console.log('⛽ Gas estimate:', gasEstimate.toString());

      const tx = await market.buyYes(sharesToBuy, {
        gasLimit: gasEstimate * 2n, // Double the estimate
      });
      console.log('📤 Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Success!');
    } catch (estimateError) {
      console.error('❌ Gas estimation failed:', estimateError.reason || estimateError.message);

      // Try with manual gas limit
      try {
        const tx = await market.buyYes(sharesToBuy, { gasLimit: 1000000 });
        await tx.wait();
        console.log('✅ Success with manual gas!');
      } catch (txError) {
        console.error('❌ Transaction failed:', txError.reason || txError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimpleBet().catch(console.error);