// Debug script to test evidence submission components
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugEvidenceSystem() {
  console.log('🔍 Debugging Evidence System...\n');

  // Test 1: Check database connection
  console.log('1. Testing database connection...');
  try {
    const { data, error } = await supabase.from('approved_markets').select('count', { count: 'exact' });
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    console.log('✅ Database connected successfully\n');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return;
  }

  // Test 2: Check if evidence_submissions table exists
  console.log('2. Checking evidence_submissions table...');
  try {
    const { data, error } = await supabase
      .from('evidence_submissions')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('❌ evidence_submissions table error:', error);
      console.log('📝 You may need to run the evidence-schema.sql file to create the table');
      return;
    }
    console.log('✅ evidence_submissions table exists\n');
  } catch (error) {
    console.error('❌ Error checking evidence_submissions table:', error);
    return;
  }

  // Test 3: Test inserting sample evidence
  console.log('3. Testing evidence insertion...');
  try {
    const testEvidence = {
      market_id: 'test-market-123',
      user_id: '0x1234567890123456789012345678901234567890',
      evidence_text: 'This is a test evidence submission with more than 20 characters',
      evidence_links: ['https://example.com/evidence'],
      submission_fee: 0.1,
      transaction_id: 'test-tx-' + Date.now(),
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('evidence_submissions')
      .insert(testEvidence)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Evidence insertion failed:', error);
      console.log('💡 This could be due to:');
      console.log('   - Table not existing');
      console.log('   - Column mismatch');
      console.log('   - Permission issues');
      return;
    }

    console.log('✅ Test evidence inserted successfully with ID:', data.id);

    // Clean up test data
    await supabase.from('evidence_submissions').delete().eq('id', data.id);
    console.log('🧹 Test data cleaned up\n');

  } catch (error) {
    console.error('❌ Error during evidence insertion test:', error);
    return;
  }

  // Test 4: Check environment variables
  console.log('4. Checking environment variables...');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_TREASURY_ADDRESS'
  ];

  let missingVars = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    console.log('📝 Please check your .env file');
    return;
  }
  console.log('✅ All required environment variables present\n');

  console.log('🎉 All tests passed! The evidence system should be working.');
  console.log('💡 If you\'re still getting errors, please check the browser console for more details.');
}

// Run the debug
debugEvidenceSystem().catch(console.error);