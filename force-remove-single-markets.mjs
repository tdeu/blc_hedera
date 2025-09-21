// Force removal script with multiple deletion methods
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function forceRemoveSingleMarkets() {
  console.log('💪 Force removal of Single Market entries...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase not configured.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Method 1: Delete by exact claim text
    console.log('\n🎯 Method 1: Deleting by exact claim text...');

    const { data: deletedByClaim1, error: error1 } = await supabase
      .from('approved_markets')
      .delete()
      .eq('claim', 'Single Market 2025-09-15T10:40:27.553Z');

    if (error1) {
      console.error('❌ Error deleting first market by claim:', error1);
    } else {
      console.log(`✅ Deleted ${deletedByClaim1?.length || 0} records for "Single Market 2025-09-15T10:40:27.553Z"`);
    }

    const { data: deletedByClaim2, error: error2 } = await supabase
      .from('approved_markets')
      .delete()
      .eq('claim', 'Single Market 2025-09-15T11:14:09.396Z');

    if (error2) {
      console.error('❌ Error deleting second market by claim:', error2);
    } else {
      console.log(`✅ Deleted ${deletedByClaim2?.length || 0} records for "Single Market 2025-09-15T11:14:09.396Z"`);
    }

    // Method 2: Delete by ID
    console.log('\n🎯 Method 2: Deleting by specific IDs...');

    const { data: deletedById1, error: error3 } = await supabase
      .from('approved_markets')
      .delete()
      .eq('id', '0xaaa75bd9cd40f961e833b22bb4a62c266832ac2126827b10bfd6cae1cc00acb7');

    if (error3) {
      console.error('❌ Error deleting by first ID:', error3);
    } else {
      console.log(`✅ Deleted ${deletedById1?.length || 0} records for ID: 0xaaa75bd9cd40f961e833b22bb4a62c266832ac2126827b10bfd6cae1cc00acb7`);
    }

    const { data: deletedById2, error: error4 } = await supabase
      .from('approved_markets')
      .delete()
      .eq('id', '0xb227f007b316debd659be34e83613f94190367e93c51ec7c586189bbee54faea');

    if (error4) {
      console.error('❌ Error deleting by second ID:', error4);
    } else {
      console.log(`✅ Deleted ${deletedById2?.length || 0} records for ID: 0xb227f007b316debd659be34e83613f94190367e93c51ec7c586189bbee54faea`);
    }

    // Method 3: Delete any market containing "Single Market"
    console.log('\n🎯 Method 3: Deleting any remaining "Single Market" entries...');

    const { data: deletedByPattern, error: error5 } = await supabase
      .from('approved_markets')
      .delete()
      .like('claim', '%Single Market%');

    if (error5) {
      console.error('❌ Error deleting by pattern:', error5);
    } else {
      console.log(`✅ Deleted ${deletedByPattern?.length || 0} records containing "Single Market"`);
    }

    // Wait a moment for database consistency
    console.log('\n⏳ Waiting for database consistency...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Final verification
    console.log('\n🔍 Final verification...');

    const { data: remainingMarkets, error: verifyError } = await supabase
      .from('approved_markets')
      .select('id, claim')
      .like('claim', '%Single Market%');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return;
    }

    if (remainingMarkets.length === 0) {
      console.log('🎉 SUCCESS! All Single Market entries have been completely removed.');
    } else {
      console.log(`⚠️ Warning: ${remainingMarkets.length} Single Market entries still found:`);
      remainingMarkets.forEach(market => {
        console.log(`  - "${market.claim}" (${market.id})`);
      });
    }

    // Show total count
    const { count: totalCount } = await supabase
      .from('approved_markets')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total markets remaining in database: ${totalCount}`);

  } catch (error) {
    console.error('❌ Error during force removal:', error);
  }
}

forceRemoveSingleMarkets();