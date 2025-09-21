// Simple script to debug localStorage market data
const pendingMarkets = JSON.parse(localStorage.getItem('blockcast_pending_markets') || '[]');

console.log('=== PENDING MARKETS DEBUG ===');
console.log('Total pending markets:', pendingMarkets.length);

pendingMarkets.forEach((market, index) => {
  console.log(`\n--- Market ${index + 1} ---`);
  console.log('ID:', market.id);
  console.log('Question:', market.market?.claim || 'No claim');
  console.log('Has imageUrl:', !!market.market?.imageUrl);
  console.log('ImageUrl:', market.market?.imageUrl);
  console.log('Status:', market.status);
  console.log('Created:', market.submittedAt);
});

// Also check approved markets
const approvedMarkets = JSON.parse(localStorage.getItem('blockcast_approved_markets') || '[]');
console.log('\n=== APPROVED MARKETS DEBUG ===');
console.log('Total approved markets:', approvedMarkets.length);

approvedMarkets.forEach((market, index) => {
  console.log(`\n--- Approved Market ${index + 1} ---`);
  console.log('ID:', market.id);
  console.log('Question:', market.claim || 'No claim');
  console.log('Has imageUrl:', !!market.imageUrl);
  console.log('ImageUrl:', market.imageUrl);
});