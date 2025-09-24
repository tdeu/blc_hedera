// This script needs to be run with tsx to handle TypeScript imports
// Run with: npx tsx scripts/deploy-missing-contracts.js

console.log('🔍 This script needs TypeScript support. Please run with:');
console.log('npx tsx scripts/deploy-missing-contracts.js');
console.log('');
console.log('Or check markets without contracts manually in the admin panel.');

/**
 * Script to deploy contracts for markets that don't have them
 */
async function deployMissingContracts() {
  try {
    console.log('🔍 Checking for markets without contracts...');

    // Get all approved markets
    const markets = await approvedMarketsService.getApprovedMarkets();

    // Find markets without contracts
    const marketsWithoutContracts = markets.filter(market =>
      !market.contractAddress || market.contractAddress === null
    );

    console.log(`📊 Found ${marketsWithoutContracts.length} markets without contracts out of ${markets.length} total`);

    if (marketsWithoutContracts.length === 0) {
      console.log('✅ All markets have contracts deployed!');
      return;
    }

    // List markets that need contracts
    console.log('\n🏪 Markets needing contract deployment:');
    marketsWithoutContracts.forEach((market, index) => {
      console.log(`${index + 1}. ${market.id}: "${market.claim}"`);
    });

    console.log('\n⚠️  To deploy contracts for these markets:');
    console.log('1. Make sure your Hedera wallet is connected');
    console.log('2. Run: npm run deploy:missing-contracts');
    console.log('3. Or deploy individually through the admin panel');

    return marketsWithoutContracts;

  } catch (error) {
    console.error('❌ Error checking for missing contracts:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployMissingContracts();
}

export { deployMissingContracts };