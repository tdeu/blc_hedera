import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkMarkets() {
  const { data, error } = await supabase
    .from('approved_markets')
    .select('*')
    .eq('status', 'PendingResolution')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== DISPUTABLE MARKETS ===\n');
  console.log('Available fields:', data && data.length > 0 ? Object.keys(data[0]) : 'none');
  console.log('');

  data?.forEach((market: any) => {
    const endTime = new Date(market.end_time);
    const createdAt = new Date(market.created_at);
    console.log('Market:', market.question);
    console.log('  Status:', market.status);
    console.log('  End Time:', endTime.toISOString());
    console.log('  Created At:', createdAt.toISOString());
    if (market.preliminary_outcome) console.log('  Preliminary Outcome:', market.preliminary_outcome);
    if (market.confidence_score) console.log('  Confidence Score:', market.confidence_score);
    console.log('');
  });

  console.log(`Total disputable markets: ${data?.length || 0}\n`);
}

checkMarkets();
