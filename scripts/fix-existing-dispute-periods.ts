import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const PREDICTION_MARKET_ABI = [
  "function marketInfo() view returns (bytes32 id, string question, address creator, uint256 endTime, uint8 status)"
];

const DISPUTE_PERIOD_MS = 168 * 60 * 60 * 1000; // 7 days in milliseconds

async function fixDisputePeriods() {
  console.log('\n🔧 FIXING DISPUTE PERIODS FOR EXISTING DISPUTABLE MARKETS\n');
  console.log('This will update dispute_period_end to be calculated from market end time\n');

  // Get all disputable markets
  const { data: markets, error } = await supabase
    .from('approved_markets')
    .select('id, claim, contract_address, expires_at, dispute_period_end')
    .eq('status', 'disputable')
    .not('contract_address', 'is', null);

  if (error) {
    console.error('❌ Error fetching markets:', error);
    return;
  }

  if (!markets || markets.length === 0) {
    console.log('✅ No disputable markets found to fix');
    return;
  }

  console.log(`📊 Found ${markets.length} disputable market(s) to check\n`);

  const provider = new ethers.JsonRpcProvider(process.env.VITE_HEDERA_RPC_URL);

  for (const market of markets) {
    try {
      console.log(`\n📋 Market: ${market.claim.substring(0, 60)}...`);
      console.log(`   Contract: ${market.contract_address}`);

      // Get market end time from blockchain
      const contract = new ethers.Contract(market.contract_address, PREDICTION_MARKET_ABI, provider);
      const marketInfo = await contract.marketInfo();
      const marketEndTime = new Date(Number(marketInfo.endTime) * 1000);

      // Calculate correct dispute period end (7 days from market end)
      const correctDisputeEnd = new Date(marketEndTime.getTime() + DISPUTE_PERIOD_MS);
      const currentDisputeEnd = new Date(market.dispute_period_end);

      console.log(`   Market ended: ${marketEndTime.toISOString()}`);
      console.log(`   Current dispute_period_end: ${currentDisputeEnd.toISOString()}`);
      console.log(`   Correct dispute_period_end: ${correctDisputeEnd.toISOString()}`);

      const timeDiff = Math.abs(correctDisputeEnd.getTime() - currentDisputeEnd.getTime()) / (1000 * 60 * 60);

      if (timeDiff > 1) { // If difference is more than 1 hour
        console.log(`   ⚠️  Difference: ${timeDiff.toFixed(1)} hours - UPDATING...`);

        const { error: updateError } = await supabase
          .from('approved_markets')
          .update({
            dispute_period_end: correctDisputeEnd.toISOString()
          })
          .eq('id', market.id);

        if (updateError) {
          console.error(`   ❌ Failed to update:`, updateError.message);
        } else {
          console.log(`   ✅ Updated successfully!`);
        }
      } else {
        console.log(`   ✅ Already correct (difference: ${timeDiff.toFixed(1)}h)`);
      }

    } catch (err: any) {
      console.error(`   ❌ Error processing market:`, err.message);
    }
  }

  console.log('\n✅ Dispute period fix complete!\n');
}

fixDisputePeriods().catch(console.error);
