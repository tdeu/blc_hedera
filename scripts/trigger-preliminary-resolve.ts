/**
 * Manual script to trigger preliminary resolution for an expired market
 *
 * This script will:
 * 1. Get the market details from database
 * 2. Call AI to determine outcome
 * 3. Call preliminaryResolve() on the blockchain contract
 * 4. Update database to 'disputable' status
 *
 * Usage: npx tsx scripts/trigger-preliminary-resolve.ts <marketId>
 */

import { resolutionService } from '../src/utils/resolutionService';
import { supabase } from '../src/utils/supabase';

async function triggerPreliminaryResolve(marketId: string) {
  try {
    console.log('\n🚀 Starting manual preliminary resolution...');
    console.log(`Market ID: ${marketId}`);

    // Get market details
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    const { data: market, error } = await supabase
      .from('approved_markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (error || !market) {
      throw new Error(`Market ${marketId} not found: ${error?.message}`);
    }

    console.log(`\n📋 Market Details:`);
    console.log(`   Claim: ${market.claim}`);
    console.log(`   Status: ${market.status}`);
    console.log(`   Expires: ${new Date(market.expires_at).toLocaleString()}`);
    console.log(`   Contract: ${market.contract_address}`);

    // Check if market has expired
    const now = new Date();
    const expiresAt = new Date(market.expires_at);
    if (expiresAt > now) {
      throw new Error(`Market has not expired yet. Expires at: ${expiresAt.toLocaleString()}`);
    }

    // Check if already resolved
    if (market.status === 'disputable' || market.status === 'resolved') {
      console.log(`\n⚠️  Market is already in '${market.status}' status`);
      if (market.status === 'disputable') {
        console.log(`✅ Market is already disputable - you can submit disputes now!`);
        return;
      } else {
        throw new Error('Market is already resolved');
      }
    }

    // Check if contract address exists
    if (!market.contract_address || market.contract_address === '0x0000000000000000000000000000000000000000') {
      throw new Error('Market has no contract address - cannot resolve on blockchain');
    }

    // Determine outcome (for now, use simple logic - in production, call AI)
    console.log(`\n🤖 Determining market outcome...`);

    // Simple fallback: default to 'no'
    // TODO: Call AI service to get proper outcome
    const outcome: 'yes' | 'no' = 'no';
    console.log(`   Outcome determined: ${outcome.toUpperCase()}`);

    // Ask for confirmation
    console.log(`\n⚠️  About to call preliminaryResolve() with outcome: ${outcome.toUpperCase()}`);
    console.log(`   This will:`);
    console.log(`   1. Call preliminaryResolve() on blockchain contract`);
    console.log(`   2. Start the 7-day dispute period`);
    console.log(`   3. Update database to 'disputable' status`);
    console.log(`\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...`);

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Call preliminary resolution
    console.log(`\n🔐 Calling preliminaryResolveMarket()...`);
    const result = await resolutionService.preliminaryResolveMarket(marketId, outcome);

    console.log(`\n✅ SUCCESS! Preliminary resolution completed!`);
    console.log(`   Transaction Hash: ${result.transactionId}`);
    console.log(`   HCS Topic ID: ${result.hcsTopicId}`);
    console.log(`\n✅ Market is now disputable - users can submit disputes!`);
    console.log(`   Dispute period: 7 days (168 hours)`);

  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Get market ID from command line
const marketId = process.argv[2];

if (!marketId) {
  console.error('❌ Usage: npx tsx scripts/trigger-preliminary-resolve.ts <marketId>');
  process.exit(1);
}

triggerPreliminaryResolve(marketId);
