// Final cleanup script to remove remaining test markets
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function finalCleanup() {
  console.log('🧹 Final cleanup of remaining test markets...');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get current markets
    const { data: markets, error } = await supabase
      .from('approved_markets')
      .select('id, claim')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📋 Current total: ${markets.length} markets`);

    // More comprehensive test market detection
    const testMarkets = markets.filter(market =>
      // Obvious test patterns
      market.claim.toLowerCase().includes('test') ||
      market.claim.toLowerCase().includes('single market') ||
      // Gibberish/spam content
      market.claim.match(/^[a-zA-Z]\1{4,}$/) || // 5+ repeated chars like "EEEEE"
      market.claim.match(/[a-zA-Z]\1{8,}/) || // 9+ repeated chars anywhere
      market.claim.includes('AEAEAAE') ||
      market.claim.includes('sdfgdbhfngj') ||
      market.claim.includes('checking') ||
      market.claim.includes('imggg') ||
      market.claim.includes('dddddd') ||
      market.claim.includes('teeeeee') ||
      // Very short nonsense
      market.claim.length < 3 ||
      // Obvious testing phrases
      market.claim.toLowerCase().includes('verification image upload')
    );

    if (testMarkets.length === 0) {
      console.log('✅ No more test markets found');

      // Show clean market list
      console.log('\n📋 Remaining legitimate markets:');
      markets.forEach((market, index) => {
        console.log(`${index + 1}. "${market.claim}"`);
      });
      return;
    }

    console.log(`🎯 Found ${testMarkets.length} more test markets:`);
    testMarkets.forEach(market => {
      console.log(`- "${market.claim}" (${market.id})`);
    });

    // Delete them
    for (const market of testMarkets) {
      const { error: deleteError } = await supabase
        .from('approved_markets')
        .delete()
        .eq('id', market.id);

      if (!deleteError) {
        console.log(`✅ Deleted: "${market.claim}"`);
      }
    }

    // Show final clean list
    const { data: finalMarkets } = await supabase
      .from('approved_markets')
      .select('id, claim')
      .order('created_at', { ascending: false });

    console.log(`\n🎉 Cleanup complete! Remaining legitimate markets (${finalMarkets.length}):`);
    finalMarkets.forEach((market, index) => {
      console.log(`${index + 1}. "${market.claim}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

finalCleanup();