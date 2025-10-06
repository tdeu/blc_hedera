import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function fixOldDisputableMarkets() {
  console.log('🔍 Finding disputable markets without proper timestamps...');

  // Get all disputable markets
  const { data: markets, error } = await supabase
    .from('approved_markets')
    .select('*')
    .eq('status', 'disputable');

  if (error) {
    console.error('❌ Error fetching markets:', error);
    return;
  }

  console.log(`📊 Found ${markets?.length || 0} disputable markets`);

  for (const market of markets || []) {
    // Check if it's missing the proper fields
    if (!market.expired_at || !market.dispute_period_end) {
      console.log(`\n🔧 Fixing market: ${market.question}`);
      console.log(`   ID: ${market.id}`);
      console.log(`   expiresAt: ${market.expiresAt}`);
      console.log(`   expired_at: ${market.expired_at}`);
      console.log(`   dispute_period_end: ${market.dispute_period_end}`);

      // Set expired_at: use existing expired_at, or expiresAt, or calculate from dispute_period_end
      let expiredAt: string;
      let disputePeriodEnd: string;

      if (market.dispute_period_end) {
        // Has dispute_period_end, so expired_at = dispute_period_end - 7 days
        disputePeriodEnd = market.dispute_period_end;
        expiredAt = new Date(new Date(market.dispute_period_end).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (market.expired_at) {
        expiredAt = market.expired_at;
        disputePeriodEnd = new Date(new Date(expiredAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (market.expiresAt) {
        expiredAt = market.expiresAt;
        disputePeriodEnd = new Date(new Date(expiredAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        console.log('   ⚠️  No timestamp found, skipping...');
        continue;
      }

      const { error: updateError } = await supabase
        .from('approved_markets')
        .update({
          expired_at: expiredAt,
          dispute_period_end: disputePeriodEnd
        })
        .eq('id', market.id);

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated:`);
        console.log(`      expired_at: ${expiredAt}`);
        console.log(`      dispute_period_end: ${disputePeriodEnd}`);
      }
    } else {
      console.log(`✅ Market already has timestamps: ${market.question?.substring(0, 50)}...`);
    }
  }

  console.log('\n🎉 Done!');
}

fixOldDisputableMarkets().catch(console.error);
