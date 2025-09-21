// Script to delete test markets from the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function deleteTestMarkets() {
  console.log('🗑️ Starting deletion of test markets...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase not configured.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all markets
    const { data: markets, error } = await supabase
      .from('approved_markets')
      .select('id, claim');

    if (error) {
      console.error('❌ Error fetching markets:', error);
      return;
    }

    // Define test market patterns to delete
    const testMarkets = markets.filter(market =>
      market.claim.toLowerCase().includes('single market') ||
      market.claim.toLowerCase().includes('test market') ||
      market.claim.toLowerCase().includes('test image') ||
      market.claim.toLowerCase().includes('test cam') ||
      market.claim.toLowerCase().includes('test thomas') ||
      market.claim.toLowerCase().includes('test markeeett') ||
      market.claim === 'test market 1' ||
      // Remove very obvious test/spam content
      market.claim.match(/^[a-zA-Z]\1{5,}$/) || // Repeated characters like "EEEEEEEE"
      market.claim.match(/^[a-zA-Z]{1,3}[a-zA-Z]\1{3,}/) || // dddddddd, teeeeeee
      market.claim.includes('AEAEAAE') ||
      market.claim.includes('imggggg') ||
      market.claim.includes('checkingcheckingchecking')
    );

    console.log(`🎯 Found ${testMarkets.length} test markets to delete:`);
    testMarkets.forEach(market => {
      console.log(`- "${market.claim}" (${market.id})`);
    });

    if (testMarkets.length === 0) {
      console.log('✅ No test markets found to delete');
      return;
    }

    // Confirm deletion
    console.log('\n⚠️  This will permanently delete these markets. Continue? (This is automated - proceeding...)');

    // Delete each test market
    let deletedCount = 0;
    for (const market of testMarkets) {
      console.log(`🗑️ Deleting: "${market.claim}"`);

      const { error: deleteError } = await supabase
        .from('approved_markets')
        .delete()
        .eq('id', market.id);

      if (deleteError) {
        console.error(`❌ Failed to delete "${market.claim}":`, deleteError);
      } else {
        console.log(`✅ Deleted: "${market.claim}"`);
        deletedCount++;
      }
    }

    console.log(`\n🎉 Cleanup completed! Deleted ${deletedCount} out of ${testMarkets.length} test markets.`);
    console.log('ℹ️  Please refresh your admin dashboard to see the updated list.');

  } catch (error) {
    console.error('❌ Error during deletion:', error);
  }
}

deleteTestMarkets();