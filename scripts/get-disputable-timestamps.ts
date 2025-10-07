import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const PREDICTION_MARKET_ABI = [
  "function marketInfo() view returns (bytes32 id, string question, address creator, uint256 endTime, uint8 status)",
  "function preliminaryResolveTime() view returns (uint256)",
  "function preliminaryOutcome() view returns (uint8)",
  "function isPendingResolution() view returns (bool)"
];

async function checkMarkets() {
  // Get all markets from database
  const { data, error } = await supabase
    .from('approved_markets')
    .select('*')
    .not('contract_address', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const provider = new ethers.JsonRpcProvider(process.env.VITE_HEDERA_RPC_URL);

  console.log('\n=== CHECKING MARKETS FOR DISPUTABLE STATUS ===\n');

  for (const market of data || []) {
    try {
      const contract = new ethers.Contract(market.contract_address, PREDICTION_MARKET_ABI, provider);

      const [marketInfo, isPending, prelimTime] = await Promise.all([
        contract.marketInfo(),
        contract.isPendingResolution(),
        contract.preliminaryResolveTime()
      ]);

      if (isPending) {
        const prelimDate = new Date(Number(prelimTime) * 1000);
        const endDate = new Date(Number(marketInfo.endTime) * 1000);

        console.log('🔍 DISPUTABLE MARKET FOUND:');
        console.log('  Question:', market.question);
        console.log('  Contract:', market.contract_address);
        console.log('  End Time:', endDate.toLocaleString('en-US', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        }));
        console.log('  Became Disputable:', prelimDate.toLocaleString('en-US', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        }));
        console.log('  ISO Format:', prelimDate.toISOString());
        console.log('');
      }
    } catch (err) {
      // Skip markets that error (might not be deployed or old contracts)
    }
  }
}

checkMarkets().catch(console.error);
