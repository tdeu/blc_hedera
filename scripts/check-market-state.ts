import { ethers } from 'ethers';

const marketAddress = '0xF16E9eE8ad2F311887fbf4c8C9f8dec5Bee80Df1';
const rpcUrl = 'https://testnet.hashio.io/api';

const ABI = [
  'function getMarketInfo() view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(marketAddress, ABI, provider);

  const info = await contract.getMarketInfo();
  const statusNames = ['Submited', 'Open', 'PendingResolution', 'Resolved', 'Canceled'];

  console.log('📊 Market Status:', statusNames[Number(info.status)]);
  console.log('⏰ End Time:', new Date(Number(info.endTime) * 1000).toISOString());
  console.log('🕐 Current Time:', new Date().toISOString());
  console.log('❓ Is Expired:', Date.now() > Number(info.endTime) * 1000);
}

main().catch(console.error);
