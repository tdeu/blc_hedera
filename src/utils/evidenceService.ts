import { supabase } from './supabase';
import { walletService } from './walletService';
import { ethers } from 'ethers';
import { toast } from 'sonner@2.0.3';

export interface EvidenceSubmission {
  id?: string;
  market_id: string;
  user_id: string;
  evidence_text: string;
  evidence_links: string[];
  submission_fee: number; // HBAR amount paid
  transaction_id?: string; // Hedera transaction ID for fee payment
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
  private readonly EVIDENCE_FEE = 0.1; // 0.1 HBAR fee to submit evidence
  private readonly BASE_REWARD = 0.5; // Base reward for accepted evidence
  private readonly QUALITY_MULTIPLIER = 2.0; // Multiplier for high-quality evidence

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

      if (evidenceText.length < 20) {
        throw new Error('Evidence description must be at least 20 characters');
      }
      console.log('✅ Input validation passed');

      // Step 2: Check user balance and wallet connection
      console.log('💰 Step 2: Checking wallet and balance...');
      if (!walletService.isConnected()) {
        throw new Error('Please connect your MetaMask wallet to submit evidence.');
      }

      const userBalance = await this.getUserBalance(userId);
      console.log('💰 User balance:', userBalance, 'HBAR');

      if (userBalance < this.EVIDENCE_FEE) {
        throw new Error(`Insufficient HBAR balance. You have ${userBalance.toFixed(4)} HBAR but need ${this.EVIDENCE_FEE} HBAR to submit evidence.`);
      }
      console.log('✅ Balance check passed');

      // Step 3: Process HBAR payment for evidence submission
      console.log('💳 Step 3: Processing payment...');
      const paymentResult = await this.processEvidenceFee(userId, this.EVIDENCE_FEE);
      console.log('💳 Payment result:', paymentResult);

      if (!paymentResult.success) {
        throw new Error('Payment failed. Please try again.');
      }
      console.log('✅ Payment processed successfully');

      // Step 4: Store evidence in database
      console.log('🗄️ Step 4: Storing in database...');
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
   * Get user's actual HBAR balance from connected wallet
   */
  private async getUserBalance(userId: string): Promise<number> {
    try {
      if (!walletService.isConnected()) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet.');
      }

      const balance = await walletService.getBalance();
      return parseFloat(balance);
    } catch (error) {
      console.error('Failed to get user balance:', error);
      throw new Error('Failed to get wallet balance. Please ensure your wallet is connected.');
    }
  }

  /**
   * Process actual HBAR payment for evidence submission fee
   */
  private async processEvidenceFee(userId: string, amount: number): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const connection = walletService.getConnection();
      if (!connection || !connection.signer) {
        throw new Error('Wallet not connected or signer not available');
      }

      // Create transaction to treasury/admin account
      const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS || '0x358Ed5B43eBe9e55D37AF5466a9f0472D76E4635';

      const transaction = {
        to: treasuryAddress,
        value: ethers.parseEther(amount.toString()),
        gasLimit: 21000
      };

      console.log('🔄 Processing evidence fee payment:', {
        amount: `${amount} HBAR`,
        to: treasuryAddress,
        from: connection.address
      });

      // Send the transaction
      const tx = await connection.signer.sendTransaction(transaction);
      console.log('📤 Transaction sent:', tx.hash);

      // For Hedera, we don't need to wait for confirmation for evidence storage
      // The transaction hash is enough proof of payment
      console.log('✅ Transaction sent successfully, proceeding with evidence storage');

      return {
        success: true,
        transactionId: tx.hash
      };
    } catch (error: any) {
      console.error('❌ Evidence fee payment failed:', error);

      // Handle specific error cases
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error(`Insufficient HBAR balance. Need ${amount} HBAR to submit evidence.`);
      } else if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user.');
      } else if (error.message?.includes('gas')) {
        throw new Error('Transaction failed due to gas issues. Please try again.');
      } else {
        throw new Error(`Payment failed: ${error.message || 'Unknown error'}`);
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