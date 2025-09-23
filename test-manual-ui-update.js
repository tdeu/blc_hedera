// Manual test to see if the UI would update properly
import { ethers } from 'ethers';

async function manualUIUpdateTest() {
  const workingMarket = '0xD752e8E83165fa3993eA5897276ffe4109a21af3';

  console.log('🧪 Manual UI Update Test');
  console.log('=======================');

  // Test the working market that has updated prices
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const marketABI = [
    "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)"
  ];

  const market = new ethers.Contract(workingMarket, marketABI, provider);

  try {
    const [priceYes, priceNo] = await market.getCurrentPrice();

    // Convert to readable format
    const yesPriceEth = parseFloat(ethers.formatEther(priceYes));
    const noPriceEth = parseFloat(ethers.formatEther(priceNo));

    // Calculate odds
    const yesOdds = yesPriceEth > 0 ? 1 / yesPriceEth : 2.0;
    const noOdds = noPriceEth > 0 ? 1 / noPriceEth : 2.0;

    console.log('📊 Current Market State:');
    console.log(`   YES: ${(yesPriceEth * 100).toFixed(1)}% probability, ${yesOdds.toFixed(2)}x odds`);
    console.log(`   NO:  ${(noPriceEth * 100).toFixed(1)}% probability, ${noOdds.toFixed(2)}x odds`);

    console.log('\n🎯 UI Should Display:');
    console.log(`   True ${yesOdds.toFixed(2)}x`);
    console.log(`   False ${noOdds.toFixed(2)}x`);

    console.log('\n💡 To Test UI:');
    console.log('1. Manually set marketContracts in your app:');
    console.log(`   marketContracts["some_test_market"] = "${workingMarket}"`);
    console.log('2. Call refreshMarketOddsWithAddress("some_test_market", "' + workingMarket + '")');
    console.log('3. The UI should show the odds above instead of 2.00x/2.00x');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

manualUIUpdateTest().catch(console.error);