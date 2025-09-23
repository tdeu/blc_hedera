import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function debugBetNFT() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const betNFTAddress = '0xb639EC048b2C70E4E0BeC475DCC7f1adcc2D10a5';
  const marketAddress = '0xD752e8E83165fa3993eA5897276ffe4109a21af3';

  console.log('🎫 Debugging BetNFT...');

  // Try to get the contract code to see if it's deployed
  const code = await provider.getCode(betNFTAddress);
  console.log('Contract code length:', code.length);
  console.log('Contract exists:', code !== '0x');

  if (code === '0x') {
    console.error('❌ NO CONTRACT DEPLOYED AT BETNFT ADDRESS!');
    return;
  }

  const betNFTABI = [
    "function owner() external view returns (address)",
    "function authorizedMarkets(address) external view returns (bool)",
    "function authorizeMarket(address market) external"
  ];

  const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, signer);

  try {
    // Check current authorization status
    const isAuthorized = await betNFT.authorizedMarkets(marketAddress);
    console.log('Market authorized?', isAuthorized);

    if (!isAuthorized) {
      console.log('🔄 Attempting to authorize market...');

      // Try to estimate gas first
      try {
        const gasEstimate = await betNFT.authorizeMarket.estimateGas(marketAddress);
        console.log('Gas estimate:', gasEstimate.toString());

        const tx = await betNFT.authorizeMarket(marketAddress, {
          gasLimit: gasEstimate * 2n
        });
        console.log('📤 Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ Market authorized!');

        // Check again
        const newStatus = await betNFT.authorizedMarkets(marketAddress);
        console.log('New authorization status:', newStatus);

      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError.reason || gasError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.reason || error.message);
  }
}

debugBetNFT().catch(console.error);