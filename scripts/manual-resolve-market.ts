/**
 * Manual Market Resolution Script
 *
 * Use this to manually trigger AI resolution + blockchain preliminaryResolve for a specific market
 *
 * Usage:
 *   npx tsx scripts/manual-resolve-market.ts <market-id> <outcome>
 *
 * Example:
 *   npx tsx scripts/manual-resolve-market.ts market_1234567890_abc yes
 */

import { createClient } from '@supabase/supabase-js';
import { resolutionService } from '../src/utils/resolutionService';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function manualResolveMarket(marketId: string, outcome: 'yes' | 'no') {
  console.log(`\n🔧 MANUAL MARKET RESOLUTION`);
  console.log(`=`.repeat(80));
  console.log(`Market ID: ${marketId}`);
  console.log(`Outcome: ${outcome.toUpperCase()}`);
  console.log(`=`.repeat(80));

  try {
    // 1. Fetch market from database
    console.log(`\n📋 Step 1: Fetching market from database...`);
    const { data: market, error: fetchError } = await supabase
      .from('approved_markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (fetchError || !market) {
      throw new Error(`Market not found: ${marketId}`);
    }

    console.log(`✅ Market found:`);
    console.log(`   Claim: ${market.claim}`);
    console.log(`   Status: ${market.status}`);
    console.log(`   Contract: ${market.contract_address}`);
    console.log(`   Expired: ${market.expires_at}`);

    // 2. Check if market needs resolution
    if (market.resolution_data) {
      console.log(`\n⚠️  Market already has resolution_data:`, JSON.parse(market.resolution_data));
      console.log(`   This might mean AI resolution already ran`);
    }

    if (market.status !== 'disputable') {
      console.log(`\n⚠️  Market status is "${market.status}", expected "disputable"`);
      console.log(`   This might cause issues...`);
    }

    // 3. Call preliminary resolution
    console.log(`\n🤖 Step 2: Calling preliminaryResolveMarket()...`);
    console.log(`   This will:`);
    console.log(`   - Call blockchain contract.preliminaryResolve(${outcome === 'yes' ? 1 : 2})`);
    console.log(`   - Set contract status to PendingResolution (2)`);
    console.log(`   - Update database with resolution_data`);
    console.log(`   - Start 7-day dispute period`);

    const result = await resolutionService.preliminaryResolveMarket(marketId, outcome);

    console.log(`\n✅ SUCCESS! Preliminary resolution complete:`);
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   HCS Topic ID: ${result.hcsTopicId}`);
    console.log(`\n📊 Next steps:`);
    console.log(`   1. Market is now in PendingResolution state on blockchain`);
    console.log(`   2. Users can submit evidence to dispute for 7 days`);
    console.log(`   3. After 7 days, call finalResolveMarket() to complete resolution`);
    console.log(`\n🎯 You can now test submitting evidence/disputes!`);

  } catch (error: any) {
    console.error(`\n❌ ERROR:`, error.message);
    console.error(`\nFull error:`, error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(`\n❌ Usage: npx tsx scripts/manual-resolve-market.ts <market-id> <yes|no>`);
  console.error(`\nExample: npx tsx scripts/manual-resolve-market.ts market_1234567890_abc yes`);
  process.exit(1);
}

const [marketId, outcomeStr] = args;
const outcome = outcomeStr.toLowerCase();

if (outcome !== 'yes' && outcome !== 'no') {
  console.error(`\n❌ Outcome must be "yes" or "no", got: "${outcomeStr}"`);
  process.exit(1);
}

manualResolveMarket(marketId, outcome as 'yes' | 'no');
