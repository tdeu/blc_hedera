import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ override: true });

async function main() {
  const rpcUrl = process.env.JSON_RPC_URL || 'https://testnet.hashio.io/api';
  const pk = process.env.HEDERA_PRIVATE_KEY;
  if (!pk) throw new Error('HEDERA_PRIVATE_KEY missing');

  const addresses = {
    adminManager: process.env.CONTRACT_ADMIN_MANAGER,
    treasury: process.env.CONTRACT_TREASURY,
    collateral: process.env.CONTRACT_CAST_TOKEN,
    betNFT: process.env.CONTRACT_BET_NFT,
  };
  for (const [k, v] of Object.entries(addresses)) {
    if (!v) throw new Error(`Missing ${k} in .env`);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(pk, provider);

  const question = `Single Market ${new Date().toISOString()}`;
  const endTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
  const id = ethers.solidityPackedKeccak256(['string', 'uint256', 'address'], [question, Date.now(), signer.address]);

  const artifactPath = './artifacts/contracts/PredictionMarket.sol/PredictionMarket.json';
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  console.log('Deploying single PredictionMarket with:', { id, question, endTime, ...addresses });
  const market = await factory.deploy(
    id,
    question,
    signer.address,
    endTime,
    addresses.collateral,
    addresses.adminManager,
    addresses.treasury,
    addresses.betNFT,
    200 // protocolFeeRate (2%)
  );
  const receipt = await market.deploymentTransaction().wait();
  const marketAddress = await market.getAddress();
  console.log('✅ Market deployed at:', marketAddress, 'tx:', receipt.hash);

  // Upsert into Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase env missing');
  const supabase = createClient(supabaseUrl, supabaseAnon);

  const expiresAt = new Date(endTime * 1000).toISOString();
  const row = {
    id,
    claim: question,
    description: 'Deployed directly for test',
    category: 'Test',
    country: 'N/A',
    region: 'N/A',
    market_type: 'binary',
    confidence_level: 'medium',
    expires_at: expiresAt,
    approved_by: signer.address,
    approval_reason: 'Direct deploy test',
    submitter_address: signer.address,
    status: 'active',
    contract_address: marketAddress
  };

  const { error } = await supabase.from('approved_markets').upsert([row], { onConflict: 'id' });
  if (error) throw error;
  console.log('✅ Upserted market into approved_markets with id:', id);

  console.log('\nNext: to force resolution, run:\n  npm run force:resolve -- --id', id);
}

main().catch((e) => { console.error('Failed:', e); process.exit(1); });
