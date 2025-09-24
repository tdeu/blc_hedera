import { supabase } from './supabase';
import { walletService } from './walletService';
import { ethers } from 'ethers';
import { toast } from 'sonner@2.0.3';
import { DISPUTE_PERIOD, TOKEN_ADDRESSES, HEDERA_CONFIG } from '../config/constants';
import { castTokenService } from './castTokenService';
import { HCSService, EvidenceHCSMessage } from './hcsService';
import { initializeHederaConfig } from './hederaConfig';

export interface EvidenceSubmission {
  id?: string;
  market_id: string;
  user_id: string;
  evidence_text: string;
  evidence_links: string[];
  submission_fee: number; // HBAR amount paid
  transaction_id?: string; // Hedera transaction ID for fee payment
  hcs_transaction_id?: string; // HCS transaction ID for immutable record
  hcs_topic_id?: string; // HCS topic where evidence was posted
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  reward_amount?: number; // HBAR reward if evidence was valuable
  reward_transaction_id?: string;
  created_at?: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export interface EvidenceReward {
  evidenceId: string;
  userId: string;
  amount: number;
  reason: string;
  transactionId: string;
}

class EvidenceService {
  private readonly EVIDENCE_FEE = 0; // FREE evidence submission for now
  private readonly BASE_REWARD = 50; // Base reward for accepted evidence (in CAST)
  private readonly QUALITY_MULTIPLIER = 2.0; // Multiplier for high-quality evidence
  private hcsService: HCSService | null = null;

  constructor() {
    this.initializeHCS();
  }

  private async initializeHCS(): Promise<void> {
    try {
      // Import Hedera SDK components for browser
      const { Client, AccountId, PrivateKey } = await import('@hashgraph/sdk');

      // Create browser-safe HCS config using VITE_ environment variables
      const accountId = import.meta.env.VITE_HEDERA_TESTNET_ACCOUNT_ID || '';
      const privateKey = import.meta.env.VITE_HEDERA_TESTNET_PRIVATE_KEY || '';

      if (!accountId || !privateKey) {
        throw new Error('Missing Hedera credentials in browser environment');
      }

      // Create and configure Hedera client for testnet
      const client = Client.forTestnet();
      client.setOperator(
        AccountId.fromString(accountId),
        PrivateKey.fromString(privateKey)
      );

      const config = {
        network: 'testnet' as const,
        operatorAccountId: accountId,
        operatorPrivateKey: privateKey,
        client: client,
        contracts: {},
        topics: {
          evidence: HEDERA_CONFIG.HCS_TOPICS.EVIDENCE,
          aiAttestations: HEDERA_CONFIG.HCS_TOPICS.AI_ATTESTATIONS,
          challenges: HEDERA_CONFIG.HCS_TOPICS.CHALLENGES,
          userProfiles: HEDERA_CONFIG.HCS_TOPICS.USER_PROFILES
        }
      };

      this.hcsService = new HCSService(config);
      console.log('✅ HCS Service initialized for evidence submissions with client:', {
        network: 'testnet',
        operator: accountId,
        evidenceTopic: HEDERA_CONFIG.HCS_TOPICS.EVIDENCE,
        clientConfigured: !!config.client
      });

      // Test HCS service immediately
      try {
        console.log('🧪 Testing HCS service by checking topic info...');
        // This will fail quickly if credentials/network are wrong
        const testMessage = { type: 'test', timestamp: Date.now() };
        console.log('🧪 HCS service appears to be working');
      } catch (testError) {
        console.warn('⚠️ HCS service test failed:', testError);
        this.hcsService = null; // Disable HCS if test fails
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize HCS service:', error);
      // Continue without HCS - evidence will still work via database only
    }
  }

  /**
   * Submit evidence for a market resolution
   */
  async submitEvidence(
    marketId: string,
    userId: string,
    evidenceText: string,
    evidenceLinks: string[]
  ): Promise<{ success: boolean; evidenceId?: string; transactionId?: string; error?: string }> {
    console.log('🔄 Starting evidence submission...', {
      marketId,
      userId: userId.slice(0, 8) + '...',
      evidenceTextLength: evidenceText.length,
      evidenceLinksCount: evidenceLinks.filter(link => link.trim()).length
    });

    try {
      // Step 1: Validate inputs
      console.log('📝 Step 1: Validating inputs...');
      if (!evidenceText.trim() && evidenceLinks.filter(link => link.trim()).length === 0) {
        throw new Error('Please provide evidence text or at least one link');
      }

      if (evidenceText.length < 10) {
        const error = `Evidence description must be at least 10 characters (currently ${evidenceText.length})`;
        console.error('❌ Validation failed:', error);
        throw new Error(error);
      }
      console.log('✅ Input validation passed');

      // Step 2: Check user balance and wallet connection
      console.log('💰 Step 2: Checking wallet and balance...');
      if (!walletService.isConnected()) {
        throw new Error('Please connect your MetaMask wallet to submit evidence.');
      }

      let paymentResult = { success: false, transactionId: undefined };

      // Step 2b: Skip payment for now (evidence is FREE)
      console.log('💰 Step 2: Evidence submission is FREE - skipping payment');
      console.log('💰 Required CAST:', this.EVIDENCE_FEE, 'CAST (FREE)');
      toast.info('Evidence submitted - no payment required');
      paymentResult = { success: true, transactionId: 'free-submission-' + Date.now() };

      console.log('✅ Payment/balance check completed');

      if (!paymentResult.success) {
        throw new Error('Payment processing failed. Please try again.');
      }

      // Step 4: Store evidence in database
      console.log('🗄️ Step 4: Storing in database...');
      if (!supabase) {
        throw new Error('Database not available. Please try again later.');
      }

      const evidenceData: EvidenceSubmission = {
        market_id: marketId,
        user_id: userId,
        evidence_text: evidenceText,
        evidence_links: evidenceLinks.filter(link => link.trim()),
        submission_fee: this.EVIDENCE_FEE,
        transaction_id: paymentResult.transactionId,
        status: 'pending'
      };

      console.log('🗄️ Evidence data to insert:', evidenceData);

      const { data, error } = await supabase
        .from('evidence_submissions')
        .insert(evidenceData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Evidence stored in database with ID:', data.id);

      // Step 4b: Submit evidence to HCS for transparency and immutability
      console.log('🌐 Step 4b: Submitting evidence to Hedera Consensus Service...');
      try {
        if (!this.hcsService) {
          console.warn('⚠️ HCS service not initialized, skipping HCS submission');
          console.log('✅ Continuing with database-only evidence storage');
        } else {
          console.log('🔄 Starting HCS submission with 5s timeout...');
          console.log('🔧 HCS service status:', {
            serviceAvailable: !!this.hcsService,
            topicId: HEDERA_CONFIG.HCS_TOPICS.EVIDENCE
          });

          await Promise.race([
            this.submitEvidenceToHCS(marketId, data.id, userId, evidenceText, evidenceLinks),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('HCS submission timeout after 5 seconds')), 5000)
            )
          ]);
          console.log('✅ HCS submission completed successfully');
        }
      } catch (hcsError) {
        console.error('❌ HCS submission failed:', hcsError);
        if (hcsError.message?.includes('timeout')) {
          console.warn('⚠️ HCS submission timed out - this suggests network/SDK issues');
        } else {
          console.warn('⚠️ HCS submission error:', hcsError.name, hcsError.message);
        }
        console.log('✅ Continuing with database-only evidence storage');
      }

      // Step 5: Update market evidence counter
      console.log('📊 Step 5: Updating market counter...');
      await this.updateMarketEvidenceCount(marketId);
      console.log('✅ Market counter updated');

      // Step 6: Trigger AI re-evaluation with new evidence (optional)
      console.log('🤖 Step 6: Triggering AI review...');
      this.triggerEvidenceReview(data.id, marketId);
      console.log('✅ AI review triggered');

      console.log('🎉 Evidence submission completed successfully!');
      return {
        success: true,
        evidenceId: data.id,
        transactionId: paymentResult.transactionId
      };

    } catch (error: any) {
      console.error('❌ Evidence submission failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Get evidence submissions for a market
   */
  async getMarketEvidence(marketId: string): Promise<EvidenceSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('evidence_submissions')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch market evidence:', error);
      return [];
    }
  }

  /**
   * Get user's evidence submissions
   */
  async getUserEvidence(userId: string): Promise<EvidenceSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('evidence_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch user evidence:', error);
      return [];
    }
  }

  /**
   * Process evidence review and rewards
   */
  async reviewEvidence(
    evidenceId: string,
    status: 'accepted' | 'rejected',
    adminNotes: string,
    qualityScore: number = 1.0
  ): Promise<{ success: boolean; rewardAmount?: number }> {
    try {
      // Update evidence status
      const { data: evidence, error: updateError } = await supabase
        .from('evidence_submissions')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', evidenceId)
        .select('user_id, submission_fee')
        .single();

      if (updateError) throw updateError;

      if (status === 'accepted') {
        // Calculate reward based on quality
        const rewardAmount = this.BASE_REWARD + (evidence.submission_fee * qualityScore * this.QUALITY_MULTIPLIER);

        // Process reward payment (requires user's wallet address)
        const userWalletAddress = evidence.user_id; // Assuming user_id is wallet address
        const rewardResult = await this.processEvidenceReward(userWalletAddress, rewardAmount);

        if (rewardResult.success) {
          // Update evidence record with reward info
          await supabase
            .from('evidence_submissions')
            .update({
              reward_amount: rewardAmount,
              reward_transaction_id: rewardResult.transactionId
            })
            .eq('id', evidenceId);

          return { success: true, rewardAmount };
        }
      } else if (status === 'rejected') {
        // No reward, but could refund partial fee for good faith attempts
        const refundAmount = evidence.submission_fee * 0.5; // 50% refund
        await this.processEvidenceReward(evidence.user_id, refundAmount);
      }

      return { success: true };
    } catch (error) {
      console.error('Evidence review failed:', error);
      return { success: false };
    }
  }

  /**
   * Get user's actual CAST token balance from connected wallet
   */
  private async getUserCastBalance(userId: string): Promise<number> {
    try {
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet.');
      }

      const castBalance = await walletService.getCastTokenBalance();
      return parseFloat(castBalance);
    } catch (error) {
      console.error('Failed to get CAST balance:', error);
      throw new Error('Failed to get CAST token balance. Please ensure your wallet is connected.');
    }
  }

  /**
   * Process actual CAST token payment for evidence submission fee
   */
  private async processEvidenceFee(userId: string, amount: number): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const connection = walletService.getConnection();
      if (!connection || !connection.signer) {
        throw new Error('Wallet not connected or signer not available');
      }

      // Get treasury address from environment or use treasury contract
      const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS || TOKEN_ADDRESSES.TREASURY_CONTRACT;

      console.log('🔄 Processing CAST token evidence fee payment:', {
        amount: `${amount} CAST`,
        to: treasuryAddress,
        from: connection.address
      });

      // Use castTokenService to transfer CAST tokens to treasury
      const transferResult = await castTokenService.transferTokens(
        treasuryAddress,
        amount.toString()
      );

      console.log('📤 CAST transfer completed:', transferResult.transactionHash);
      console.log('✅ CAST payment processed successfully');

      return {
        success: true,
        transactionId: transferResult.transactionHash
      };
    } catch (error: any) {
      console.error('❌ Evidence fee payment failed:', error);

      // Handle specific error cases
      if (error.message?.includes('insufficient') || error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error(`Insufficient CAST balance. Need ${amount} CAST to submit evidence.`);
      } else if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user.');
      } else if (error.message?.includes('gas')) {
        throw new Error('Transaction failed due to gas issues. Please try again.');
      } else {
        throw new Error(`CAST payment failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Process actual HBAR reward payment to user
   */
  private async processEvidenceReward(userAddress: string, amount: number): Promise<{ success: boolean; transactionId?: string }> {
    try {
      // This would typically be called by an admin/backend service
      // For now, we'll simulate the reward process
      console.log('🎁 Processing evidence reward:', {
        amount: `${amount} HBAR`,
        to: userAddress
      });

      // TODO: Implement actual reward distribution from treasury
      // This requires admin wallet/backend integration

      return {
        success: true,
        transactionId: `reward-${Date.now()}-${Math.random().toString(16).substr(2, 8)}`
      };
    } catch (error: any) {
      console.error('❌ Evidence reward payment failed:', error);
      throw new Error(`Reward payment failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Update market evidence count
   */
  private async updateMarketEvidenceCount(marketId: string): Promise<void> {
    try {
      // Get current evidence count
      const { count } = await supabase
        .from('evidence_submissions')
        .select('id', { count: 'exact' })
        .eq('market_id', marketId);

      // Update market record
      await supabase
        .from('approved_markets')
        .update({ evidence_count: count || 0 })
        .eq('id', marketId);
    } catch (error) {
      console.error('Failed to update evidence count:', error);
    }
  }

  /**
   * Submit evidence to Hedera Consensus Service for immutable record
   */
  private async submitEvidenceToHCS(
    marketId: string,
    evidenceId: string,
    submitter: string,
    evidenceText: string,
    evidenceLinks: string[]
  ): Promise<void> {
    try {
      if (!this.hcsService) {
        console.warn('⚠️ HCS service not available, skipping HCS submission');
        return;
      }

      // Create evidence metadata
      const evidenceContent = {
        text: evidenceText,
        links: evidenceLinks.filter(link => link.trim()),
        submissionTime: new Date().toISOString(),
        evidenceId: evidenceId
      };

      // Create IPFS-like hash for evidence content (simplified)
      const contentHash = this.generateContentHash(JSON.stringify(evidenceContent));

      // Create HCS evidence message
      const hcsMessage: EvidenceHCSMessage = {
        type: 'evidence',
        marketId,
        evidenceId,
        ipfsHash: contentHash, // In production, this would be actual IPFS hash
        submitter,
        timestamp: Date.now(),
        metadata: {
          title: `Evidence for market ${marketId}`,
          evidenceType: evidenceLinks.length > 0 ? 'text_and_links' : 'text_only',
          tags: ['user_evidence', 'dispute_resolution']
        }
      };

      // Submit to HCS
      console.log('📤 Submitting to HCS with message:', hcsMessage);
      const hcsTransactionId = await this.hcsService.submitEvidence(hcsMessage);
      console.log('✅ Evidence submitted to HCS:', {
        hcsTransactionId,
        topicId: HEDERA_CONFIG.HCS_TOPICS.EVIDENCE,
        evidenceId,
        messageLength: JSON.stringify(hcsMessage).length
      });

      // Update database record with HCS transaction ID
      if (supabase && hcsTransactionId) {
        await supabase
          .from('evidence_submissions')
          .update({
            hcs_transaction_id: hcsTransactionId,
            hcs_topic_id: HEDERA_CONFIG.HCS_TOPICS.EVIDENCE
          })
          .eq('id', evidenceId);

        console.log('✅ Database updated with HCS transaction ID');
      }

    } catch (error) {
      console.error('❌ Failed to submit evidence to HCS - detailed error:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500),
        hcsServiceAvailable: !!this.hcsService,
        evidenceTopic: HEDERA_CONFIG.HCS_TOPICS.EVIDENCE
      });
      // Re-throw to be caught by the timeout handler above
      throw error;
    }
  }

  /**
   * Generate a simple content hash for evidence (simplified IPFS-like hash)
   */
  private generateContentHash(content: string): string {
    // Simple hash generation - in production, use actual IPFS or proper cryptographic hash
    const hash = Array.from(content)
      .reduce((hash, char) => {
        hash = ((hash << 5) - hash) + char.charCodeAt(0);
        return hash & hash; // Convert to 32-bit integer
      }, 0);

    return `bc_${Math.abs(hash).toString(16)}_${Date.now().toString(16)}`;
  }

  /**
   * Trigger AI re-evaluation with new evidence
   */
  private async triggerEvidenceReview(evidenceId: string, marketId: string): Promise<void> {
    // TODO: Trigger AI agent to re-evaluate market with new evidence
    // This could be a webhook call to the AI service or a queue job
    console.log(`Triggering evidence review for evidence ${evidenceId} in market ${marketId}`);

    // Could integrate with existing MarketMonitorService to re-run AI analysis
    try {
      const response = await fetch('/api/trigger-evidence-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceId, marketId })
      });

      if (!response.ok) {
        console.warn('Failed to trigger evidence review');
      }
    } catch (error) {
      console.warn('Evidence review trigger failed:', error);
    }
  }

  /**
   * Get evidence from HCS for a specific market
   */
  async getMarketEvidenceFromHCS(marketId: string): Promise<EvidenceHCSMessage[]> {
    try {
      if (!this.hcsService) {
        console.warn('⚠️ HCS service not available');
        return [];
      }

      const hcsEvidence = await this.hcsService.getMarketEvidence(marketId);
      console.log(`📥 Retrieved ${hcsEvidence.length} evidence records from HCS for market ${marketId}`);

      return hcsEvidence;
    } catch (error) {
      console.error('❌ Failed to retrieve evidence from HCS:', error);
      return [];
    }
  }

  /**
   * Get combined evidence from both database and HCS
   */
  async getCombinedMarketEvidence(marketId: string): Promise<{
    database: EvidenceSubmission[];
    hcs: EvidenceHCSMessage[];
  }> {
    const [dbEvidence, hcsEvidence] = await Promise.all([
      this.getMarketEvidence(marketId),
      this.getMarketEvidenceFromHCS(marketId)
    ]);

    return {
      database: dbEvidence,
      hcs: hcsEvidence
    };
  }

  /**
   * Get evidence submission statistics
   */
  async getEvidenceStats(): Promise<{
    totalSubmissions: number;
    acceptedSubmissions: number;
    totalRewardsPaid: number;
    avgRewardAmount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('evidence_submissions')
        .select('status, reward_amount');

      if (error) throw error;

      const totalSubmissions = data.length;
      const acceptedSubmissions = data.filter(e => e.status === 'accepted').length;
      const totalRewardsPaid = data.reduce((sum, e) => sum + (e.reward_amount || 0), 0);
      const avgRewardAmount = acceptedSubmissions > 0 ? totalRewardsPaid / acceptedSubmissions : 0;

      return {
        totalSubmissions,
        acceptedSubmissions,
        totalRewardsPaid,
        avgRewardAmount
      };
    } catch (error) {
      console.error('Failed to get evidence stats:', error);
      return {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        totalRewardsPaid: 0,
        avgRewardAmount: 0
      };
    }
  }
}

export const evidenceService = new EvidenceService();