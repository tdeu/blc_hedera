// Node.js script to clean up test markets from Supabase database
import { createClient } from '@supabase/supabase-js';

// Supabase configuration (you may need to set these environment variables)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function cleanupTestMarkets() {
  console.log('🔍 Starting test market cleanup from database...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase configuration not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    console.log('ℹ️  Alternatively, you can manually delete test markets from the admin dashboard.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, let's see what markets are in the database
    const { data: allMarkets, error: fetchError } = await supabase
      .from('approved_markets')
      .select('id, claim, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching markets:', fetchError);
      return;
    }

    console.log(`📋 Found ${allMarkets.length} total markets:`);
    allMarkets.forEach((market, index) => {
      console.log(`${index + 1}. "${market.claim}" (${market.id})`);
    });

    // Look for test markets (containing "single market", "test", or similar patterns)
    const testMarkets = allMarkets.filter(market =>
      market.claim.toLowerCase().includes('single market') ||
      market.claim.toLowerCase().includes('test market') ||
      market.claim.toLowerCase().includes('test auto-resolve') ||
      market.id.includes('test')
    );

    if (testMarkets.length === 0) {
      console.log('✅ No test markets found matching common patterns.');
      console.log('ℹ️  If you see test markets above, you can delete them individually from the admin dashboard.');
      return;
    }

    console.log(`\n🎯 Found ${testMarkets.length} test markets to delete:`);
    testMarkets.forEach((market, index) => {
      console.log(`${index + 1}. "${market.claim}" (${market.id})`);
    });

    // Delete each test market
    for (const market of testMarkets) {
      console.log(`🗑️ Deleting: "${market.claim}"`);

      const { error: deleteError } = await supabase
        .from('approved_markets')
        .delete()
        .eq('id', market.id);

      if (deleteError) {
        console.error(`❌ Failed to delete "${market.claim}":`, deleteError);
      } else {
        console.log(`✅ Successfully deleted: "${market.claim}"`);
      }
    }

    console.log('\n🎉 Test market cleanup completed!');
    console.log('ℹ️  Please refresh your admin dashboard to see the updated list.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupTestMarkets();