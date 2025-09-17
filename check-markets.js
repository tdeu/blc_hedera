// Check markets and their structure for debugging
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkMarkets() {
  console.log('🔍 Checking available markets...\n');

  try {
    // Get all markets
    const { data: markets, error } = await supabase
      .from('approved_markets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching markets:', error);
      return;
    }

    console.log(`📊 Found ${markets.length} markets:\n`);

    markets.forEach((market, index) => {
      console.log(`${index + 1}. Market ID: ${market.id}`);
      console.log(`   Claim: ${market.claim}`);
      console.log(`   Status: ${market.status}`);
      console.log(`   Expires: ${market.expires_at}`);

      if (market.resolution_data) {
        console.log(`   Resolution: ${JSON.stringify(market.resolution_data)}`);
      }

      // Check if this market is disputable
      const now = new Date();
      const expiresAt = new Date(market.expires_at);
      const disputePeriodEnd = market.dispute_period_end
        ? new Date(market.dispute_period_end)
        : new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000);  // 7 days instead of 48 hours

      const isDisputable = now <= disputePeriodEnd &&
                          (market.status === 'pending_resolution' || market.status === 'disputing');

      console.log(`   Disputable: ${isDisputable ? '✅ YES' : '❌ NO'}`);
      console.log(`   Dispute period ends: ${disputePeriodEnd.toISOString()}\n`);
    });

    // Test with a real market ID
    if (markets.length > 0) {
      const testMarketId = markets[0].id;
      console.log(`🧪 Testing evidence submission preparation for market: ${testMarketId}\n`);

      // Check if we can prepare an evidence submission (without actually submitting)
      console.log('📝 Evidence submission would use:');
      console.log(`   Market ID: ${testMarketId}`);
      console.log(`   User ID: 0x1234... (wallet address)`);
      console.log(`   Evidence text: "Test evidence with 20+ characters"`);
      console.log(`   Links: ["https://example.com"]`);
      console.log(`   Fee: 0.1 HBAR`);
      console.log(`   Status: pending\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMarkets().catch(console.error);