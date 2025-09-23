import { ethers } from 'ethers';
import { HederaEVMService, getHederaEVMConfig } from './src/utils/hederaEVMService.ts';

async function testUIRefresh() {
  const marketAddress = '0xD752e8E83165fa3993eA5897276ffe4109a21af3';

  console.log('🔍 Testing UI refresh logic...');
  console.log('Market address:', marketAddress);

  try {
    // Import and create the service just like the UI does
    const evmConfig = getHederaEVMConfig();
    const hederaEVMService = new HederaEVMService(evmConfig);

    console.log('🔄 Calling getMarketPrices...');
    const prices = await hederaEVMService.getMarketPrices(marketAddress);

    console.log('✅ Prices returned:', {
      yesPrice: prices.yesPrice,
      noPrice: prices.noPrice,
      yesOdds: prices.yesOdds,
      noOdds: prices.noOdds,
      yesProb: prices.yesProb,
      noProb: prices.noProb
    });

    console.log('📊 Formatted for UI:', {
      yesOdds: prices.yesOdds.toFixed(2) + 'x',
      noOdds: prices.noOdds.toFixed(2) + 'x',
      yesProb: (prices.yesProb * 100).toFixed(1) + '%',
      noProb: (prices.noProb * 100).toFixed(1) + '%'
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testUIRefresh().catch(console.error);