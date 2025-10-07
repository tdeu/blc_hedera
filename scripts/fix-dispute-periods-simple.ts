import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const DISPUTE_PERIOD_MS = 168 * 60 * 60 * 1000; // 7 days in milliseconds

async function fixDisputePeriods() {
  console.log('\n🔧 FIXING DISPUTE PERIODS FOR EXISTING DISPUTABLE MARKETS\n');

  // Get all disputable markets
  const { data: markets, error } = await supabase
    .from('approved_markets')
    .select('id, claim, expires_at, dispute_period_end')
    .eq('status', 'disputable');

  if (error) {
    console.error('❌ Error fetching markets:', error);
    return;
  }

  if (!markets || markets.length === 0) {
    console.log('✅ No disputable markets found');
    return;
  }

  console.log(`📊 Found ${markets.length} disputable market(s)\n`);

  for (const market of markets) {
    const expiresAt = new Date(market.expires_at);
    const correctDisputeEnd = new Date(expiresAt.getTime() + DISPUTE_PERIOD_MS);
    const currentDisputeEnd = new Date(market.dispute_period_end);

    console.log(`\n📋 ${market.claim.substring(0, 60)}...`);
    console.log(`   Market expired: ${expiresAt.toISOString()}`);
    console.log(`   Current dispute end: ${currentDisputeEnd.toISOString()}`);
    console.log(`   Correct dispute end: ${correctDisputeEnd.toISOString()}`);

    const timeDiff = Math.abs(correctDisputeEnd.getTime() - currentDisputeEnd.getTime()) / (1000 * 60 * 60);

    if (timeDiff > 0.5) { // If difference is more than 30 minutes
      console.log(`   ⚠️  Off by ${timeDiff.toFixed(1)} hours - UPDATING...`);

      const { error: updateError } = await supabase
        .from('approved_markets')
        .update({
          dispute_period_end: correctDisputeEnd.toISOString()
        })
        .eq('id', market.id);

      if (updateError) {
        console.error(`   ❌ Failed:`, updateError.message);
      } else {
        console.log(`   ✅ Updated!`);
      }
    } else {
      console.log(`   ✅ Already correct`);
    }
  }

  console.log('\n✅ All done!\n');
}

fixDisputePeriods().catch(console.error);
