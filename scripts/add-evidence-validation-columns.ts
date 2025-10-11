/**
 * Migration script to add admin validation columns to evidence_submissions table
 *
 * Adds:
 * - admin_validated_legitimate: boolean - Is the evidence credible and factually accurate?
 * - admin_validated_against_community: boolean - Does evidence challenge market consensus?
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Adding evidence validation columns...\n');

  // Note: Supabase doesn't support direct ALTER TABLE via the JS client
  // You need to run this SQL in the Supabase SQL Editor:

  const sql = `
-- Add admin validation columns and stance to evidence_submissions table
ALTER TABLE evidence_submissions
ADD COLUMN IF NOT EXISTS admin_validated_legitimate BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_validated_against_community BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stance VARCHAR CHECK (stance IN ('supporting', 'disputing', 'neutral', 'supporting_yes', 'supporting_no')) DEFAULT NULL;

-- Add helpful comments
COMMENT ON COLUMN evidence_submissions.admin_validated_legitimate IS
  'Admin validation: Is this evidence from a credible source and factually accurate?';

COMMENT ON COLUMN evidence_submissions.admin_validated_against_community IS
  'Admin validation: Does this evidence go against what the prediction market consensus suggests?';

COMMENT ON COLUMN evidence_submissions.stance IS
  'What outcome does this evidence support? supporting_yes = supports YES outcome, supporting_no = supports NO outcome';

-- Create index for filtering by validation status
CREATE INDEX IF NOT EXISTS idx_evidence_admin_validated
ON evidence_submissions(admin_validated_legitimate, admin_validated_against_community);

-- Create index for stance filtering
CREATE INDEX IF NOT EXISTS idx_evidence_stance
ON evidence_submissions(stance);
`;

  console.log('📋 SQL to run in Supabase SQL Editor:\n');
  console.log('=' .repeat(80));
  console.log(sql);
  console.log('=' .repeat(80));
  console.log('\n✅ Copy the SQL above and run it in Supabase Dashboard > SQL Editor\n');

  // Test that we can query the table
  console.log('🔍 Testing evidence_submissions table access...');
  const { data, error } = await supabase
    .from('evidence_submissions')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing evidence_submissions:', error.message);
  } else {
    console.log(`✅ Successfully accessed evidence_submissions table (found ${data?.length || 0} records)`);
  }

  console.log('\n📝 After running the SQL migration:');
  console.log('   1. Evidence will have two new admin validation toggles');
  console.log('   2. Legitimate + Against Community evidence gets 3x weight in confidence calculation');
  console.log('   3. Final confidence uses: 50% Market Odds, 20% Evidence, 30% External API\n');
}

main().catch(console.error);
