import { 
  AccountId, 
  PrivateKey, 
  Client,
  TopicId,
  ContractId 
} from '@hashgraph/sdk';

// Environment configuration
export interface HederaConfig {
  network: 'testnet' | 'mainnet' | 'previewnet';
  operatorAccountId: string;
  operatorPrivateKey: string;
  client: Client;
  
  // Contract addresses (will be set after deployment)
  contracts: {
    adminManager?: string;
    castToken?: string;
    treasury?: string;
    betNFT?: string;
    predictionMarketFactory?: string;
  };
  
  // HCS Topic IDs for evidence and attestations
  topics: {
    evidence?: string;
    aiAttestations?: string;
    challenges?: string;
  };
  
  // JSON-RPC endpoints for EVM interaction
  jsonRpcUrl: string;
  chainId: number;
}

// Network configurations
const NETWORK_CONFIGS = {
  testnet: {
    jsonRpcUrl: 'https://testnet.hashio.io/api',
    chainId: 296,
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
  },
  mainnet: {
    jsonRpcUrl: 'https://mainnet.hashio.io/api', 
    chainId: 295,
    mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
  },
  previewnet: {
    jsonRpcUrl: 'https://previewnet.hashio.io/api',
    chainId: 297,
    mirrorNodeUrl: 'https://previewnet.mirrornode.hedera.com',
  }
};

// Initialize Hedera configuration
export function initializeHederaConfig(): HederaConfig {
  const network = (process.env.HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'previewnet';
  const operatorAccountId = process.env.HEDERA_ACCOUNT_ID || '';
  const operatorPrivateKey = process.env.HEDERA_PRIVATE_KEY || '';
  
  if (!operatorAccountId || !operatorPrivateKey) {
    throw new Error('Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in environment variables');
  }

  // Create Hedera client
  let client: Client;
  switch (network) {
    case 'testnet':
      client = Client.forTestnet();
      break;
    case 'mainnet':
      client = Client.forMainnet();
      break;
    case 'previewnet':
      client = Client.forPreviewnet();
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  // Set operator
  client.setOperator(
    AccountId.fromString(operatorAccountId),
    PrivateKey.fromString(operatorPrivateKey)
  );

  return {
    network,
    operatorAccountId,
    operatorPrivateKey,
    client,
    contracts: {
      adminManager: process.env.CONTRACT_ADMIN_MANAGER,
      castToken: process.env.CONTRACT_CAST_TOKEN,
      treasury: process.env.CONTRACT_TREASURY,
      betNFT: process.env.CONTRACT_BET_NFT,
      predictionMarketFactory: process.env.CONTRACT_PREDICTION_MARKET_FACTORY,
    },
    topics: {
      evidence: process.env.HCS_EVIDENCE_TOPIC,
      aiAttestations: process.env.HCS_AI_ATTESTATIONS_TOPIC,
      challenges: process.env.HCS_CHALLENGES_TOPIC,
    },
    jsonRpcUrl: NETWORK_CONFIGS[network].jsonRpcUrl,
    chainId: NETWORK_CONFIGS[network].chainId,
  };
}

// Validate configuration
export function validateHederaConfig(config: HederaConfig): void {
  const required = [
    'operatorAccountId',
    'operatorPrivateKey'
  ];
  
  const missing = required.filter(key => !config[key as keyof HederaConfig]);
  if (missing.length > 0) {
    throw new Error(`Missing required Hedera configuration: ${missing.join(', ')}`);
  }
}

// Export network configurations for reference
export { NETWORK_CONFIGS };