import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const contractAddress = process.argv[2] || '0x26A54834f7fA298128D426343a143050CEE3951e';

const { data, error } = await supabase
  .from('approved_markets')
  .select('id, claim, status, resolution_data')
  .eq('contract_address', contractAddress)
  .single();

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('\n📋 Market Found:');
console.log('   ID:', data.id);
console.log('   Claim:', data.claim);
console.log('   Status:', data.status);
console.log('   Has resolution_data:', data.resolution_data ? 'YES' : 'NO');
console.log('');
