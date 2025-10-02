import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const MARKET_ADDRESS = '0x3cc12acb789d734f13a51191a933bf947d872e48';

const MARKET_ABI = [
  "function isPendingResolution() external view returns (bool)",
  "function marketInfo() external view returns (tuple(bytes32 claimId, address creator, uint256 endTime, uint8 status))"
];

async function checkMarket() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const market = new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, provider);
  
  const isPending = await market.isPendingResolution();
  const info = await market.marketInfo();
  
  console.log('isPendingResolution():', isPending);
  console.log('marketInfo.status (raw):', info.status);
  const statusNum = parseInt(info.status.toString());
  console.log('marketInfo.status (number):', statusNum);
  console.log('');
  
  if (statusNum === 2) {
    console.log('Market status enum value is 2 (PendingResolution)');
  } else {
    console.log('Market status enum value is', statusNum, '(NOT PendingResolution!)');
  }
  
  if (isPending) {
    console.log('isPendingResolution() returns TRUE');
  } else {
    console.log('isPendingResolution() returns FALSE - PROBLEM!');
  }
}

checkMarket();
