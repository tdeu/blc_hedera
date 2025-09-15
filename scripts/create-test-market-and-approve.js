import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ override: true });

async function main() {
  const rpcUrl = process.env.JSON_RPC_URL || 'https://testnet.hashio.io/api';
  const pk = process.env.HEDERA_PRIVATE_KEY;
  const factoryAddress = process.env.CONTRACT_PREDICTION_MARKET_FACTORY;
  if (!pk || !factoryAddress) {
    throw new Error('Missing HEDERA_PRIVATE_KEY or CONTRACT_PREDICTION_MARKET_FACTORY in .env');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);

  // Load factory ABI from artifacts
  const artifactPath = './artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json';
  console.log('Using FACTORY address from env:', factoryAddress);
  const factoryArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet);

  const now = Math.floor(Date.now() / 1000);
  const endTime = now + 90; // 90 seconds in the future
  const claim = `Test Auto-Resolve Market ${new Date().toISOString()}`;

  console.log('Creating market:', { claim, endTime });
  const tx = await factory.createMarket(claim, endTime, { gasLimit: 5_000_000 });
  console.log('Tx sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Tx confirmed:', receipt.hash);

  // Parse MarketCreated event
  let marketIdHex = null;
  let marketAddress = null;
  for (const log of receipt.logs || []) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === 'MarketCreated') {
        marketIdHex = parsed.args?.id;
        marketAddress = parsed.args?.market;
        break;
      }
    } catch {}
  }

  if (!marketIdHex || !marketAddress) {
    throw new Error('Failed to parse MarketCreated event');
  }

  console.log('MarketCreated:', { marketIdHex: String(marketIdHex), marketAddress });

  // Persist to Supabase approved_markets
  const supabase = createClient(supabaseUrl, supabaseAnon);

  const approvedRow = {
    id: String(marketIdHex),
    claim,
    description: 'Auto-generated test market for resolution pipeline',
    category: 'Test',
    country: 'N/A',
    region: 'N/A',
    market_type: 'binary',
    confidence_level: 'medium',
    expires_at: new Date(endTime * 1000).toISOString(),
    approved_by: wallet.address,
    approval_reason: 'Automated test market',
    submitter_address: wallet.address,
    status: 'active',
    contract_address: marketAddress
  };

  console.log('Upserting approved_markets row...');
  const { data, error } = await supabase
    .from('approved_markets')
    .upsert([approvedRow], { onConflict: 'id' })
    .select('*');

  if (error) {
    console.error('Supabase upsert error:', error);
    process.exit(1);
  }

  console.log('✅ Supabase approved_markets upserted:', data?.[0]?.id);
  console.log('\nNext steps:');
  console.log('- Run the monitor or hit /run-once to resolve when expired.');
  console.log('- Use: node scripts/force-resolve-test-market.js --id', String(marketIdHex));

  console.log('\nDONE');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
