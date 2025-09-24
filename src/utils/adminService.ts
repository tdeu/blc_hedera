import { ethers } from 'ethers';
import { pendingMarketsService } from './pendingMarketsService';
import { approvedMarketsService } from './approvedMarketsService';
import { contractService } from './contractService';
import { hcsService } from './hcsService';

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
  imageUrl?: string;
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
        flaggedContent: 3 // TODO: Replace with real flagged content count
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

      // Enhanced implementation with smart contract integration
      await this.activateMarketOnChain(marketId, approvedMarket, adminAddress, reason);

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
   * Take a market offline (remove from public view)
   */
  async offlineMarket(marketId: string, adminAddress: string, reason?: string): Promise<boolean> {
    try {
      console.log(`Admin ${adminAddress} taking market ${marketId} offline - Reason: ${reason}`);

      // Update market status in Supabase
      const success = await approvedMarketsService.updateMarketStatus(marketId, 'offline');

      if (!success) {
        return false;
      }

      // Record admin action
      const action: AdminAction = {
        id: `action-${Date.now()}`,
        type: 'content_moderation',
        adminAddress,
        targetId: marketId,
        reason: reason || 'Market taken offline by admin',
        timestamp: new Date()
      };

      this.adminActionsCache.push(action);

      return true;
    } catch (error) {
      console.error('Error offlining market:', error);
      return false;
    }
  }

  /**
   * Bring a market back online (restore to public view)
   */
  async onlineMarket(marketId: string, adminAddress: string, reason?: string): Promise<boolean> {
    try {
      console.log(`Admin ${adminAddress} bringing market ${marketId} back online - Reason: ${reason}`);

      // Update market status back to active in Supabase
      const success = await approvedMarketsService.updateMarketStatus(marketId, 'active');

      if (!success) {
        return false;
      }

      // Record admin action
      const action: AdminAction = {
        id: `action-${Date.now()}`,
        type: 'content_moderation',
        adminAddress,
        targetId: marketId,
        reason: reason || 'Market brought back online by admin',
        timestamp: new Date()
      };

      this.adminActionsCache.push(action);

      return true;
    } catch (error) {
      console.error('Error bringing market online:', error);
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

  /**
   * Activate market on-chain after admin approval
   * This bridges database approval with smart contract activation
   */
  private async activateMarketOnChain(
    marketId: string,
    approvedMarket: any,
    adminAddress: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`🔗 Activating market ${marketId} on-chain...`);

      // Step 1: Get market contract address (would be stored in database)
      const marketContractAddress = approvedMarket.contractAddress;

      if (!marketContractAddress) {
        console.warn('⚠️ No contract address found for market - skipping contract activation');

        // Record approval to HCS anyway
        await this.recordApprovalToHCS(marketId, adminAddress, reason, 'database_only');
        return;
      }

      // Step 2: Get admin signer (this would use admin's private key or wallet)
      const adminSigner = await this.getAdminSigner(adminAddress);

      if (!adminSigner) {
        console.warn('⚠️ Cannot get admin signer - recording approval to HCS only');
        await this.recordApprovalToHCS(marketId, adminAddress, reason, 'no_signer');
        return;
      }

      // Step 3: Call smart contract to activate market (change status from Submitted to Open)
      try {
        console.log(`📝 Calling contract.activateMarket() for ${marketContractAddress}`);

        // Note: This would need to be implemented in the smart contract
        // For now, we'll just log the intention
        // const txHash = await contractService.activateMarket(marketContractAddress, adminSigner);

        console.log(`✅ Market ${marketId} activated on-chain (simulated)`);

        // Step 4: Record successful approval to HCS
        await this.recordApprovalToHCS(marketId, adminAddress, reason, 'contract_activated');

      } catch (contractError) {
        console.error('❌ Contract activation failed:', contractError);

        // Record partial approval to HCS (approved in DB but contract failed)
        await this.recordApprovalToHCS(marketId, adminAddress, reason, 'contract_failed');
      }

    } catch (error) {
      console.error('❌ Error in activateMarketOnChain:', error);

      // Record failed approval attempt to HCS
      await this.recordApprovalToHCS(marketId, adminAddress, reason, 'activation_failed');
    }
  }

  /**
   * Record admin approval action to HCS for transparency
   */
  private async recordApprovalToHCS(
    marketId: string,
    adminAddress: string,
    reason?: string,
    status: 'contract_activated' | 'database_only' | 'no_signer' | 'contract_failed' | 'activation_failed' = 'contract_activated'
  ): Promise<void> {
    try {
      const approvalMessage = {
        action: 'market_approval',
        marketId,
        adminAddress,
        reason: reason || 'Market approved by admin',
        status,
        timestamp: new Date().toISOString(),
        blockchainConfirmed: status === 'contract_activated'
      };

      // Submit to HCS (would use actual HCS service)
      console.log('📝 Recording approval to HCS:', approvalMessage);

      // TODO: Uncomment when HCS service is available
      // await hcsService.submitAdminAction(approvalMessage);

    } catch (hcsError) {
      console.error('❌ Failed to record approval to HCS:', hcsError);
    }
  }

  /**
   * Get admin signer for contract transactions
   * In production, this would integrate with wallet or secure key management
   */
  private async getAdminSigner(adminAddress: string): Promise<ethers.Signer | null> {
    try {
      // TODO: Implement proper admin wallet integration
      // This would either:
      // 1. Connect to MetaMask if admin is using browser
      // 2. Use stored admin private key (secure)
      // 3. Use hardware wallet integration

      console.log(`🔑 Getting signer for admin ${adminAddress}`);

      // For now, return null to simulate missing wallet connection
      // In real implementation:
      // const provider = new ethers.providers.JsonRpcProvider(HEDERA_RPC_URL);
      // const signer = new ethers.Wallet(adminPrivateKey, provider);
      // return signer;

      return null;

    } catch (error) {
      console.error('❌ Error getting admin signer:', error);
      return null;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();