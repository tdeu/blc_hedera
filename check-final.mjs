// Fresh check of what markets remain after cleanup
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkFinal() {
  console.log('🔍 Fresh check of remaining markets...');

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

    console.log(`📊 Total markets in database: ${markets.length}`);

    // Separate legitimate from potential remaining test markets
    const legitimate = markets.filter(market =>
      !market.claim.toLowerCase().includes('test') &&
      !market.claim.toLowerCase().includes('single market') &&
      !market.claim.match(/^[a-zA-Z]\1{4,}$/) &&
      !market.claim.includes('AEAEAAE') &&
      !market.claim.includes('sdfgdbhfngj') &&
      !market.claim.includes('checking') &&
      !market.claim.includes('imggg') &&
      !market.claim.includes('dddd') &&
      !market.claim.includes('eeee') &&
      !market.claim.includes('verification image upload') &&
      market.claim.length > 10 // Reasonable length
    );

    const remaining_test = markets.filter(market =>
      market.claim.toLowerCase().includes('test') ||
      market.claim.toLowerCase().includes('single market') ||
      market.claim.match(/^[a-zA-Z]\1{4,}$/) ||
      market.claim.includes('AEAEAAE') ||
      market.claim.includes('sdfgdbhfngj') ||
      market.claim.includes('checking') ||
      market.claim.includes('imggg') ||
      market.claim.includes('dddd') ||
      market.claim.includes('eeee') ||
      market.claim.includes('verification image upload') ||
      market.claim.length <= 10
    );

    console.log(`\n✅ Legitimate markets (${legitimate.length}):`);
    legitimate.forEach((market, index) => {
      console.log(`${index + 1}. "${market.claim}"`);
    });

    if (remaining_test.length > 0) {
      console.log(`\n⚠️ Potential remaining test markets (${remaining_test.length}):`);
      remaining_test.forEach(market => {
        console.log(`- "${market.claim}" (${market.id})`);
      });
    } else {
      console.log('\n🎉 No test markets detected! Database is clean.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFinal();