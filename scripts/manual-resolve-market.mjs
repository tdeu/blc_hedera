/**
 * Manual Market Resolution Script
 */

import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM;
const RPC_URL = 'https://testnet.hashio.io/api';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MARKET_ABI = [
  "function preliminaryResolve(uint8 outcome) external",
  "function isPendingResolution() external view returns (bool)"
];

async function manualResolveMarket(marketId, outcome) {
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

    // 2. Setup blockchain connection
    console.log(`\n⚙️  Step 2: Setting up blockchain connection...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const marketContract = new ethers.Contract(market.contract_address, MARKET_ABI, wallet);

    console.log(`✅ Connected with admin wallet: ${wallet.address}`);

    // 3. Check current contract status
    console.log(`\n🔍 Step 3: Checking current blockchain status...`);
    const isPendingBefore = await marketContract.isPendingResolution();
    console.log(`   isPendingResolution (before): ${isPendingBefore}`);

    if (isPendingBefore) {
      console.log(`   ⚠️  Market is already in PendingResolution state!`);
      console.log(`   You should be able to submit disputes now.`);
      return;
    }

    // 4. Call preliminaryResolve
    console.log(`\n🚀 Step 4: Calling blockchain preliminaryResolve()...`);
    const outcomeValue = outcome === 'yes' ? 1 : 2;
    console.log(`   Outcome value: ${outcomeValue} (1=Yes, 2=No)`);

    const tx = await marketContract.preliminaryResolve(outcomeValue);
    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed! Block: ${receipt.blockNumber}`);

    // 5. Verify new status
    console.log(`\n✅ Step 5: Verifying new status...`);
    const isPendingAfter = await marketContract.isPendingResolution();
    console.log(`   isPendingResolution (after): ${isPendingAfter}`);

    if (isPendingAfter) {
      console.log(`   ✅ SUCCESS! Contract is now in PendingResolution state!`);
    } else {
      console.log(`   ⚠️  WARNING: isPendingResolution is still false`);
    }

    // 6. Update database
    console.log(`\n💾 Step 6: Updating database...`);
    const resolutionData = {
      outcome,
      method: 'manual_admin',
      timestamp: new Date().toISOString(),
      transactionHash: tx.hash
    };

    await supabase
      .from('approved_markets')
      .update({
        resolution_data: JSON.stringify(resolutionData),
        preliminary_resolution_tx: tx.hash
      })
      .eq('id', marketId);

    console.log(`   ✅ Database updated`);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 RESOLUTION COMPLETE!`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📊 Next steps:`);
    console.log(`   1. Refresh your UI`);
    console.log(`   2. Try submitting evidence/dispute - it should work now!`);
    console.log(`   3. Market will remain disputable for 7 days`);
    console.log(``);

  } catch (error) {
    console.error(`\n❌ ERROR:`, error.message);
    if (error.data) {
      console.error(`   Error data:`, error.data);
    }
    console.error(`\nFull error:`, error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(`\n❌ Usage: node scripts/manual-resolve-market.mjs <market-id> <yes|no>`);
  console.error(`\nExample: node scripts/manual-resolve-market.mjs market_1234567890_abc yes`);
  process.exit(1);
}

const [marketId, outcomeStr] = args;
const outcome = outcomeStr.toLowerCase();

if (outcome !== 'yes' && outcome !== 'no') {
  console.error(`\n❌ Outcome must be "yes" or "no", got: "${outcomeStr}"`);
  process.exit(1);
}

manualResolveMarket(marketId, outcome);
