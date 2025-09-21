// Script to delete test markets
const { supabase } = require('./src/utils/supabase');

async function deleteTestMarkets() {
  console.log('🔍 Looking for test markets to delete...');

  try {
    // Connect to Supabase and find test markets
    if (!supabase) {
      console.log('❌ Supabase not configured, checking localStorage only');
      checkLocalStorage();
      return;
    }

    // Query approved markets for test markets
    const { data: markets, error } = await supabase
      .from('approved_markets')
      .select('*')
      .or('claim.ilike.%single market%,claim.ilike.%test%');

    if (error) {
      console.error('❌ Error querying markets:', error);
      return;
    }

    console.log(`📋 Found ${markets.length} potential test markets:`);
    markets.forEach((market, index) => {
      console.log(`${index + 1}. ${market.claim} (ID: ${market.id})`);
    });

    if (markets.length === 0) {
      console.log('✅ No test markets found in Supabase');
      return;
    }

    // Delete each test market
    for (const market of markets) {
      console.log(`🗑️ Deleting: ${market.claim}`);

      const { error: deleteError } = await supabase
        .from('approved_markets')
        .delete()
        .eq('id', market.id);

      if (deleteError) {
        console.error(`❌ Failed to delete ${market.claim}:`, deleteError);
      } else {
        console.log(`✅ Deleted: ${market.claim}`);
      }
    }

    console.log('🎉 Test market cleanup completed!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

function checkLocalStorage() {
  console.log('🔍 Checking localStorage for test markets...');

  // This would need to be run in a browser context
  console.log('ℹ️ To check localStorage, run this in the browser console:');
  console.log(`
    // Check for test markets in localStorage
    const pendingMarkets = JSON.parse(localStorage.getItem('pending_markets') || '[]');
    const approvedMarkets = JSON.parse(localStorage.getItem('approved_markets') || '[]');

    console.log('Pending markets:', pendingMarkets);
    console.log('Approved markets:', approvedMarkets);

    // Clear test markets
    const cleanedPending = pendingMarkets.filter(m =>
      !m.market?.claim?.toLowerCase().includes('single market') &&
      !m.market?.claim?.toLowerCase().includes('test')
    );
    const cleanedApproved = approvedMarkets.filter(m =>
      !m.claim?.toLowerCase().includes('single market') &&
      !m.claim?.toLowerCase().includes('test')
    );

    localStorage.setItem('pending_markets', JSON.stringify(cleanedPending));
    localStorage.setItem('approved_markets', JSON.stringify(cleanedApproved));

    console.log('✅ Test markets removed from localStorage');
    window.location.reload();
  `);
}

// Run if called directly
if (require.main === module) {
  deleteTestMarkets();
}

module.exports = { deleteTestMarkets };