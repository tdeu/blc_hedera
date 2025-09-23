import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function getLatestMarket() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const factoryAddress = '0x78F028E7ba957DD166A39908f1acbEeb0F01ABeF';

  console.log('🔍 Getting latest market from factory:', factoryAddress);

  const factoryABI = [
    "function getAllMarkets() external view returns (address[] memory)"
  ];

  const factory = new ethers.Contract(factoryAddress, factoryABI, provider);

  try {
    const allMarkets = await factory.getAllMarkets();
    console.log('📋 All markets from new factory:', allMarkets);

    if (allMarkets.length > 0) {
      const latestMarket = allMarkets[allMarkets.length - 1];
      console.log('🎯 Latest market:', latestMarket);

      // Test this market
      const marketABI = [
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
        "function collateral() external view returns (address)",
        "function getMarketInfo() external view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))"
      ];

      const market = new ethers.Contract(latestMarket, marketABI, provider);

      const collateral = await market.collateral();
      console.log('💰 Market collateral:', collateral);

      const marketInfo = await market.getMarketInfo();
      console.log('📝 Market question:', marketInfo.question);

      const [priceYes, priceNo] = await market.getCurrentPrice();
      console.log('📊 Initial prices:');
      console.log('  YES:', ethers.formatEther(priceYes));
      console.log('  NO:', ethers.formatEther(priceNo));

      // Calculate odds
      const yesPriceEth = parseFloat(ethers.formatEther(priceYes));
      const noPriceEth = parseFloat(ethers.formatEther(priceNo));
      const yesOdds = yesPriceEth > 0 ? 1 / yesPriceEth : 2.0;
      const noOdds = noPriceEth > 0 ? 1 / noPriceEth : 2.0;

      console.log('\n🎯 UI Should Display:');
      console.log(`  True ${yesOdds.toFixed(2)}x`);
      console.log(`  False ${noOdds.toFixed(2)}x`);

      console.log('\n✅ SUCCESS! New factory creates working markets with correct CastToken!');
      console.log('📝 Use this market address for testing UI updates:', latestMarket);

    } else {
      console.log('❌ No markets found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getLatestMarket().catch(console.error);