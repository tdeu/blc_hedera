import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const marketAddress = '0xF16E9eE8ad2F311887fbf4c8C9f8dec5Bee80Df1';

  const privateKey = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || process.env.HEDERA_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Private key not found');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const wallet = new ethers.Wallet(privateKey, provider);

  const ABI = [
    'function approveMarket()',
    'function getMarketInfo() view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))'
  ];

  const contract = new ethers.Contract(marketAddress, ABI, wallet);

  console.log('🔐 Admin wallet:', wallet.address);

  const info = await contract.getMarketInfo();
  const statusNames = ['Submited', 'Open', 'PendingResolution', 'Resolved', 'Canceled'];
  console.log('📊 Current status:', statusNames[Number(info.status)]);

  if (Number(info.status) !== 0) {
    console.log('✅ Already approved or not in Submited status');
    return;
  }

  console.log('🚀 Calling approveMarket()...');
  const tx = await contract.approveMarket({ gasLimit: 500000 });
  console.log('📤 Tx:', tx.hash);

  const receipt = await tx.wait();
  console.log('✅ Confirmed! Gas:', receipt.gasUsed.toString());

  const newInfo = await contract.getMarketInfo();
  console.log('🎉 New status:', statusNames[Number(newInfo.status)]);
}

main().catch(console.error);
