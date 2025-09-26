async function main() {
  console.log("🔧 Fixing an existing market for immediate testing...");

  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Supabase credentials not found in environment");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the market that was just created
    const workingContractAddress = "0x323c01689778D674F471A6491737D729FfeC924D";

    console.log("📋 Looking for a market to fix...");

    // Find a market with undefined contract address
    const { data: markets, error: fetchError } = await supabase
      .from('approved_markets')
      .select('*')
      .is('contract_address', null)
      .limit(1);

    if (fetchError) {
      console.error("❌ Error fetching markets:", fetchError);
      return;
    }

    if (!markets || markets.length === 0) {
      console.log("ℹ️ No markets found with undefined contract_address");
      return;
    }

    const marketToFix = markets[0];
    console.log("🎯 Found market to fix:", marketToFix.claim);

    // Update it with a working contract address
    const { error: updateError } = await supabase
      .from('approved_markets')
      .update({ contract_address: workingContractAddress })
      .eq('id', marketToFix.id);

    if (updateError) {
      console.error("❌ Error updating market:", updateError);
      return;
    }

    console.log("✅ Market fixed!");
    console.log("📋 Market details:");
    console.log("  ID:", marketToFix.id);
    console.log("  Claim:", marketToFix.claim);
    console.log("  New contract address:", workingContractAddress);
    console.log("\n🎯 Now you can test betting on this market!");

  } catch (error) {
    console.error("❌ Script failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });