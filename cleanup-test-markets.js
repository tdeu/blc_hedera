// Script to clean up test markets - keep only the last created one

// Clear localStorage data
function clearTestMarkets() {
  console.log('🧹 Starting cleanup of test markets...');

  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  console.log('📋 Found localStorage keys:', keys);

  // Clear pending markets (except the last one)
  const pendingKey = 'pending_markets';
  if (localStorage.getItem(pendingKey)) {
    const pendingMarkets = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    console.log(`📝 Found ${pendingMarkets.length} pending markets`);

    if (pendingMarkets.length > 1) {
      // Keep only the last one (most recent)
      const lastMarket = pendingMarkets[pendingMarkets.length - 1];
      localStorage.setItem(pendingKey, JSON.stringify([lastMarket]));
      console.log('✅ Kept only the last pending market:', lastMarket.market.claim);
    }
  }

  // Clear approved markets (except the last one)
  const approvedKey = 'approved_markets';
  if (localStorage.getItem(approvedKey)) {
    const approvedMarkets = JSON.parse(localStorage.getItem(approvedKey) || '[]');
    console.log(`✅ Found ${approvedMarkets.length} approved markets`);

    if (approvedMarkets.length > 1) {
      // Keep only the last one (most recent)
      const lastMarket = approvedMarkets[approvedMarkets.length - 1];
      localStorage.setItem(approvedKey, JSON.stringify([lastMarket]));
      console.log('✅ Kept only the last approved market:', lastMarket.claim);
    }
  }

  // Clear user created markets (except the last one)
  keys.forEach(key => {
    if (key.startsWith('user_created_markets_')) {
      const userMarkets = JSON.parse(localStorage.getItem(key) || '[]');
      console.log(`👤 Found ${userMarkets.length} user created markets for ${key}`);

      if (userMarkets.length > 1) {
        // Keep only the last one
        const lastMarket = userMarkets[userMarkets.length - 1];
        localStorage.setItem(key, JSON.stringify([lastMarket]));
        console.log('✅ Kept only the last user market:', lastMarket.claim);
      }
    }
  });

  // Clear user bets (optional - uncomment if you want to clear these too)
  // keys.forEach(key => {
  //   if (key.startsWith('user_bets_')) {
  //     localStorage.removeItem(key);
  //     console.log('🗑️ Cleared user bets for', key);
  //   }
  // });

  console.log('🎉 Cleanup completed! Refresh the page to see the clean state.');

  // Refresh the page to reflect changes
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Run the cleanup
clearTestMarkets();