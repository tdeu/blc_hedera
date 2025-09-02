import { ethers } from 'ethers';
import { pendingMarketsService } from './pendingMarketsService';
import { approvedMarketsService } from './approvedMarketsService';

// Admin wallet addresses - Whitelisted EVM addresses (for MetaMask compatibility)
export const ADMIN_ADDRESSES = [
  '0xfd76d4c18d5a10f558d057743bfb0218130157f4', // Super Admin (You)
  '0x02dd61aa2ab7d0bf5d03239527c8ca245a26dabd', // Admin #2
  '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD', // Your current connected address
  '0x947d2175ad83ae42c59cfef2990e6cccf2b27213', // Super Admin #2
  '0xC8130178a046eD25b4b248eE511F3846717b2b06', // Super Admin #3
];

// Super admin address (primary admin with full privileges) - EVM format
export const SUPER_ADMIN_ADDRESS = '0xfd76d4c18d5a10f558d057743bfb0218130157f4';

export interface AdminStats {
  totalMarkets: number;
  pendingMarkets: number;
  totalUsers: number;
  totalVolume: string;
  flaggedContent: number;
  activeDisputes: number;
}

export interface PendingMarket {
  id: string;
  question: string;
  creator: string;
  createdAt: Date;
  category: string;
  endTime: Date;
  description?: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface AdminAction {
  id: string;
  type: 'market_approval' | 'market_rejection' | 'user_ban' | 'content_moderation';
  adminAddress: string;
  targetId: string;
  reason?: string;
  timestamp: Date;
}

class AdminService {
  private adminActionsCache: AdminAction[] = [];
  private marketApprovalCallback?: (market: any) => void;

  /**
   * Set callback for when markets are approved
   */
  setMarketApprovalCallback(callback: (market: any) => void) {
    this.marketApprovalCallback = callback;
  }

  /**
   * Check if wallet address is an admin (supports both Hedera Account IDs and EVM addresses)
   */
  isAdmin(walletAddress: string): boolean {
    if (!walletAddress) return false;
    
    // Handle both Hedera Account IDs (0.0.xxxx) and EVM addresses (0x...)
    const normalizedAddress = walletAddress.trim();
    
    // Check against whitelisted admin addresses
    const isInAdminList = ADMIN_ADDRESSES.some(addr => 
      addr.toLowerCase() === normalizedAddress.toLowerCase()
    );
    
    const isSuper = this.isSuperAdmin(normalizedAddress);
    
    return isInAdminList || isSuper;
  }

  /**
   * Check if wallet address is the super admin
   */
  isSuperAdmin(walletAddress: string): boolean {
    if (!walletAddress) return false;
    return SUPER_ADMIN_ADDRESS.toLowerCase() === walletAddress.trim().toLowerCase();
  }

  /**
   * Get admin role for display purposes
   */
  getAdminRole(walletAddress: string): 'super_admin' | 'admin' | 'user' {
    if (!walletAddress) return 'user';
    
    if (this.isSuperAdmin(walletAddress)) {
      return 'super_admin';
    } else if (this.isAdmin(walletAddress)) {
      return 'admin';
    } else {
      return 'user';
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const pendingStats = pendingMarketsService.getStats();
      
      return {
        totalMarkets: pendingStats.totalSubmitted,
        pendingMarkets: pendingStats.pending,
        totalUsers: 2847, // TODO: Replace with real user count
        totalVolume: '145.67', // TODO: Replace with real volume data
        flaggedContent: 3, // TODO: Replace with real flagged content count
        activeDisputes: 1 // TODO: Replace with real dispute count
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  /**
   * Get markets pending approval
   */
  async getPendingMarkets(): Promise<PendingMarket[]> {
    try {
      const pendingSubmissions = pendingMarketsService.getActivePendingMarkets();
      
      return pendingSubmissions.map(submission => 
        pendingMarketsService.toPendingMarketFormat(submission)
      );
    } catch (error) {
      console.error('Error fetching pending markets:', error);
      return [];
    }
  }

  /**
   * Approve a market
   */
  async approveMarket(marketId: string, adminAddress: string, reason?: string): Promise<boolean> {
    try {
      console.log(`Admin ${adminAddress} approving market ${marketId}`);
      
      // Approve market in pending markets service
      const approvedMarket = pendingMarketsService.approveMarket(marketId, adminAddress, reason);
      
      if (!approvedMarket) {
        return false;
      }

      // Get original submission to find submitter address
      const pendingMarkets = pendingMarketsService.getPendingMarkets();
      const originalSubmission = pendingMarkets.find(m => m.id === marketId);
      const submitterAddress = originalSubmission?.submittedBy || 'unknown';
      
      // Store approved market in Supabase for permanent storage
      const supabaseSuccess = await approvedMarketsService.storeApprovedMarket(
        approvedMarket,
        adminAddress,
        submitterAddress,
        reason
      );

      if (!supabaseSuccess) {
        console.warn('⚠️ Market approved locally but failed to store in Supabase');
        // Continue anyway - we can retry later
      }
      
      // Record admin action
      const action: AdminAction = {
        id: `action-${Date.now()}`,
        type: 'market_approval',
        adminAddress,
        targetId: marketId,
        reason,
        timestamp: new Date()
      };
      
      this.adminActionsCache.push(action);

      // Trigger callback to add market to homepage immediately
      if (this.marketApprovalCallback && approvedMarket) {
        this.marketApprovalCallback(approvedMarket);
      }

      // TODO: In full implementation:
      // 1. Call smart contract to change market status from 0 (Submitted) to 1 (Open)
      // 2. Record action in HCS
      // 3. Send notification to market creator

      return true;
    } catch (error) {
      console.error('Error approving market:', error);
      return false;
    }
  }

  /**
   * Reject a market
   */
  async rejectMarket(marketId: string, adminAddress: string, reason: string): Promise<boolean> {
    try {
      console.log(`Admin ${adminAddress} rejecting market ${marketId} - Reason: ${reason}`);
      
      // Reject market in pending markets service
      const rejected = pendingMarketsService.rejectMarket(marketId, adminAddress, reason);
      
      if (!rejected) {
        return false;
      }
      
      // Record admin action
      const action: AdminAction = {
        id: `action-${Date.now()}`,
        type: 'market_rejection',
        adminAddress,
        targetId: marketId,
        reason,
        timestamp: new Date()
      };
      
      this.adminActionsCache.push(action);

      // TODO: In full implementation:
      // 1. Call smart contract to change market status to canceled/rejected
      // 2. Record action in HCS
      // 3. Send notification to market creator with reason
      // 4. Potentially refund any fees

      return true;
    } catch (error) {
      console.error('Error rejecting market:', error);
      return false;
    }
  }

  /**
   * Get recent admin actions
   */
  async getRecentAdminActions(limit: number = 50): Promise<AdminAction[]> {
    try {
      // In real implementation, query HCS for admin actions
      return this.adminActionsCache
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching admin actions:', error);
      return [];
    }
  }

  /**
   * Ban a user (for serious violations)
   */
  async banUser(userAddress: string, adminAddress: string, reason: string, duration?: number): Promise<boolean> {
    try {
      console.log(`Admin ${adminAddress} banning user ${userAddress} - Reason: ${reason}`);
      
      const action: AdminAction = {
        id: `action-${Date.now()}`,
        type: 'user_ban',
        adminAddress,
        targetId: userAddress,
        reason,
        timestamp: new Date()
      };
      
      this.adminActionsCache.push(action);

      // In real implementation:
      // 1. Add user to blacklist in smart contract
      // 2. Record ban in HCS
      // 3. Prevent user from creating markets or placing bets

      return true;
    } catch (error) {
      console.error('Error banning user:', error);
      return false;
    }
  }

  /**
   * Get market analytics for admin review
   */
  async getMarketAnalytics(marketId: string) {
    try {
      // Mock analytics - in real implementation, analyze on-chain data
      return {
        totalVolume: '12.5 HBAR',
        uniqueParticipants: 47,
        yesVotes: 28,
        noVotes: 19,
        flaggedByUsers: 0,
        aiConfidence: 0.85,
        riskScore: 'Low'
      };
    } catch (error) {
      console.error('Error fetching market analytics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();