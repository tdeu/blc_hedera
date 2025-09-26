import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkOwnership() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const betNFTAddress = '0x3b1E8b887162e7a58b992ad0A9b2c760D57f68C1';

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