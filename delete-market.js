import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteMarket() {
  console.log('🔍 Searching for "nouveau marché test" market...\n');

  // First, find the market
  const { data: markets, error: searchError } = await supabase
    .from('approved_markets')
    .select('*')
    .ilike('claim', '%nouveau marché test%');

  if (searchError) {
    console.error('❌ Error searching for market:', searchError);
    return;
  }

  if (!markets || markets.length === 0) {
    console.log('⚠️ No market found with "nouveau marché test" in the claim');

    // List all markets to help find it
    console.log('\n📋 Listing all markets:');
    const { data: allMarkets } = await supabase
      .from('approved_markets')
      .select('id, claim, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allMarkets) {
      allMarkets.forEach((m, i) => {
        console.log(`${i + 1}. "${m.claim}" (ID: ${m.id})`);
      });
    }
    return;
  }

  console.log(`✅ Found ${markets.length} market(s):`);
  markets.forEach((m, i) => {
    console.log(`\n${i + 1}. Market:`);
    console.log(`   Claim: "${m.claim}"`);
    console.log(`   ID: ${m.id}`);
    console.log(`   Category: ${m.category}`);
    console.log(`   Created: ${m.created_at}`);
    console.log(`   Status: ${m.status}`);
  });

  console.log('\n🗑️ Deleting market(s)...');

  // Delete the market(s)
  const { error: deleteError } = await supabase
    .from('approved_markets')
    .delete()
    .in('id', markets.map(m => m.id));

  if (deleteError) {
    console.error('❌ Error deleting market:', deleteError);
    return;
  }

  console.log(`✅ Successfully deleted ${markets.length} market(s)!`);
}

deleteMarket().catch(console.error);
