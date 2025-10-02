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

async function checkDisputableMarkets() {
  console.log('🔍 Checking disputable markets timing...\n');

  // Get all disputable markets
  const { data: markets, error } = await supabase
    .from('approved_markets')
    .select('*')
    .eq('status', 'disputable')
    .order('expires_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!markets || markets.length === 0) {
    console.log('⚠️ No disputable markets found');
    return;
  }

  console.log(`✅ Found ${markets.length} disputable markets:\n`);

  const now = new Date();

  markets.forEach((market, i) => {
    const expiresAt = new Date(market.expires_at);
    const disputePeriodEnd = market.dispute_period_end ? new Date(market.dispute_period_end) : null;
    const approvedAt = market.approved_at ? new Date(market.approved_at) : null;

    const timeSinceExpiry = now - expiresAt;
    const hoursSinceExpiry = timeSinceExpiry / (1000 * 60 * 60);
    const daysSinceExpiry = hoursSinceExpiry / 24;

    console.log(`${i + 1}. "${market.claim}"`);
    console.log(`   Market ID: ${market.id}`);
    console.log(`   Category: ${market.category}`);
    console.log(`   Status: ${market.status}`);
    console.log(`   Contract: ${market.contract_address || 'N/A'}`);
    console.log(`   \n   📅 TIMELINE:`);
    console.log(`   Created: ${market.created_at}`);
    if (approvedAt) {
      console.log(`   Approved: ${market.approved_at}`);
    }
    console.log(`   Expired: ${market.expires_at}`);
    if (disputePeriodEnd) {
      console.log(`   Dispute Period Ends: ${market.dispute_period_end}`);
    }

    console.log(`   \n   ⏰ TIME CALCULATIONS:`);
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Time since expiry: ${daysSinceExpiry.toFixed(2)} days (${hoursSinceExpiry.toFixed(1)} hours)`);

    if (disputePeriodEnd) {
      const timeUntilDisputeEnd = disputePeriodEnd - now;
      const hoursUntilDisputeEnd = timeUntilDisputeEnd / (1000 * 60 * 60);
      const daysUntilDisputeEnd = hoursUntilDisputeEnd / 24;
      console.log(`   Time until dispute period ends: ${daysUntilDisputeEnd.toFixed(2)} days (${hoursUntilDisputeEnd.toFixed(1)} hours)`);
    }

    // Check if this makes sense
    if (daysSinceExpiry > 1) {
      console.log(`   ⚠️ WARNING: Market expired ${daysSinceExpiry.toFixed(1)} days ago but is still disputable!`);
    }

    if (daysSinceExpiry < 1) {
      console.log(`   ⚠️ ISSUE: Market expired less than 24 hours ago (${hoursSinceExpiry.toFixed(1)}h), not 6+ days!`);
    }

    console.log('');
  });

  // Check if any markets should have transitioned from 'active' to 'disputable' recently
  console.log('\n📊 Checking recently expired markets...\n');

  const { data: recentlyExpired, error: recentError } = await supabase
    .from('approved_markets')
    .select('*')
    .lt('expires_at', now.toISOString())
    .in('status', ['active', 'disputable'])
    .order('expires_at', { ascending: false })
    .limit(10);

  if (!recentError && recentlyExpired) {
    console.log(`Found ${recentlyExpired.length} recently expired markets:\n`);

    recentlyExpired.forEach((m, i) => {
      const expiresAt = new Date(m.expires_at);
      const hoursSinceExpiry = (now - expiresAt) / (1000 * 60 * 60);

      console.log(`${i + 1}. "${m.claim}"`);
      console.log(`   Status: ${m.status}`);
      console.log(`   Expired: ${m.expires_at}`);
      console.log(`   Hours since expiry: ${hoursSinceExpiry.toFixed(1)}h`);
      console.log(`   ${hoursSinceExpiry < 24 ? '✅ Recently expired (within 24h)' : '⚠️ Expired over 24h ago'}`);
      console.log('');
    });
  }
}

checkDisputableMarkets().catch(console.error);
