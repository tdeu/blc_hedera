import { 
  Client, 
  PrivateKey, 
  AccountId, 
  TopicCreateTransaction, 
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TransferTransaction,
  Hbar,
  TransactionReceipt,
  TransactionResponse,
  TopicId,
  TokenId,
  TokenAssociateTransaction,
  TokenMintTransaction
} from '@hashgraph/sdk';

interface HederaResolutionConfig {
  network: 'testnet' | 'mainnet' | 'previewnet';
  accountId: string;
  privateKey: string;
  operatorKey: string;
}

interface ResolutionMessage {
  type: 'api_resolution' | 'manual_resolution' | 'dispute_submission' | 'admin_decision';
  marketId: string;
  data: any;
  timestamp: number;
  submitter: string;
}

interface DisputeBondInfo {
  amount: number;
  tokenId: string;
  transactionId: string;
  userAccount: string;
}

export class HederaResolutionService {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  // Default topic IDs from environment
  private resolutionTopicId: string = '0.0.6701057'; // AI Attestations topic
  private disputeTopicId: string = '0.0.6701064'; // Challenges topic
  private evidenceTopicId: string = '0.0.6701034'; // Evidence topic

  constructor(config: HederaResolutionConfig) {
    this.operatorId = AccountId.fromString(config.accountId);
    this.operatorKey = PrivateKey.fromString(config.privateKey);
    
    if (config.network === 'testnet') {
      this.client = Client.forTestnet().setOperator(this.operatorId, this.operatorKey);
    } else if (config.network === 'mainnet') {
      this.client = Client.forMainnet().setOperator(this.operatorId, this.operatorKey);
    } else {
      this.client = Client.forPreviewnet().setOperator(this.operatorId, this.operatorKey);
    }
  }

  // HCS Topic Management
  async createResolutionTopic(marketId: string, description: string): Promise<string> {
    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(`Resolution topic for market ${marketId}: ${description}`)
        .setAdminKey(this.operatorKey.publicKey)
        .setSubmitKey(this.operatorKey.publicKey);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.topicId) {
        const topicId = receipt.topicId.toString();
        console.log(`Created resolution topic: ${topicId} for market ${marketId}`);
        return topicId;
      }
      throw new Error('Failed to create topic - no topic ID returned');
    } catch (error) {
      console.error('Error creating resolution topic:', error);
      throw error;
    }
  }

  async submitResolutionMessage(
    marketId: string, 
    resolution: any, 
    source: string = 'api',
    topicId?: string
  ): Promise<string> {
    try {
      const targetTopicId = topicId || this.resolutionTopicId;
      
      const message: ResolutionMessage = {
        type: source === 'api' ? 'api_resolution' : 'manual_resolution',
        marketId,
        data: resolution,
        timestamp: Date.now(),
        submitter: this.operatorId.toString()
      };

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(targetTopicId))
        .setMessage(JSON.stringify(message));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const transactionId = response.transactionId.toString();
      console.log(`Resolution submitted to HCS topic ${targetTopicId}: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error('Error submitting resolution message:', error);
      throw error;
    }
  }

  async submitDisputeMessage(
    marketId: string, 
    disputeData: any, 
    userAccount: string,
    topicId?: string
  ): Promise<string> {
    try {
      const targetTopicId = topicId || this.disputeTopicId;
      
      const message: ResolutionMessage = {
        type: 'dispute_submission',
        marketId,
        data: disputeData,
        timestamp: Date.now(),
        submitter: userAccount
      };

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(targetTopicId))
        .setMessage(JSON.stringify(message));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const transactionId = response.transactionId.toString();
      console.log(`Dispute submitted to HCS topic ${targetTopicId}: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error('Error submitting dispute message:', error);
      throw error;
    }
  }

  // HTS Token Management for Dispute Bonds
  async createDisputeBondToken(
    tokenName: string = 'BlockCast Dispute Bond',
    tokenSymbol: string = 'BCDB'
  ): Promise<string> {
    try {
      const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setDecimals(2) // 2 decimal places for precision
        .setInitialSupply(1000000) // 1 million tokens initial supply
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(this.operatorKey.publicKey)
        .setSupplyKey(this.operatorKey.publicKey)
        .setFreezeKey(this.operatorKey.publicKey)
        .setWipeKey(this.operatorKey.publicKey);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.tokenId) {
        const tokenId = receipt.tokenId.toString();
        console.log(`Created dispute bond token: ${tokenId}`);
        return tokenId;
      }
      throw new Error('Failed to create token - no token ID returned');
    } catch (error) {
      console.error('Error creating dispute bond token:', error);
      throw error;
    }
  }

  async associateTokenWithAccount(tokenId: string, accountId: string, privateKey: string): Promise<string> {
    try {
      const userKey = PrivateKey.fromString(privateKey);
      const userAccountId = AccountId.fromString(accountId);
      
      const transaction = new TokenAssociateTransaction()
        .setAccountId(userAccountId)
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(this.client)
        .sign(userKey);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const transactionId = response.transactionId.toString();
      console.log(`Token ${tokenId} associated with account ${accountId}: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error('Error associating token with account:', error);
      throw error;
    }
  }

  async lockDisputeBond(
    tokenId: string,
    userAccountId: string, 
    bondAmount: number,
    userPrivateKey: string
  ): Promise<DisputeBondInfo> {
    try {
      const userKey = PrivateKey.fromString(userPrivateKey);
      const userAccount = AccountId.fromString(userAccountId);
      const tokenIdObj = TokenId.fromString(tokenId);

      // Transfer tokens from user to treasury (this contract) as bond
      const transaction = new TransferTransaction()
        .addTokenTransfer(tokenIdObj, userAccount, -bondAmount)
        .addTokenTransfer(tokenIdObj, this.operatorId, bondAmount)
        .freezeWith(this.client)
        .sign(userKey);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const transactionId = response.transactionId.toString();
      
      console.log(`Dispute bond locked: ${bondAmount} tokens from ${userAccountId}: ${transactionId}`);
      
      return {
        amount: bondAmount,
        tokenId,
        transactionId,
        userAccount: userAccountId
      };
    } catch (error) {
      console.error('Error locking dispute bond:', error);
      throw error;
    }
  }

  async refundDisputeBond(
    tokenId: string,
    userAccountId: string, 
    bondAmount: number,
    reason: 'successful_dispute' | 'partial_refund' = 'successful_dispute'
  ): Promise<string> {
    try {
      const userAccount = AccountId.fromString(userAccountId);
      const tokenIdObj = TokenId.fromString(tokenId);

      // Calculate refund amount (full for successful disputes, 50% for failed)
      const refundAmount = reason === 'successful_dispute' ? bondAmount : Math.floor(bondAmount / 2);

      const transaction = new TransferTransaction()
        .addTokenTransfer(tokenIdObj, this.operatorId, -refundAmount)
        .addTokenTransfer(tokenIdObj, userAccount, refundAmount);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const transactionId = response.transactionId.toString();
      
      console.log(`Dispute bond refunded: ${refundAmount}/${bondAmount} tokens to ${userAccountId}: ${transactionId}`);
      
      return transactionId;
    } catch (error) {
      console.error('Error refunding dispute bond:', error);
      throw error;
    }
  }

  // Utility Functions
  async getAccountBalance(accountId: string): Promise<any> {
    try {
      const account = AccountId.fromString(accountId);
      const balance = await this.client.getAccountBalance(account);
      
      return {
        hbarBalance: balance.hbars.toString(),
        tokenBalances: balance.tokens ? Object.fromEntries(balance.tokens) : {}
      };
    } catch (error) {
      console.error('Error getting account balance:', error);
      throw error;
    }
  }

  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      // This would typically query the mirror node for transaction details
      // For now, we'll return a basic status
      return {
        transactionId,
        status: 'SUCCESS', // This would be dynamic based on actual status
        consensusTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  }

  // Administrative Functions
  async submitAdminDecision(
    marketId: string, 
    decision: any, 
    adminNotes?: string,
    topicId?: string
  ): Promise<string> {
    try {
      const targetTopicId = topicId || this.resolutionTopicId;
      
      const message: ResolutionMessage = {
        type: 'admin_decision',
        marketId,
        data: {
          ...decision,
          adminNotes,
          adminAccount: this.operatorId.toString()
        },
        timestamp: Date.now(),
        submitter: this.operatorId.toString()
      };

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(targetTopicId))
        .setMessage(JSON.stringify(message));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const transactionId = response.transactionId.toString();
      console.log(`Admin decision submitted to HCS: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error('Error submitting admin decision:', error);
      throw error;
    }
  }

  // Evidence Submission (using existing evidence topic)
  async submitEvidence(
    marketId: string,
    evidenceData: any,
    submitterAccount: string,
    ipfsHash?: string
  ): Promise<string> {
    try {
      const message = {
        type: 'evidence_submission',
        marketId,
        data: {
          ...evidenceData,
          ipfsHash,
          submitter: submitterAccount
        },
        timestamp: Date.now(),
        submitter: submitterAccount
      };

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(this.evidenceTopicId))
        .setMessage(JSON.stringify(message));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const transactionId = response.transactionId.toString();
      console.log(`Evidence submitted to HCS: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      throw error;
    }
  }

  // Configuration Methods
  setResolutionTopicId(topicId: string): void {
    this.resolutionTopicId = topicId;
  }

  setDisputeTopicId(topicId: string): void {
    this.disputeTopicId = topicId;
  }

  setEvidenceTopicId(topicId: string): void {
    this.evidenceTopicId = topicId;
  }

  getTopicIds(): { resolution: string; dispute: string; evidence: string } {
    return {
      resolution: this.resolutionTopicId,
      dispute: this.disputeTopicId,
      evidence: this.evidenceTopicId
    };
  }
}

// Factory function to create service instance
export function createHederaResolutionService(): HederaResolutionService {
  const config: HederaResolutionConfig = {
    network: 'testnet',
    accountId: import.meta.env.VITE_HEDERA_TESTNET_ACCOUNT_ID || '0.0.6643581',
    privateKey: import.meta.env.VITE_HEDERA_TESTNET_PRIVATE_KEY || '',
    operatorKey: import.meta.env.VITE_HEDERA_TESTNET_PRIVATE_KEY || ''
  };

  return new HederaResolutionService(config);
}

// Export default instance
export const hederaResolutionService = createHederaResolutionService();