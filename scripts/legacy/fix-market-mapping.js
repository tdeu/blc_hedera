import { ethers } from 'ethers';

async function checkBothMarkets() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

  const workingMarket = '0xdbe5D793Be98990B3A328e38c7D85256994e81aC'; // Has bets
  const uiMarket = '0x59EA724B9f0a427221606812cc7b5D69B67C6966';     // UI is checking

  console.log('🔍 Comparing both markets...');

  const marketABI = [
    "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
    "function yesShares() external view returns (uint256)",
    "function noShares() external view returns (uint256)"
  ];

  try {
    // Check working market
    console.log('\n📊 WORKING MARKET:', workingMarket);
    const workingContract = new ethers.Contract(workingMarket, marketABI, provider);
    const [workingPriceYes, workingPriceNo] = await workingContract.getCurrentPrice();
    const workingYesShares = await workingContract.yesShares();
    const workingNoShares = await workingContract.noShares();

    console.log('  YES shares:', ethers.formatEther(workingYesShares));
    console.log('  NO shares:', ethers.formatEther(workingNoShares));
    console.log('  YES price:', ethers.formatEther(workingPriceYes));
    console.log('  NO price:', ethers.formatEther(workingPriceNo));

    const workingYesOdds = parseFloat(ethers.formatEther(workingPriceYes)) > 0 ? 1 / parseFloat(ethers.formatEther(workingPriceYes)) : 2.0;
    console.log('  Odds: True', workingYesOdds.toFixed(2) + 'x');

    // Check UI market
    console.log('\n📊 UI MARKET:', uiMarket);
    const uiContract = new ethers.Contract(uiMarket, marketABI, provider);
    const [uiPriceYes, uiPriceNo] = await uiContract.getCurrentPrice();
    const uiYesShares = await uiContract.yesShares();
    const uiNoShares = await uiContract.noShares();

    console.log('  YES shares:', ethers.formatEther(uiYesShares));
    console.log('  NO shares:', ethers.formatEther(uiNoShares));
    console.log('  YES price:', ethers.formatEther(uiPriceYes));
    console.log('  NO price:', ethers.formatEther(uiPriceNo));

    const uiYesOdds = parseFloat(ethers.formatEther(uiPriceYes)) > 0 ? 1 / parseFloat(ethers.formatEther(uiPriceYes)) : 2.0;
    console.log('  Odds: True', uiYesOdds.toFixed(2) + 'x');

    console.log('\n🎯 SOLUTION:');
    console.log('Your UI needs to point to the working market:', workingMarket);
    console.log('Instead of the empty market:', uiMarket);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBothMarkets().catch(console.error);