import { 
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicInfoQuery,
  TopicId,
  PrivateKey,
  Timestamp,
  TopicMessage
} from '@hashgraph/sdk';
import { HederaConfig } from './hederaConfig';

export interface HCSMessage {
  consensusTimestamp: string;
  message: string;
  runningHash: string;
  sequenceNumber: number;
  topicId: string;
}

export interface EvidenceHCSMessage {
  type: 'evidence';
  marketId: string;
  evidenceId: string;
  ipfsHash: string;
  submitter: string;
  timestamp: number;
  metadata: {
    title: string;
    evidenceType: string;
    tags?: string[];
  };
}

export interface AttestationHCSMessage {
  type: 'ai_attestation';
  marketId: string;
  outcome: 'yes' | 'no';
  confidence: number;
  reasoning: string;
  evidenceReviewed: string[];
  aiAgentId: string;
  timestamp: number;
  signature?: string;
}

export interface ChallengeHCSMessage {
  type: 'challenge';
  marketId: string;
  challengeId: string;
  challenger: string;
  targetAttestationId: string;
  counterEvidenceHash: string;
  stakeAmount: string;
  reasoning: string;
  timestamp: number;
}

export type BlockcastHCSMessage = EvidenceHCSMessage | AttestationHCSMessage | ChallengeHCSMessage;

export class HCSService {
  private config: HederaConfig;
  
  constructor(config: HederaConfig) {
    this.config = config;
  }

  // Create a new HCS topic
  async createTopic(
    memo: string, 
    adminKey?: PrivateKey,
    submitKey?: PrivateKey
  ): Promise<string> {
    const transaction = new TopicCreateTransaction()
      .setTopicMemo(memo);

    if (adminKey) {
      transaction.setAdminKey(adminKey);
    }

    if (submitKey) {
      transaction.setSubmitKey(submitKey);
    }

    const response = await transaction.execute(this.config.client);
    const receipt = await response.getReceipt(this.config.client);
    
    if (!receipt.topicId) {
      throw new Error('Failed to create topic');
    }

    return receipt.topicId.toString();
  }

  // Submit evidence to HCS
  async submitEvidence(evidence: EvidenceHCSMessage): Promise<string> {
    if (!this.config.topics.evidence) {
      throw new Error('Evidence topic not configured');
    }

    const message = JSON.stringify(evidence);
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(this.config.topics.evidence))
      .setMessage(message);

    const response = await transaction.execute(this.config.client);
    const receipt = await response.getReceipt(this.config.client);

    return receipt.transactionId?.toString() || '';
  }

  // Submit AI attestation to HCS
  async submitAttestation(attestation: AttestationHCSMessage): Promise<string> {
    if (!this.config.topics.aiAttestations) {
      throw new Error('AI attestations topic not configured');
    }

    const message = JSON.stringify(attestation);
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(this.config.topics.aiAttestations))
      .setMessage(message);

    const response = await transaction.execute(this.config.client);
    const receipt = await response.getReceipt(this.config.client);

    return receipt.transactionId?.toString() || '';
  }

  // Submit challenge to HCS
  async submitChallenge(challenge: ChallengeHCSMessage): Promise<string> {
    if (!this.config.topics.challenges) {
      throw new Error('Challenges topic not configured');
    }

    const message = JSON.stringify(challenge);
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(this.config.topics.challenges))
      .setMessage(message);

    const response = await transaction.execute(this.config.client);
    const receipt = await response.getReceipt(this.config.client);

    return receipt.transactionId?.toString() || '';
  }

  // Get messages from HCS topic using Mirror Node API
  async getTopicMessages(
    topicId: string, 
    limit: number = 100,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<HCSMessage[]> {
    const mirrorNodeUrl = this.getMirrorNodeUrl();
    const url = `${mirrorNodeUrl}/api/v1/topics/${topicId}/messages?limit=${limit}&order=${order}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mirror node request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages?.map((msg: any) => ({
        consensusTimestamp: msg.consensus_timestamp,
        message: Buffer.from(msg.message, 'base64').toString('utf-8'),
        runningHash: msg.running_hash,
        sequenceNumber: msg.sequence_number,
        topicId: msg.topic_id
      })) || [];
    } catch (error) {
      console.error('Failed to fetch topic messages:', error);
      return [];
    }
  }

  // Get evidence messages for a specific market
  async getMarketEvidence(marketId: string): Promise<EvidenceHCSMessage[]> {
    if (!this.config.topics.evidence) {
      return [];
    }

    const messages = await this.getTopicMessages(this.config.topics.evidence, 1000);
    const evidenceMessages: EvidenceHCSMessage[] = [];

    for (const message of messages) {
      try {
        const parsed = JSON.parse(message.message) as BlockcastHCSMessage;
        if (parsed.type === 'evidence' && parsed.marketId === marketId) {
          evidenceMessages.push(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse message:', error);
      }
    }

    return evidenceMessages.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Get attestations for a specific market
  async getMarketAttestations(marketId: string): Promise<AttestationHCSMessage[]> {
    if (!this.config.topics.aiAttestations) {
      return [];
    }

    const messages = await this.getTopicMessages(this.config.topics.aiAttestations);
    const attestations: AttestationHCSMessage[] = [];

    for (const message of messages) {
      try {
        const parsed = JSON.parse(message.message) as BlockcastHCSMessage;
        if (parsed.type === 'ai_attestation' && parsed.marketId === marketId) {
          attestations.push(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse attestation message:', error);
      }
    }

    return attestations.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get challenges for a specific market
  async getMarketChallenges(marketId: string): Promise<ChallengeHCSMessage[]> {
    if (!this.config.topics.challenges) {
      return [];
    }

    const messages = await this.getTopicMessages(this.config.topics.challenges);
    const challenges: ChallengeHCSMessage[] = [];

    for (const message of messages) {
      try {
        const parsed = JSON.parse(message.message) as BlockcastHCSMessage;
        if (parsed.type === 'challenge' && parsed.marketId === marketId) {
          challenges.push(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse challenge message:', error);
      }
    }

    return challenges.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Helper to create evidence message
  static createEvidenceMessage(
    marketId: string,
    evidenceId: string,
    ipfsHash: string,
    submitter: string,
    title: string,
    evidenceType: string,
    tags?: string[]
  ): EvidenceHCSMessage {
    return {
      type: 'evidence',
      marketId,
      evidenceId,
      ipfsHash,
      submitter,
      timestamp: Date.now(),
      metadata: {
        title,
        evidenceType,
        tags
      }
    };
  }

  // Helper to create attestation message
  static createAttestationMessage(
    marketId: string,
    outcome: 'yes' | 'no',
    confidence: number,
    reasoning: string,
    evidenceReviewed: string[],
    aiAgentId: string
  ): AttestationHCSMessage {
    return {
      type: 'ai_attestation',
      marketId,
      outcome,
      confidence,
      reasoning,
      evidenceReviewed,
      aiAgentId,
      timestamp: Date.now()
    };
  }

  // Helper to create challenge message
  static createChallengeMessage(
    marketId: string,
    challengeId: string,
    challenger: string,
    targetAttestationId: string,
    counterEvidenceHash: string,
    stakeAmount: string,
    reasoning: string
  ): ChallengeHCSMessage {
    return {
      type: 'challenge',
      marketId,
      challengeId,
      challenger,
      targetAttestationId,
      counterEvidenceHash,
      stakeAmount,
      reasoning,
      timestamp: Date.now()
    };
  }

  // Get topic info
  async getTopicInfo(topicId: string) {
    const query = new TopicInfoQuery()
      .setTopicId(TopicId.fromString(topicId));

    return await query.execute(this.config.client);
  }

  // Get mirror node URL based on network
  private getMirrorNodeUrl(): string {
    switch (this.config.network) {
      case 'testnet':
        return 'https://testnet.mirrornode.hedera.com';
      case 'mainnet':
        return 'https://mainnet-public.mirrornode.hedera.com';
      case 'previewnet':
        return 'https://previewnet.mirrornode.hedera.com';
      default:
        throw new Error(`Unsupported network: ${this.config.network}`);
    }
  }

  // Utility: Generate unique IDs for evidence and challenges
  static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}