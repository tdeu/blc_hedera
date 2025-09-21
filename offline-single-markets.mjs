// Use the admin service to offline the Single Market entries
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function offlineSingleMarkets() {
  console.log('🔒 Setting Single Market entries to offline status...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase not configured.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Target IDs
    const targetIds = [
      '0xaaa75bd9cd40f961e833b22bb4a62c266832ac2126827b10bfd6cae1cc00acb7',
      '0xb227f007b316debd659be34e83613f94190367e93c51ec7c586189bbee54faea'
    ];

    console.log('🎯 Targeting these market IDs for offline status:');
    targetIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });

    // Update status to 'offline' for each market
    for (const marketId of targetIds) {
      console.log(`\n🔒 Setting market ${marketId} to offline...`);

      const { data, error } = await supabase
        .from('approved_markets')
        .update({ status: 'offline' })
        .eq('id', marketId)
        .select('id, claim, status');

      if (error) {
        console.error(`❌ Error updating market ${marketId}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ Successfully set offline: "${data[0].claim}" (status: ${data[0].status})`);
      } else {
        console.log(`⚠️ No market found with ID: ${marketId}`);
      }
    }

    // Verify the changes
    console.log('\n🔍 Verification - checking offline status...');

    const { data: offlineMarkets, error: verifyError } = await supabase
      .from('approved_markets')
      .select('id, claim, status')
      .in('id', targetIds);

    if (verifyError) {
      console.error('❌ Error verifying offline status:', verifyError);
      return;
    }

    console.log(`📋 Found ${offlineMarkets.length} markets with target IDs:`);
    offlineMarkets.forEach(market => {
      console.log(`  - "${market.claim}" (${market.id}) - Status: ${market.status}`);
    });

    // Check all offline markets
    const { data: allOfflineMarkets, error: allOfflineError } = await supabase
      .from('approved_markets')
      .select('id, claim, status')
      .eq('status', 'offline');

    if (allOfflineError) {
      console.error('❌ Error checking all offline markets:', allOfflineError);
    } else {
      console.log(`\n📊 Total offline markets in database: ${allOfflineMarkets.length}`);
      if (allOfflineMarkets.length > 0) {
        console.log('🔒 Offline markets:');
        allOfflineMarkets.forEach(market => {
          console.log(`  - "${market.claim}" (${market.id})`);
        });
      }
    }

    console.log('\n✅ Single Market entries are now offline and will not appear in the public UI.');
    console.log('ℹ️  Please refresh your admin dashboard to see the updated status.');

  } catch (error) {
    console.error('❌ Error during offline operation:', error);
  }
}

offlineSingleMarkets();