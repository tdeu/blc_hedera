import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkOwnership() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const betNFTAddress = '0xb639EC048b2C70E4E0BeC475DCC7f1adcc2D10a5';

  console.log('👤 Checking ownership...');
  console.log('Signer address:', signer.address);

  const betNFTABI = [
    "function owner() external view returns (address)"
  ];

  const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, provider);

  try {
    const owner = await betNFT.owner();
    console.log('BetNFT owner:', owner);
    console.log('Is signer the owner?', owner.toLowerCase() === signer.address.toLowerCase());

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkOwnership().catch(console.error);