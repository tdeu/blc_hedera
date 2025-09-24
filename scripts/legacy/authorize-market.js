import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function authorizeMarket() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const betNFTAddress = '0xb639EC048b2C70E4E0BeC475DCC7f1adcc2D10a5';
  const marketAddress = '0xdbe5D793Be98990B3A328e38c7D85256994e81aC';

  console.log('🎫 Authorizing market in BetNFT...');
  console.log('BetNFT:', betNFTAddress);
  console.log('Market:', marketAddress);

  const betNFTABI = [
    "function authorizeMarket(address market) external",
    "function owner() external view returns (address)",
    "function isAuthorizedMarket(address market) external view returns (bool)"
  ];

  const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, signer);

  try {
    // Check if already authorized
    const isAuthorized = await betNFT.isAuthorizedMarket(marketAddress);
    console.log('Already authorized?', isAuthorized);

    if (!isAuthorized) {
      console.log('🔄 Authorizing market...');
      const tx = await betNFT.authorizeMarket(marketAddress);
      console.log('📤 Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Market authorized!');
    } else {
      console.log('✅ Market already authorized');
    }

    // Verify authorization
    const finalCheck = await betNFT.isAuthorizedMarket(marketAddress);
    console.log('Final authorization status:', finalCheck);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

authorizeMarket().catch(console.error);