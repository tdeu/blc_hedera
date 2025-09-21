// Script to remove the specific Single Market entries
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function removeSingleMarkets() {
  console.log('🎯 Targeting specific Single Market entries for removal...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase not configured.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Target the exact market IDs
    const targetMarkets = [
      '0xaaa75bd9cd40f961e833b22bb4a62c266832ac2126827b10bfd6cae1cc00acb7',
      '0xb227f007b316debd659be34e83613f94190367e93c51ec7c586189bbee54faea'
    ];

    const targetClaims = [
      'Single Market 2025-09-15T10:40:27.553Z',
      'Single Market 2025-09-15T11:14:09.396Z'
    ];

    console.log('🔍 Looking for markets to delete:');
    targetClaims.forEach((claim, index) => {
      console.log(`  ${index + 1}. "${claim}" (ID: ${targetMarkets[index]})`);
    });

    // First, verify they exist
    const { data: existingMarkets, error: queryError } = await supabase
      .from('approved_markets')
      .select('id, claim')
      .in('id', targetMarkets);

    if (queryError) {
      console.error('❌ Error querying markets:', queryError);
      return;
    }

    console.log(`\n📋 Found ${existingMarkets.length} matching markets in database:`);
    existingMarkets.forEach(market => {
      console.log(`  - "${market.claim}" (${market.id})`);
    });

    if (existingMarkets.length === 0) {
      console.log('✅ No matching markets found - they may already be deleted');
      return;
    }

    // Delete each market
    for (const market of existingMarkets) {
      console.log(`\n🗑️ Deleting: "${market.claim}"`);

      const { error: deleteError } = await supabase
        .from('approved_markets')
        .delete()
        .eq('id', market.id);

      if (deleteError) {
        console.error(`❌ Failed to delete "${market.claim}":`, deleteError);
      } else {
        console.log(`✅ Successfully deleted: "${market.claim}"`);
      }
    }

    // Verify deletion
    const { data: remainingMarkets, error: verifyError } = await supabase
      .from('approved_markets')
      .select('id, claim')
      .in('id', targetMarkets);

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
      return;
    }

    if (remainingMarkets.length === 0) {
      console.log('\n🎉 Success! Both Single Market entries have been completely removed from the database.');
      console.log('ℹ️  Please refresh your admin dashboard to see the updated list.');
    } else {
      console.log(`\n⚠️ Warning: ${remainingMarkets.length} markets still remain:`);
      remainingMarkets.forEach(market => {
        console.log(`  - "${market.claim}" (${market.id})`);
      });
    }

    // Show final count
    const { count: totalCount } = await supabase
      .from('approved_markets')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total markets remaining in database: ${totalCount}`);

  } catch (error) {
    console.error('❌ Error during removal:', error);
  }
}

removeSingleMarkets();