import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const RPC_URL = 'https://testnet.hashio.io/api';

async function main() {
  console.log('🧹 Starting market cleanup process...\n');

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Initialize Hedera provider
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    name: 'hedera-testnet',
    chainId: 296
  });

  // Fetch all markets with contract addresses
  const { data: markets, error } = await supabase
    .from('approved_markets')
    .select('*')
    .not('contract_address', 'is', null)
    .not('status', 'in', '("invalid","cancelled")');

  if (error) {
    console.error('❌ Error fetching markets:', error);
    return;
  }

  console.log(`📊 Found ${markets?.length || 0} markets to validate\n`);

  const marketABI = [
    "function marketInfo() external view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))"
  ];

  let validCount = 0;
  let invalidCount = 0;
  const invalidMarkets: any[] = [];

  for (const market of markets || []) {
    try {
      console.log(`🔍 Checking market: ${market.claim?.substring(0, 50)}...`);
      console.log(`   Contract: ${market.contract_address}`);

      const contract = new ethers.Contract(market.contract_address, marketABI, provider);

      // Try to call marketInfo() - this will fail if contract doesn't exist or is invalid
      const info = await contract.marketInfo();

      console.log(`   ✅ Valid - Status: ${info.status}`);
      validCount++;

    } catch (contractError) {
      console.log(`   ❌ Invalid - ${contractError.message.substring(0, 80)}`);
      invalidCount++;
      invalidMarkets.push({
        id: market.id,
        claim: market.claim,
        contract_address: market.contract_address
      });
    }
  }

  console.log(`\n📈 Validation Results:`);
  console.log(`   ✅ Valid markets: ${validCount}`);
  console.log(`   ❌ Invalid markets: ${invalidCount}`);

  if (invalidMarkets.length > 0) {
    console.log(`\n🗑️  Marking ${invalidMarkets.length} markets as invalid...`);

    for (const invalidMarket of invalidMarkets) {
      const { error: updateError } = await supabase
        .from('approved_markets')
        .update({
          status: 'invalid',
          updated_at: new Date().toISOString()
        })
        .eq('id', invalidMarket.id);

      if (updateError) {
        console.error(`   ❌ Failed to update market ${invalidMarket.id}:`, updateError);
      } else {
        console.log(`   ✅ Marked as invalid: ${invalidMarket.claim?.substring(0, 50)}...`);
      }
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`\nSummary:`);
  console.log(`- Total markets checked: ${markets?.length || 0}`);
  console.log(`- Valid markets: ${validCount}`);
  console.log(`- Invalid markets marked: ${invalidCount}`);
}

main().catch(console.error);
