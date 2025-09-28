import { 
  Client, 
  PrivateKey, 
  AccountId,
  ContractId,
  ContractCallQuery,
  ContractExecuteTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicInfoQuery,
  Hbar,
  TransactionResponse
} from "@hashgraph/sdk";

export interface HederaConfig {
  network: 'testnet' | 'mainnet';
  operatorAccountId: string;
  operatorPrivateKey: string;
}

export interface MarketContract {
  contractId: string;
  topicId: string;
  createdAt: Date;
  status: 'active' | 'resolving' | 'resolved';
}

export interface VerificationEvidence {
  evidence: string;
  source: string;
  timestamp: Date;
  submitter: string;
}

export class HederaService {
  private client: Client;
  private operatorAccountId: AccountId;
  private operatorPrivateKey: PrivateKey;
  
  constructor(config: HederaConfig) {
    this.operatorAccountId = AccountId.fromString(config.operatorAccountId);
    this.operatorPrivateKey = PrivateKey.fromString(config.operatorPrivateKey);
    
    if (config.network === 'testnet') {
      this.client = Client.forTestnet();
    } else {
      this.client = Client.forMainnet();
    }
    
    this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);
  }

  /**
   * Creates a new prediction market on Hedera
   * This replaces your current mock market creation
   */
  async createMarket(
    claim: string,
    description: string,
    expirationDate: Date,
    category: string
  ): Promise<MarketContract> {
    try {
      // 1. Create HCS topic for evidence collection
      const topicTransaction = new TopicCreateTransaction()
        .setTopicMemo(`Blockcast Market: ${claim.substring(0, 50)}...`)
        .setSubmitKey(this.operatorPrivateKey.publicKey);
        
      const topicResponse = await topicTransaction.execute(this.client);
      const topicReceipt = await topicResponse.getReceipt(this.client);
      const topicId = topicReceipt.topicId!;

      // 2. Deploy smart contract for market logic
      // This would typically involve ContractCreateTransaction
      // For now, we'll use a placeholder contract ID
      const contractId = "0.0.123456"; // Replace with actual deployed contract

      return {
        contractId,
        topicId: topicId.toString(),
        createdAt: new Date(),
        status: 'active'
      };
    } catch (error) {
      console.error('Error creating Hedera market:', error);
      throw new Error('Failed to create market on Hedera network');
    }
  }

  /**
   * Places a bet/position on a market
   * This integrates with your existing handlePlaceBet function
   */
  async placeBet(
    marketContractId: string, 
    position: 'yes' | 'no', 
    amount: number
  ): Promise<string> {
    try {
      const contractId = ContractId.fromString(marketContractId);
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(300000)
        .setFunction(position === 'yes' ? "buyYes" : "buyNo", [
          Math.floor(amount * 1000000000) // Convert to tinybars (shares)
        ]);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error placing bet on Hedera:', error);
      throw new Error('Failed to place bet on Hedera network');
    }
  }

  /**
   * Submits evidence to the HCS topic
   * Integrates with your VerificationInput component
   */
  async submitEvidence(
    topicId: string, 
    evidence: VerificationEvidence
  ): Promise<string> {
    try {
      const message = JSON.stringify({
        type: 'evidence',
        evidence: evidence.evidence,
        source: evidence.source,
        timestamp: evidence.timestamp.toISOString(),
        submitter: evidence.submitter
      });

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message);

      const response = await transaction.execute(this.client);
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error submitting evidence to HCS:', error);
      throw new Error('Failed to submit evidence to Hedera Consensus Service');
    }
  }

  /**
   * Retrieves all evidence for a market from HCS
   * Integrates with your VerificationHistory component
   */
  async getMarketEvidence(topicId: string): Promise<VerificationEvidence[]> {
    try {
      // This would typically use the Mirror Node API
      // For demonstration, returning mock data structure
      const evidence: VerificationEvidence[] = [
        {
          evidence: "Supporting documentation from official source",
          source: "Government Database",
          timestamp: new Date(),
          submitter: "0.0.123456"
        }
      ];
      
      return evidence;
    } catch (error) {
      console.error('Error retrieving evidence from HCS:', error);
      throw new Error('Failed to retrieve evidence from Hedera Consensus Service');
    }
  }

  /**
   * Resolves a market based on consensus evidence
   * Integrates with your existing market resolution logic
   */
  async resolveMarket(
    marketContractId: string,
    outcome: 'yes' | 'no',
    evidenceHash: string
  ): Promise<string> {
    try {
      const contractId = ContractId.fromString(marketContractId);
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(300000)
        .setFunction("resolveMarket", [
          outcome === 'yes' ? 1 : 0,
          evidenceHash
        ]);

      const response = await transaction.execute(this.client);
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error resolving market on Hedera:', error);
      throw new Error('Failed to resolve market on Hedera network');
    }
  }

  /**
   * Gets market information from the smart contract
   */
  async getMarketInfo(marketContractId: string) {
    try {
      const contractId = ContractId.fromString(marketContractId);
      
      const query = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("getMarketInfo");

      const result = await query.execute(this.client);
      
      // Parse the result based on your smart contract's return structure
      return {
        totalPool: result.getInt256(0),
        yesPool: result.getInt256(1),
        noPool: result.getInt256(2),
        resolved: result.getBool(3),
        outcome: result.getBool(4)
      };
    } catch (error) {
      console.error('Error getting market info from Hedera:', error);
      throw new Error('Failed to get market information from Hedera network');
    }
  }

  /**
   * Settles user positions after market resolution
   */
  async settleBet(marketContractId: string, userAccountId: string): Promise<string> {
    try {
      const contractId = ContractId.fromString(marketContractId);
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(300000)
        .setFunction("settleBet", [userAccountId]);

      const response = await transaction.execute(this.client);
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error settling bet on Hedera:', error);
      throw new Error('Failed to settle bet on Hedera network');
    }
  }

  /**
   * Gets user's positions in a market
   */
  async getUserPositions(marketContractId: string, userAccountId: string) {
    try {
      const contractId = ContractId.fromString(marketContractId);
      
      const query = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("getUserPosition", [userAccountId]);

      const result = await query.execute(this.client);
      
      return {
        yesAmount: result.getInt256(0),
        noAmount: result.getInt256(1),
        settled: result.getBool(2)
      };
    } catch (error) {
      console.error('Error getting user positions from Hedera:', error);
      throw new Error('Failed to get user positions from Hedera network');
    }
  }
}

// Configuration for different environments
export const getHederaConfig = (environment: 'development' | 'production'): HederaConfig => {
  if (environment === 'development') {
    return {
      network: 'testnet',
      operatorAccountId: import.meta.env.VITE_HEDERA_TESTNET_ACCOUNT_ID || '',
      operatorPrivateKey: import.meta.env.VITE_HEDERA_TESTNET_PRIVATE_KEY || ''
    };
  } else {
    return {
      network: 'mainnet',
      operatorAccountId: import.meta.env.VITE_HEDERA_MAINNET_ACCOUNT_ID || '',
      operatorPrivateKey: import.meta.env.VITE_HEDERA_MAINNET_PRIVATE_KEY || ''
    };
  }
};