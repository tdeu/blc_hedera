import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error('Missing Supabase env vars');
  }

  const idArg = process.argv.indexOf('--id');
  if (idArg === -1 || !process.argv[idArg + 1]) {
    console.log('Usage: node scripts/force-resolve-test-market.js --id <marketId>');
    process.exit(1);
  }
  const marketId = process.argv[idArg + 1];

  const supabase = createClient(supabaseUrl, supabaseAnon);

  // Set expires_at to 2 minutes in the past so the monitor picks it up
  const expiresAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('approved_markets')
    .update({ expires_at: expiresAt, status: 'active' })
    .eq('id', marketId);

  if (error) {
    console.error('Failed to update market expiry:', error);
    process.exit(1);
  }

  console.log('✅ Market expiry forced to past, monitor should resolve it on next cycle');
  console.log('You can trigger one tick with: curl -X POST http://localhost:3002/run-once');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
