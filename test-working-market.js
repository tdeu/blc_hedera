import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testWorkingMarket() {
  // Use the working market with updated prices
  const workingMarketAddress = '0xD752e8E83165fa3993eA5897276ffe4109a21af3';

  console.log('🎯 Simulating UI refresh on working market:', workingMarketAddress);

  // Simulate exactly what the UI does
  try {
    // Dynamic import like in the UI
    const { HederaEVMService, getHederaEVMConfig } = await import('./src/utils/hederaEVMService');
    const evmConfig = getHederaEVMConfig();
    const hederaEVMService = new HederaEVMService(evmConfig);

    console.log('🔄 Calling getMarketPrices (UI simulation)...');
    const prices = await hederaEVMService.getMarketPrices(workingMarketAddress);

    console.log('✅ UI would receive these prices:', {
      yesOdds: prices.yesOdds.toFixed(2) + 'x',
      noOdds: prices.noOdds.toFixed(2) + 'x',
      yesProb: (prices.yesProb * 100).toFixed(1) + '%',
      noProb: (prices.noProb * 100).toFixed(1) + '%'
    });

    console.log('🎯 Expected UI display:');
    console.log(`  True ${prices.yesOdds.toFixed(2)}x`);
    console.log(`  False ${prices.noOdds.toFixed(2)}x`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWorkingMarket().catch(console.error);