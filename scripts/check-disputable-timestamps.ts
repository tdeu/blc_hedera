import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkDisputabl eTimestamps() {
  console.log('🔍 Fetching disputable markets timestamps...\n');

  const { data: markets, error } = await supabase
    .from('approved_markets')
    .select('*')
    .eq('status', 'disputable')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${markets?.length || 0} disputable markets\n`);

  for (const market of markets || []) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Market: ${market.question || market.id}`);
    console.log(`   ID: ${market.id}`);
    console.log(`   Status: ${market.status}`);
    console.log(`\n⏰ TIMESTAMPS:`);
    console.log(`   created_at: ${market.created_at}`);
    console.log(`   expiresAt: ${market.expiresAt || 'NOT SET'}`);
    console.log(`   expired_at: ${market.expired_at || 'NOT SET'}`);
    console.log(`   dispute_period_end: ${market.dispute_period_end || 'NOT SET'}`);
    console.log(`   updated_at: ${market.updated_at}`);

    // Calculate time differences
    if (market.dispute_period_end) {
      const now = new Date();
      const disputeEnd = new Date(market.dispute_period_end);
      const timeLeft = disputeEnd.getTime() - now.getTime();
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      console.log(`\n⏳ TIME CALCULATIONS:`);
      console.log(`   Current time: ${now.toISOString()}`);
      console.log(`   Dispute ends: ${disputeEnd.toISOString()}`);
      console.log(`   Time remaining: ${daysLeft}d ${hoursLeft}h`);

      // Calculate when market expired (dispute_period_end - 7 days)
      const expiredTime = new Date(disputeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const timeSinceExpiry = now.getTime() - expiredTime.getTime();
      const daysSinceExpiry = Math.floor(timeSinceExpiry / (1000 * 60 * 60 * 24));
      const hoursSinceExpiry = Math.floor((timeSinceExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      console.log(`   Calculated expiry: ${expiredTime.toISOString()}`);
      console.log(`   Time since expiry: ${daysSinceExpiry}d ${hoursSinceExpiry}h ago`);
    }

    console.log('');
  }
}

checkDisputableTimestamps().catch(console.error);
