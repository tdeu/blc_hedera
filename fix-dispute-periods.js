import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DISPUTE_PERIOD_MS = 168 * 60 * 60 * 1000; // 7 days

async function fixDisputePeriods() {
  console.log('🔧 Fixing dispute period end dates for disputable markets...\n');

  // Get all disputable markets
  const { data: markets, error } = await supabase
    .from('approved_markets')
    .select('*')
    .eq('status', 'disputable');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!markets || markets.length === 0) {
    console.log('⚠️ No disputable markets found');
    return;
  }

  console.log(`Found ${markets.length} disputable markets to fix\n`);

  for (const market of markets) {
    const expiresAt = new Date(market.expires_at);
    const oldDisputeEnd = market.dispute_period_end ? new Date(market.dispute_period_end) : null;

    // Calculate CORRECT dispute period end: expiry time + 7 days
    const newDisputeEnd = new Date(expiresAt.getTime() + DISPUTE_PERIOD_MS);

    console.log(`📝 Market: "${market.claim}"`);
    console.log(`   Expired: ${market.expires_at}`);
    console.log(`   Old dispute end: ${market.dispute_period_end || 'N/A'}`);
    console.log(`   New dispute end: ${newDisputeEnd.toISOString()}`);

    if (oldDisputeEnd) {
      const diff = (newDisputeEnd - oldDisputeEnd) / (1000 * 60 * 60);
      console.log(`   Difference: ${diff.toFixed(1)} hours ${diff < 0 ? 'shorter' : 'longer'}`);
    }

    // Update the market
    const { error: updateError } = await supabase
      .from('approved_markets')
      .update({ dispute_period_end: newDisputeEnd.toISOString() })
      .eq('id', market.id);

    if (updateError) {
      console.log(`   ❌ Failed to update: ${updateError.message}`);
    } else {
      console.log(`   ✅ Updated successfully`);
    }
    console.log('');
  }

  console.log('✅ All markets updated!');
}

fixDisputePeriods().catch(console.error);
