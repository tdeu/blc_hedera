// Setup script for existing Hedera topics and mock HTS tokens
// Use this when the main account is expired but we have existing topic IDs

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const existingTopics = {
  evidence: process.env.HCS_EVIDENCE_TOPIC || '0.0.6701034',
  attestations: process.env.HCS_AI_ATTESTATIONS_TOPIC || '0.0.6701057', 
  challenges: process.env.HCS_CHALLENGES_TOPIC || '0.0.6701064',
  userProfiles: process.env.HCS_USER_PROFILES_TOPIC || '0.0.6701065'
};

const mockTokens = {
  castToken: process.env.CONTRACT_CAST_TOKEN || '0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c',
  disputeBond: 'BCDB-MOCK-TOKEN', // Mock token for development
};

async function setupWithExistingResources() {
  console.log('🔄 Setting up Resolution System with Existing Resources');
  console.log('====================================================');
  
  try {
    // Setup HCS Topics in database
    console.log('\n📋 Setting up HCS Topics...');
    
    if (!supabase) {
      console.log('⚠️  Supabase not available - showing SQL commands to run manually');
      showManualSQL();
      return;
    }

    // Insert HCS topics
    const topicsToInsert = [
      {
        topic_id: existingTopics.evidence,
        topic_type: 'evidence',
        description: 'Community evidence submissions'
      },
      {
        topic_id: existingTopics.attestations,
        topic_type: 'attestation', 
        description: 'AI verification results'
      },
      {
        topic_id: existingTopics.challenges,
        topic_type: 'dispute',
        description: 'Community challenges to AI decisions'
      },
      {
        topic_id: existingTopics.userProfiles,
        topic_type: 'admin',
        description: 'User profile and admin messages'
      }
    ];

    for (const topic of topicsToInsert) {
      const { data, error } = await supabase
        .from('hcs_topics')
        .upsert(topic, { onConflict: 'topic_id' });
      
      if (error) {
        console.warn(`⚠️  Warning inserting topic ${topic.topic_id}:`, error.message);
      } else {
        console.log(`✅ Topic ${topic.topic_type}: ${topic.topic_id}`);
      }
    }

    // Setup HTS Tokens in database  
    console.log('\n💰 Setting up HTS Tokens...');
    
    const tokensToInsert = [
      {
        token_id: mockTokens.castToken,
        token_name: 'CastToken',
        token_symbol: 'CAST',
        token_type: 'fungible',
        purpose: 'betting',
        decimals: 18,
        total_supply: 1000000000,
        treasury_account: process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID
      },
      {
        token_id: mockTokens.disputeBond,
        token_name: 'BlockCast Dispute Bond',
        token_symbol: 'BCDB', 
        token_type: 'fungible',
        purpose: 'dispute_bond',
        decimals: 2,
        total_supply: 1000000,
        treasury_account: process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID
      }
    ];

    for (const token of tokensToInsert) {
      const { data, error } = await supabase
        .from('hts_tokens')
        .upsert(token, { onConflict: 'token_id' });
        
      if (error) {
        console.warn(`⚠️  Warning inserting token ${token.token_id}:`, error.message);
      } else {
        console.log(`✅ Token ${token.token_symbol}: ${token.token_id}`);
      }
    }

    // Insert default resolution settings
    console.log('\n⚙️  Setting up Resolution Settings...');
    
    const settingsToInsert = [
      {
        setting_key: 'dispute_period_hours',
        setting_value: 48,
        description: 'Default dispute period in hours'
      },
      {
        setting_key: 'min_bond_amounts',
        setting_value: {
          evidence: 100,
          interpretation: 250, 
          api_error: 500
        },
        description: 'Minimum bond amounts by dispute type'
      },
      {
        setting_key: 'confidence_thresholds',
        setting_value: {
          high: 0.9,
          medium: 0.7,
          low: 0.5
        },
        description: 'API confidence thresholds for auto-resolution'
      },
      {
        setting_key: 'bond_slashing_percentage',
        setting_value: 50,
        description: 'Percentage of bond slashed for invalid disputes'
      }
    ];

    for (const setting of settingsToInsert) {
      const { data, error } = await supabase
        .from('resolution_settings')
        .upsert(setting, { onConflict: 'setting_key' });
        
      if (error) {
        console.warn(`⚠️  Warning inserting setting ${setting.setting_key}:`, error.message);
      } else {
        console.log(`✅ Setting ${setting.setting_key}: configured`);
      }
    }

    console.log('\n🎉 Setup Complete!');
    console.log('\n📋 Summary:');
    console.log('================');
    console.log(`✅ Evidence Topic: ${existingTopics.evidence}`);
    console.log(`✅ AI Attestations Topic: ${existingTopics.attestations}`);
    console.log(`✅ Disputes Topic: ${existingTopics.challenges}`);
    console.log(`✅ Admin Topic: ${existingTopics.userProfiles}`);
    console.log(`✅ CAST Token: ${mockTokens.castToken}`);
    console.log(`✅ Dispute Bond Token: ${mockTokens.disputeBond}`);
    
    console.log('\n🔗 Verify Topics on HashScan:');
    console.log(`- Evidence: https://hashscan.io/testnet/topic/${existingTopics.evidence}`);
    console.log(`- Attestations: https://hashscan.io/testnet/topic/${existingTopics.attestations}`);
    console.log(`- Disputes: https://hashscan.io/testnet/topic/${existingTopics.challenges}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📝 Manual SQL Setup (run in Supabase SQL Editor):');
    showManualSQL();
  }
}

function showManualSQL() {
  console.log(`
-- HCS Topics Setup
INSERT INTO hcs_topics (topic_id, topic_type, description) VALUES
('${existingTopics.evidence}', 'evidence', 'Community evidence submissions'),
('${existingTopics.attestations}', 'attestation', 'AI verification results'),
('${existingTopics.challenges}', 'dispute', 'Community challenges to AI decisions'),
('${existingTopics.userProfiles}', 'admin', 'User profile and admin messages')
ON CONFLICT (topic_id) DO UPDATE SET
  description = EXCLUDED.description;

-- HTS Tokens Setup  
INSERT INTO hts_tokens (token_id, token_name, token_symbol, token_type, purpose, decimals, total_supply) VALUES
('${mockTokens.castToken}', 'CastToken', 'CAST', 'fungible', 'betting', 18, 1000000000),
('${mockTokens.disputeBond}', 'BlockCast Dispute Bond', 'BCDB', 'fungible', 'dispute_bond', 2, 1000000)
ON CONFLICT (token_id) DO UPDATE SET
  token_name = EXCLUDED.token_name;

-- Resolution Settings
INSERT INTO resolution_settings (setting_key, setting_value, description) VALUES
('dispute_period_hours', '48', 'Default dispute period in hours'),
('min_bond_amounts', '{"evidence": 100, "interpretation": 250, "api_error": 500}', 'Minimum bond amounts by dispute type'),
('confidence_thresholds', '{"high": 0.9, "medium": 0.7, "low": 0.5}', 'API confidence thresholds for auto-resolution'),
('bond_slashing_percentage', '50', 'Percentage of bond slashed for invalid disputes')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value;
`);
}

// Run setup
setupWithExistingResources().catch(console.error);