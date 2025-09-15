import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Only create client if both URL and key are available
export const supabase = (supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface ApprovedMarket {
  id: string;
  claim: string;
  description?: string;
  category: string;
  country: string;
  region: string;
  market_type: string;
  confidence_level: string;
  expires_at: string;
  created_at: string;
  approved_at: string;
  approved_by: string;
  approval_reason?: string;
  submitter_address: string;
  contract_address?: string;
  // New resolution fields
  status?: 'active' | 'pending_resolution' | 'disputing' | 'resolved' | 'disputed_resolution' | 'locked';
  resolution_data?: any;
  dispute_count?: number;
  dispute_period_end?: string;
}

export interface MarketResolution {
  id: string;
  market_id: string;
  outcome?: 'yes' | 'no';
  source: string;
  api_data?: any;
  confidence?: 'high' | 'medium' | 'low';
  timestamp: string;
  dispute_period_end: string;
  final_outcome?: 'yes' | 'no';
  resolved_by?: 'api' | 'admin' | 'contract';
  admin_notes?: string;
  // Hedera fields
  hcs_topic_id?: string;
  hts_token_id?: string;
  contract_id?: string;
  transaction_id?: string;
  consensus_timestamp?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketDispute {
  id: string;
  market_id: string;
  resolution_id?: string;
  user_id: string;
  dispute_reason: string;
  evidence_url?: string;
  evidence_description?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'contract_processing';
  admin_response?: string;
  // Hedera fields
  bond_amount?: number;
  bond_transaction_id?: string;
  hcs_message_id?: string;
  arbitration_contract_id?: string;
  bond_refund_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface HCSTopic {
  id: string;
  topic_id: string;
  topic_type: 'resolution' | 'dispute' | 'admin' | 'evidence' | 'attestation';
  description?: string;
  admin_key?: string;
  submit_key?: string;
  created_at: string;
}

export interface HTSToken {
  id: string;
  token_id: string;
  token_name: string;
  token_symbol: string;
  token_type: 'fungible' | 'non_fungible';
  purpose: 'dispute_bond' | 'governance' | 'reward' | 'betting';
  decimals: number;
  total_supply?: number;
  treasury_account?: string;
  created_at: string;
}

export interface APIIntegrationLog {
  id: string;
  market_id?: string;
  api_source: string;
  request_data?: any;
  response_data?: any;
  success: boolean;
  error_message?: string;
  response_time_ms?: number;
  hcs_log_message_id?: string;
  created_at: string;
}

export interface ResolutionSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_by?: string;
  updated_at: string;
}