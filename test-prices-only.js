import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testPricesOnly() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const marketAddress = '0xf67F7CE41c02341A74CfBE351145fd1d0A749280';

  console.log('🔍 Testing prices directly on market:', marketAddress);

  const marketABI = [
    "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
    "function yesShares() external view returns (uint256)",
    "function noShares() external view returns (uint256)",
    "function reserve() external view returns (uint256)"
  ];

  const market = new ethers.Contract(marketAddress, marketABI, provider);

  try {
    // Get raw contract data
    const [priceYes, priceNo] = await market.getCurrentPrice();
    const yesShares = await market.yesShares();
    const noShares = await market.noShares();
    const reserve = await market.reserve();

    console.log('📊 RAW CONTRACT DATA:');
    console.log('  priceYes (wei):', priceYes.toString());
    console.log('  priceNo (wei):', priceNo.toString());
    console.log('  yesShares (wei):', yesShares.toString());
    console.log('  noShares (wei):', noShares.toString());
    console.log('  reserve (wei):', reserve.toString());

    // Convert to readable format
    const yesPriceEth = parseFloat(ethers.formatEther(priceYes));
    const noPriceEth = parseFloat(ethers.formatEther(priceNo));
    const yesSharesEth = parseFloat(ethers.formatEther(yesShares));
    const noSharesEth = parseFloat(ethers.formatEther(noShares));
    const reserveEth = parseFloat(ethers.formatEther(reserve));

    console.log('\n📊 CONVERTED VALUES:');
    console.log('  YES price:', yesPriceEth);
    console.log('  NO price:', noPriceEth);
    console.log('  YES shares:', yesSharesEth);
    console.log('  NO shares:', noSharesEth);
    console.log('  Reserve:', reserveEth);

    // Calculate odds (odds = 1 / probability)
    const yesOdds = yesPriceEth > 0 ? 1 / yesPriceEth : 2.0;
    const noOdds = noPriceEth > 0 ? 1 / noPriceEth : 2.0;

    console.log('\n📊 CALCULATED ODDS:');
    console.log('  YES odds:', yesOdds.toFixed(3) + 'x');
    console.log('  NO odds:', noOdds.toFixed(3) + 'x');
    console.log('  YES probability:', (yesPriceEth * 100).toFixed(1) + '%');
    console.log('  NO probability:', (noPriceEth * 100).toFixed(1) + '%');

    // Verify total should be ~1.0
    console.log('\n🔍 VERIFICATION:');
    console.log('  Total probability:', (yesPriceEth + noPriceEth).toFixed(6));
    console.log('  Should be ~1.0');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPricesOnly().catch(console.error);