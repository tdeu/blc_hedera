// Blockcast Platform Constants

// Market Creation Settings
export const MARKET_CREATION = {
  DEFAULT_COLLATERAL_AMOUNT: '1', // 1 HBAR default
  MIN_COLLATERAL_HBAR: '1',
  MIN_COLLATERAL_CAST: '100',
  SUPPORTED_COLLATERAL_TOKENS: ['HBAR', 'CAST'] as const,
  MIN_CLAIM_LENGTH: 10,
  MAX_CLAIM_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 1000
} as const;

// Dispute System Settings
export const DISPUTE_PERIOD = {
  HOURS: 72, // Standardized to 72 hours (3 days)
  MILLISECONDS: 72 * 60 * 60 * 1000,
  BOND_AMOUNT_HBAR: '1', // 1 HBAR dispute bond
  BOND_AMOUNT_CAST: '100' // 100 CAST dispute bond
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  // Primary betting token (what users see in UI)
  PRIMARY_BETTING_TOKEN: 'HBAR' as CollateralToken,

  // Contract collateral token (what smart contracts use)
  CONTRACT_COLLATERAL_TOKEN: 'CAST' as CollateralToken,

  // Display preferences
  SHOW_BOTH_TOKENS: true, // Show both HBAR equivalent and actual CAST amounts

  // Exchange rates (for display purposes only)
  EXCHANGE_RATES: {
    HBAR_TO_CAST: 50, // 1 HBAR = 50 CAST (example rate)
    CAST_TO_HBAR: 0.02 // 1 CAST = 0.02 HBAR
  }
} as const;

// Token Addresses (Hedera Testnet)
export const TOKEN_ADDRESSES = {
  CAST_TOKEN: '0x5e383bD628a0cda81913bbd5EfB4DD1989fCc6e2',
  USDC_TOKEN: '0x0000000000000000000000000000000000000000', // Placeholder
  FACTORY_CONTRACT: '0x31049333C880702e1f5Eae7d26A125c667cee91B'
} as const;

// Market Status Types
export const MARKET_STATUS = {
  SUBMITTED: 'submitted',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  DISPUTABLE: 'disputable',
  PENDING_RESOLUTION: 'pending_resolution',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
  OFFLINE: 'offline'
} as const;

// AI Resolution Settings
export const AI_RESOLUTION = {
  HIGH_CONFIDENCE_THRESHOLD: 0.9,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.7,
  AUTO_EXECUTE_THRESHOLD: 0.95
} as const;

// Network Settings
export const HEDERA_CONFIG = {
  TESTNET_RPC: 'https://testnet.hashio.io/api',
  TESTNET_MIRROR_NODE: 'https://testnet.mirrornode.hedera.com',
  HCS_TOPICS: {
    EVIDENCE: '0.0.6701034',
    AI_ATTESTATIONS: '0.0.6701057',
    CHALLENGES: '0.0.6701064',
    USER_PROFILES: '0.0.6701000' // Placeholder
  }
} as const;

// User Interface Settings
export const UI_CONFIG = {
  MARKETS_PER_PAGE: 12,
  MAX_IMAGE_SIZE_MB: 5,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  NOTIFICATION_DURATION: 5000
} as const;

export type CollateralToken = typeof MARKET_CREATION.SUPPORTED_COLLATERAL_TOKENS[number];
export type MarketStatus = typeof MARKET_STATUS[keyof typeof MARKET_STATUS];