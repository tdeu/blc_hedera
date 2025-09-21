// Simple script to check what markets are in the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkMarkets() {
  console.log('🔍 Checking markets in database...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase not configured. Environment variables not found.');
    console.log('📝 You can manually check and delete test markets from the admin dashboard at http://localhost:3002');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: markets, error } = await supabase
      .from('approved_markets')
      .select('id, claim, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📋 Found ${markets.length} markets:`);
    markets.forEach((market, index) => {
      console.log(`${index + 1}. "${market.claim}" (ID: ${market.id})`);
    });

    // Identify likely test markets
    const testMarkets = markets.filter(market =>
      market.claim.toLowerCase().includes('single market') ||
      market.claim.toLowerCase().includes('test') ||
      market.id.includes('test')
    );

    if (testMarkets.length > 0) {
      console.log(`\n🎯 Potential test markets found (${testMarkets.length}):`);
      testMarkets.forEach(market => {
        console.log(`- "${market.claim}" (${market.id})`);
      });

      console.log('\n💡 To delete these, you can:');
      console.log('1. Use the admin dashboard at http://localhost:3002 and offline them');
      console.log('2. Or run the deletion script if you confirm these are test markets');
    } else {
      console.log('\n✅ No obvious test markets found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMarkets();