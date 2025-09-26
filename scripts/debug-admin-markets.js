async function main() {
  console.log("🔍 Debugging admin dashboard market loading...");

  try {
    // Check if we can access Supabase
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Supabase credentials not found:");
      console.log("  - VITE_SUPABASE_URL:", supabaseUrl ? "✅ SET" : "❌ MISSING");
      console.log("  - VITE_SUPABASE_ANON_KEY:", supabaseKey ? "✅ SET" : "❌ MISSING");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client created");

    // Test the exact query that AdminDashboard uses
    console.log("📊 Testing approved_markets query...");

    const { data, error, count } = await supabase
      .from('approved_markets')
      .select('*', { count: 'exact' })
      .order('approved_at', { ascending: false });

    if (error) {
      console.error("❌ Query error:", error);
      return;
    }

    console.log(`✅ Query successful! Found ${count} total markets`);

    if (data && data.length > 0) {
      console.log("📋 Sample markets:");
      data.slice(0, 3).forEach((market, i) => {
        console.log(`  ${i + 1}. ${market.claim}`);
        console.log(`     - ID: ${market.id}`);
        console.log(`     - Status: ${market.status || 'undefined'}`);
        console.log(`     - Contract: ${market.contract_address || 'undefined'}`);
        console.log(`     - Created: ${market.created_at}`);
        console.log("");
      });

      // Check for the recent market we created
      const recentMarket = data.find(m => m.claim === 'Nouveau marché test');
      if (recentMarket) {
        console.log("🎯 Found our recent test market:");
        console.log("   - ID:", recentMarket.id);
        console.log("   - Contract:", recentMarket.contract_address);
        console.log("   - Status:", recentMarket.status);
      } else {
        console.log("⚠️ Could not find recent test market 'Nouveau marché test'");
      }
    } else {
      console.log("⚠️ No markets found in approved_markets table");
    }

  } catch (error) {
    console.error("❌ Debug script error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });