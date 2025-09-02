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
}