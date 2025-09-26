import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkFactoryAuth() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const betNFTAddress = '0x3b1E8b887162e7a58b992ad0A9b2c760D57f68C1';
  const marketAddress = '0xdbe5D793Be98990B3A328e38c7D85256994e81aC';
  const factoryAddress = '0x78F028E7ba957DD166A39908f1acbEeb0F01ABeF';

  console.log('🔍 Checking authorization status...');

  const betNFTABI = [
    "function owner() external view returns (address)",
    "function authorizedMarkets(address) external view returns (bool)",
    "function authorizeMarket(address market) external"
  ];

  const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, signer);

  try {
    const owner = await betNFT.owner();
    const isAuthorized = await betNFT.authorizedMarkets(marketAddress);

    console.log('📋 Status:');
    console.log('  BetNFT owner:', owner);
    console.log('  Factory address:', factoryAddress);
    console.log('  Is factory the owner?', owner.toLowerCase() === factoryAddress.toLowerCase());
    console.log('  Market authorized?', isAuthorized);

    if (!isAuthorized) {
      console.log('\n🔄 Authorizing market...');
      const tx = await betNFT.authorizeMarket(marketAddress);
      await tx.wait();
      console.log('✅ Market authorized!');
    } else {
      console.log('✅ Market already authorized');
    }

    // Double check
    const finalCheck = await betNFT.authorizedMarkets(marketAddress);
    console.log('Final check - Market authorized?', finalCheck);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFactoryAuth().catch(console.error);