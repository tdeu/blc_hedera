import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function debugMarket() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const marketAddress = '0xf67F7CE41c02341A74CfBE351145fd1d0A749280';

  console.log('🔍 Debugging market:', marketAddress);

  const marketABI = [
    "function getMarketInfo() external view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))",
    "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
    "function collateral() external view returns (address)"
  ];

  const market = new ethers.Contract(marketAddress, marketABI, provider);

  try {
    console.log('\n📋 MARKET INFO:');
    const marketInfo = await market.getMarketInfo();
    console.log('📝 Question:', marketInfo.question);
    console.log('👤 Creator:', marketInfo.creator);
    console.log('⏰ End time:', new Date(Number(marketInfo.endTime) * 1000).toISOString());
    console.log('📊 Status:', marketInfo.status); // 0=Submitted, 1=Open, 2=PendingResolution, 3=Resolved, 4=Canceled
    console.log('🆔 ID:', marketInfo.id);

    const collateralAddress = await market.collateral();
    console.log('💰 Collateral token:', collateralAddress);

    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = Number(marketInfo.endTime);
    const timeRemaining = endTime - currentTime;

    console.log('\n⏰ TIME CHECK:');
    console.log('Current time:', new Date().toISOString());
    console.log('Market end time:', new Date(endTime * 1000).toISOString());
    console.log('Time remaining:', timeRemaining, 'seconds');
    console.log('Market expired?', timeRemaining <= 0);

    const prices = await market.getCurrentPrice();
    console.log('\n💰 PRICES:');
    console.log('YES price:', ethers.formatEther(prices.priceYes));
    console.log('NO price:', ethers.formatEther(prices.priceNo));

  } catch (error) {
    console.error('❌ Error debugging market:', error.message);
  }
}

debugMarket().catch(console.error);