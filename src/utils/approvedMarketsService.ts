import { supabase, ApprovedMarket } from './supabase';
import { BettingMarket } from '../components/BettingMarkets';

class ApprovedMarketsService {
  /**
   * Store an approved market in Supabase
   */
  async storeApprovedMarket(
    market: BettingMarket, 
    approvedBy: string, 
    submitterAddress: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Skip if Supabase is not configured
      if (!supabase) {
        console.warn('⚠️ Supabase not configured, skipping storage');
        return false;
      }
      const approvedMarket: Omit<ApprovedMarket, 'created_at' | 'approved_at'> = {
        id: market.id,
        claim: market.claim,
        description: market.description,
        category: market.category,
        country: market.country,
        region: market.region,
        market_type: market.marketType,
        confidence_level: market.confidenceLevel,
        expires_at: market.expiresAt.toISOString(),
        approved_by: approvedBy,
        approval_reason: reason,
        submitter_address: submitterAddress
      };

      const { error } = await supabase
        .from('approved_markets')
        .insert([approvedMarket]);

      if (error) {
        console.error('Error storing approved market:', error);
        return false;
      }

      console.log(`✅ Market stored in Supabase: ${market.claim}`);
      return true;
    } catch (error) {
      console.error('Error in storeApprovedMarket:', error);
      return false;
    }
  }

  /**
   * Get all approved markets from Supabase
   */
  async getApprovedMarkets(): Promise<BettingMarket[]> {
    try {
      // Skip if Supabase is not configured
      if (!supabase) {
        console.warn('⚠️ Supabase not configured, returning empty array');
        return [];
      }
      const { data, error } = await supabase
        .from('approved_markets')
        .select('*')
        .order('approved_at', { ascending: false });

      if (error) {
        console.error('Error fetching approved markets:', error);
        return [];
      }

      if (!data) return [];

      // Convert Supabase data back to BettingMarket format
      return data.map(this.convertToBettingMarket);
    } catch (error) {
      console.error('Error in getApprovedMarkets:', error);
      return [];
    }
  }

  /**
   * Get approved markets by category
   */
  async getApprovedMarketsByCategory(category: string): Promise<BettingMarket[]> {
    try {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('approved_markets')
        .select('*')
        .eq('category', category)
        .order('approved_at', { ascending: false });

      if (error) {
        console.error('Error fetching markets by category:', error);
        return [];
      }

      if (!data) return [];

      return data.map(this.convertToBettingMarket);
    } catch (error) {
      console.error('Error in getApprovedMarketsByCategory:', error);
      return [];
    }
  }

  /**
   * Get approved markets by admin
   */
  async getMarketsApprovedBy(adminAddress: string): Promise<BettingMarket[]> {
    try {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('approved_markets')
        .select('*')
        .eq('approved_by', adminAddress.toLowerCase())
        .order('approved_at', { ascending: false });

      if (error) {
        console.error('Error fetching markets by admin:', error);
        return [];
      }

      if (!data) return [];

      return data.map(this.convertToBettingMarket);
    } catch (error) {
      console.error('Error in getMarketsApprovedBy:', error);
      return [];
    }
  }

  /**
   * Check if a market is already approved
   */
  async isMarketApproved(marketId: string): Promise<boolean> {
    try {
      if (!supabase) return false;
      const { data, error } = await supabase
        .from('approved_markets')
        .select('id')
        .eq('id', marketId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking market approval:', error);
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Error in isMarketApproved:', error);
      return false;
    }
  }

  /**
   * Get statistics about approved markets
   */
  async getStats() {
    try {
      if (!supabase) return { total: 0 };
      const { count, error } = await supabase
        .from('approved_markets')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting approved markets stats:', error);
        return { total: 0 };
      }

      return { total: count || 0 };
    } catch (error) {
      console.error('Error in getStats:', error);
      return { total: 0 };
    }
  }

  /**
   * Convert Supabase ApprovedMarket to BettingMarket format
   */
  private convertToBettingMarket(approvedMarket: ApprovedMarket): BettingMarket {
    return {
      id: approvedMarket.id,
      claim: approvedMarket.claim,
      description: approvedMarket.description,
      category: approvedMarket.category,
      country: approvedMarket.country,
      region: approvedMarket.region,
      marketType: approvedMarket.market_type,
      confidenceLevel: approvedMarket.confidence_level,
      expiresAt: new Date(approvedMarket.expires_at),
      status: 'active' as const, // All approved markets are active
      yesPrice: 0.45, // Default values - these would normally come from blockchain
      noPrice: 0.55,
      volume: 0,
      participants: 0
    };
  }
}

// Export singleton instance
export const approvedMarketsService = new ApprovedMarketsService();