# Resolution and Dispute System Implementation Plan

## Overview
This document outlines the implementation plan for a comprehensive resolution and dispute system for the BlockCast platform. The system will leverage Hedera's native capabilities including HTS (Hedera Token Service), HCS (Hedera Consensus Service), and smart contracts to handle market resolution through API data integration, provide a dispute period for users to contest resolutions, and allow admin review of disputes for final resolution.

## Current System Analysis

### Existing Architecture
- **Frontend**: React/TypeScript with Tailwind CSS
- **Backend**: Supabase for data persistence
- **Blockchain**: Hedera network integration with HBAR and Hedera Agent Kit
- **Admin System**: Already implemented with role-based access
- **Market System**: Existing BettingMarket interface with status field
- **Hedera Integration**: Ready for HTS token operations, HCS consensus, and smart contract deployment

### Current Market States
```typescript
status: 'active' | 'resolving' | 'resolved'
resolution?: 'yes' | 'no'
```

### Existing Components & Services
- `BettingMarkets.tsx` - Main market display component
- `MarketPage.tsx` - Individual market detail page
- `AdminDashboard.tsx` - Admin overview with stats
- `adminService.ts` - Admin operations service
- `pendingMarketsService.ts` - Market approval service
- Supabase integration already in place

## System Architecture

### 1. Hedera-Native Resolution Flow
```
API Data → HCS Message → Pending Resolution → HTS Token Lock → Dispute Period → Final Resolution
     ↓           ↓              ↓                   ↓              ↓              ↓
  System    Consensus      User Interface      Stake Lock    User Disputes    Admin Review
                                                              ↓
                                               Smart Contract Arbitration (Optional)
```

### 2. Hedera Service Integration
- **HCS (Hedera Consensus Service)**: Resolution events and dispute submissions
- **HTS (Hedera Token Service)**: Dispute bonds and stakeholder tokens  
- **Smart Contracts**: Advanced arbitration logic and automated resolution
- **Hedera Agent Kit**: Streamlined interaction with all Hedera services

### 3. New Market Status States
```typescript
// Extended status types with Hedera integration
status: 'active' | 'pending_resolution' | 'disputing' | 'resolved' | 'disputed_resolution' | 'locked'

// Enhanced resolution data structure with Hedera references
resolution: {
  outcome: 'yes' | 'no' | null;
  source: string; // API source
  timestamp: Date;
  apiData: any; // Raw API response
  confidence: 'high' | 'medium' | 'low';
  disputePeriodEnd: Date;
  finalResolution?: 'yes' | 'no';
  resolvedBy?: 'api' | 'admin' | 'contract';
  adminNotes?: string;
  // Hedera-specific fields
  hcsTopicId?: string; // Topic ID for resolution messages
  htsTokenId?: string; // Token ID for dispute bonds
  contractId?: string; // Smart contract handling complex disputes
  transactionId?: string; // Hedera transaction ID for resolution
}
```

## Implementation Plan

### Phase 1: Database Schema Updates (Day 1-2)

#### 1.1 Supabase Schema Changes with Hedera Integration
```sql
-- Market Resolution Table with Hedera fields
CREATE TABLE market_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id VARCHAR NOT NULL,
  outcome VARCHAR CHECK (outcome IN ('yes', 'no')),
  source VARCHAR NOT NULL,
  api_data JSONB,
  confidence VARCHAR CHECK (confidence IN ('high', 'medium', 'low')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  dispute_period_end TIMESTAMPTZ NOT NULL,
  final_outcome VARCHAR CHECK (final_outcome IN ('yes', 'no')),
  resolved_by VARCHAR CHECK (resolved_by IN ('api', 'admin', 'contract')),
  admin_notes TEXT,
  -- Hedera-specific fields
  hcs_topic_id VARCHAR, -- HCS topic for resolution messages
  hts_token_id VARCHAR, -- HTS token for dispute bonds
  contract_id VARCHAR, -- Smart contract for advanced arbitration
  transaction_id VARCHAR, -- Hedera transaction ID
  consensus_timestamp TIMESTAMPTZ, -- Hedera consensus timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Disputes Table with Hedera integration
CREATE TABLE market_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id VARCHAR NOT NULL,
  resolution_id UUID REFERENCES market_resolutions(id),
  user_id VARCHAR NOT NULL,
  dispute_reason TEXT NOT NULL,
  evidence_url VARCHAR,
  evidence_description TEXT,
  status VARCHAR CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'contract_processing')) DEFAULT 'pending',
  admin_response TEXT,
  -- Hedera-specific fields
  bond_amount DECIMAL(15,2), -- HTS token bond amount
  bond_transaction_id VARCHAR, -- Transaction ID for bond payment
  hcs_message_id VARCHAR, -- HCS message ID for dispute submission
  arbitration_contract_id VARCHAR, -- Contract handling this dispute
  bond_refund_transaction_id VARCHAR, -- Transaction ID for bond refund
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HCS Topics Table for tracking consensus topics
CREATE TABLE hcs_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id VARCHAR UNIQUE NOT NULL,
  topic_type VARCHAR NOT NULL, -- 'resolution', 'dispute', 'admin'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HTS Tokens Table for tracking dispute bonds and utility tokens
CREATE TABLE hts_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id VARCHAR UNIQUE NOT NULL,
  token_name VARCHAR NOT NULL,
  token_symbol VARCHAR NOT NULL,
  token_type VARCHAR CHECK (token_type IN ('fungible', 'non_fungible')),
  purpose VARCHAR NOT NULL, -- 'dispute_bond', 'governance', 'reward'
  decimals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced indexes
CREATE INDEX idx_market_resolutions_market_id ON market_resolutions(market_id);
CREATE INDEX idx_market_resolutions_hcs_topic ON market_resolutions(hcs_topic_id);
CREATE INDEX idx_market_disputes_market_id ON market_disputes(market_id);
CREATE INDEX idx_market_disputes_status ON market_disputes(status);
CREATE INDEX idx_market_disputes_bond_transaction ON market_disputes(bond_transaction_id);
CREATE INDEX idx_hcs_topics_type ON hcs_topics(topic_type);
CREATE INDEX idx_hts_tokens_purpose ON hts_tokens(purpose);
```

#### 1.2 Update Existing Market Schema
```sql
-- Add new columns to existing markets table
ALTER TABLE markets 
ADD COLUMN resolution_data JSONB,
ADD COLUMN dispute_count INTEGER DEFAULT 0,
ADD COLUMN dispute_period_end TIMESTAMPTZ;

-- Update status enum to include new states
ALTER TABLE markets 
ALTER COLUMN status TYPE VARCHAR;
-- Update existing status values in code, not SQL
```

### Phase 2: Backend Services with Hedera Agent Kit (Day 2-5)

#### 2.1 Hedera Service Integration (`hederaService.ts`)
```typescript
import { HederaLangchainToolkit, coreQueriesPlugin, coreTokenPlugin, coreConsensusPlugin } from 'hedera-agent-kit';
import { Client, PrivateKey } from '@hashgraph/sdk';

interface HederaService {
  // HCS Operations
  createResolutionTopic(marketId: string): Promise<string>;
  submitResolutionMessage(topicId: string, resolutionData: any): Promise<string>;
  submitDisputeMessage(topicId: string, disputeData: any): Promise<string>;
  
  // HTS Operations  
  createDisputeBondToken(): Promise<string>;
  lockDisputeBond(userId: string, amount: number): Promise<string>;
  refundDisputeBond(userId: string, transactionId: string): Promise<string>;
  
  // Smart Contract Operations (Optional)
  deployArbitrationContract(marketId: string): Promise<string>;
  executeArbitration(contractId: string, disputeData: any): Promise<string>;
  
  // Utility Functions
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
  getAccountBalance(accountId: string): Promise<AccountBalance>;
}
```

#### 2.2 Enhanced Resolution Service (`resolutionService.ts`)
```typescript
interface ResolutionService {
  // API Integration
  fetchResolutionFromAPI(marketId: string, apiSource: string): Promise<ResolutionData>;
  scheduleResolution(marketId: string, resolutionDate: Date): void;
  
  // Resolution Management with Hedera
  initiateResolution(marketId: string, apiData: any): Promise<{
    resolutionId: string;
    hcsTopicId: string;
    transactionId: string;
  }>;
  finalizeResolution(marketId: string, adminDecision?: string): Promise<{
    finalTransactionId: string;
    consensusTimestamp: Date;
  }>;
  
  // Dispute Period with HCS
  startDisputePeriod(marketId: string, duration: number): Promise<{
    topicId: string;
    disputePeriodEnd: Date;
  }>;
  checkDisputePeriodExpired(marketId: string): Promise<boolean>;
  
  // Hedera-specific methods
  publishResolutionToHCS(marketId: string, resolution: ResolutionData): Promise<string>;
  lockMarketAssets(marketId: string): Promise<string>;
  unlockMarketAssets(marketId: string): Promise<string>;
}
```

#### 2.3 Enhanced Dispute Service (`disputeService.ts`)
```typescript
interface DisputeService {
  // User Disputes with HTS Bond System
  submitDispute(marketId: string, userId: string, disputeData: DisputeData): Promise<{
    disputeId: string;
    bondTransactionId: string;
    hcsMessageId: string;
  }>;
  getUserDisputes(userId: string): Promise<Dispute[]>;
  
  // Admin Management
  getPendingDisputes(): Promise<Dispute[]>;
  reviewDispute(disputeId: string, adminDecision: DisputeDecision): Promise<{
    reviewTransactionId: string;
    bondRefundTransactionId?: string;
  }>;
  getDisputeStatistics(): Promise<DisputeStats>;
  
  // Hedera-specific dispute methods
  validateDisputeBond(userId: string, requiredAmount: number): Promise<boolean>;
  processDisputeBond(userId: string, amount: number): Promise<string>;
  refundDisputeBond(disputeId: string): Promise<string>;
  publishDisputeToHCS(disputeData: DisputeData): Promise<string>;
  
  // Smart Contract Arbitration (Advanced)
  initiateContractArbitration(disputeId: string): Promise<string>;
  getContractArbitrationResult(contractId: string): Promise<ArbitrationResult>;
}
```

#### 2.4 API Integration Service with Hedera Logging (`apiIntegrationService.ts`)
```typescript
interface APIIntegrationService {
  // Sports/Event APIs
  fetchFootballMatchResult(matchId: string): Promise<MatchResult>;
  fetchFlashscoreData(eventId: string): Promise<EventResult>;
  
  // News/Fact-checking APIs
  fetchNewsVerification(claim: string): Promise<FactCheckResult>;
  
  // Generic API handler with HCS logging
  fetchFromSource(source: string, params: any): Promise<{
    data: any;
    hcsLogMessageId: string; // Log API calls to HCS for auditability
  }>;
  validateAPIResponse(response: any, expectedFormat: any): boolean;
  
  // Hedera-specific API logging
  logAPICallToHCS(source: string, request: any, response: any): Promise<string>;
  getAPICallHistory(marketId: string): Promise<APICallLog[]>;
}
```

#### 2.5 Smart Contract Service (`smartContractService.ts`)
```typescript
interface SmartContractService {
  // Arbitration Contract Management
  deployArbitrationContract(marketId: string, config: ArbitrationConfig): Promise<{
    contractId: string;
    deploymentTransactionId: string;
  }>;
  
  // Automated Resolution Logic
  executeAutomatedResolution(contractId: string, apiData: any): Promise<{
    outcome: 'yes' | 'no';
    confidence: number;
    transactionId: string;
  }>;
  
  // Multi-Stakeholder Voting
  initializeStakeholderVoting(contractId: string, stakeholders: string[]): Promise<string>;
  castVote(contractId: string, stakeholder: string, vote: 'yes' | 'no'): Promise<string>;
  finalizeVoting(contractId: string): Promise<VotingResult>;
  
  // HTS Integration via Smart Contracts  
  createGovernanceToken(name: string, symbol: string): Promise<string>;
  distributeVotingPower(tokenId: string, allocations: TokenAllocation[]): Promise<string>;
  
  // Oracle Integration
  submitOracleData(contractId: string, oracleData: OracleData): Promise<string>;
  verifyOracleConsensus(contractId: string): Promise<ConsensusResult>;
}
```

### Phase 3: Frontend Components with Hedera Integration (Day 5-8)

#### 3.1 Enhanced Resolution Status Components
```typescript
// ResolutionStatus.tsx - Shows resolution state with Hedera details
interface ResolutionStatusProps {
  market: BettingMarket;
  resolution?: ResolutionData;
  onDispute?: () => void;
  // Hedera-specific props
  hcsTopicId?: string;
  transactionId?: string;
  consensusTimestamp?: Date;
  showTransactionLink?: boolean;
}

// DisputePeriodCounter.tsx - Enhanced countdown with HCS updates
interface DisputePeriodCounterProps {
  endTime: Date;
  onExpire: () => void;
  hcsTopicId?: string; // Subscribe to HCS topic for real-time updates
  showConsensusTime?: boolean;
}

// HederaTransactionStatus.tsx - Shows Hedera transaction details
interface HederaTransactionStatusProps {
  transactionId: string;
  type: 'resolution' | 'dispute' | 'bond' | 'refund';
  showDetails?: boolean;
}
```

#### 3.2 Enhanced Dispute Interface Components with HTS Bond System
```typescript
// DisputeModal.tsx - Modal with HTS bond management
interface DisputeModalProps {
  isOpen: boolean;
  marketId: string;
  resolution: ResolutionData;
  onSubmit: (disputeData: DisputeData) => void;
  onClose: () => void;
  // Hedera-specific props
  bondAmount: number;
  userTokenBalance: number;
  htsTokenId: string;
  showBondCalculator?: boolean;
}

// DisputeBondCalculator.tsx - Calculate required bond for dispute
interface DisputeBondCalculatorProps {
  marketValue: number;
  disputeType: 'evidence' | 'interpretation' | 'api_error';
  userReputationScore?: number;
  onBondCalculated: (amount: number) => void;
}

// DisputeForm.tsx - Enhanced form with Hedera integration
interface DisputeFormProps {
  onSubmit: (data: DisputeFormData) => void;
  initialData?: Partial<DisputeFormData>;
  bondAmount: number;
  htsTokenId: string;
  showHCSPublication?: boolean; // Show HCS message publication status
}

// DisputeList.tsx - List with Hedera transaction details
interface DisputeListProps {
  marketId: string;
  disputes: Dispute[];
  canViewDetails?: boolean;
  showTransactionHistory?: boolean;
  hcsTopicId?: string;
}

// HCSMessageViewer.tsx - View HCS messages for transparency
interface HCSMessageViewerProps {
  topicId: string;
  messageType: 'resolution' | 'dispute' | 'admin';
  showTimestamps?: boolean;
  allowFiltering?: boolean;
}
```

#### 3.3 Enhanced Admin Dispute Management Components
```typescript
// AdminDisputePanel.tsx - Admin panel with Hedera integration
interface AdminDisputePanelProps {
  disputes: Dispute[];
  onReviewDispute: (disputeId: string, decision: DisputeDecision) => void;
  // Hedera-specific props
  showHCSHistory?: boolean;
  showBondTransactions?: boolean;
  enableContractArbitration?: boolean;
}

// DisputeReviewCard.tsx - Individual dispute review with transaction details
interface DisputeReviewCardProps {
  dispute: Dispute;
  market: BettingMarket;
  onAccept: () => void;
  onReject: (reason: string) => void;
  // Hedera integration
  bondTransactionId?: string;
  hcsMessageId?: string;
  showAPICallHistory?: boolean;
}

// HederaAdminDashboard.tsx - Enhanced admin dashboard
interface HederaAdminDashboardProps {
  // Standard admin features
  stats: AdminStats;
  // Hedera-specific features
  hcsTopics: HCSTopic[];
  htsTokens: HTSToken[];
  activeContracts: SmartContract[];
  systemHealth: HederaSystemHealth;
}

// TokenBondManager.tsx - Manage HTS dispute bonds
interface TokenBondManagerProps {
  tokenId: string;
  totalBondsLocked: number;
  pendingRefunds: BondRefund[];
  onProcessRefund: (refundId: string) => void;
  onAdjustBondRequirements: (newRequirements: BondRequirements) => void;
}
```

### Phase 4: UI Integration (Day 6-8)

#### 4.1 Market Page Updates
- Add resolution status section
- Display API source and confidence
- Show dispute period countdown
- Add "Dispute Resolution" button
- Display existing disputes count

#### 4.2 Admin Dashboard Updates
- Add "Pending Disputes" section
- Show dispute statistics
- Quick actions for dispute review
- Resolution override capabilities

#### 4.3 User Portfolio Updates
- Show disputed positions
- Display resolution status for each bet
- Add dispute history section

### Phase 5: Hedera Smart Contract Development (Day 8-11)

#### 5.1 Arbitration Smart Contract (`ArbitrationContract.sol`)
```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

import "./HederaTokenService.sol";

contract MarketArbitration {
    struct Market {
        string marketId;
        string outcome;
        uint256 confidence;
        bool disputed;
        uint256 disputeEndTime;
        address resolver;
    }
    
    struct Dispute {
        string disputeId;
        address disputant;
        string reason;
        uint256 bondAmount;
        bool resolved;
        bool successful;
    }
    
    mapping(string => Market) public markets;
    mapping(string => Dispute[]) public marketDisputes;
    mapping(address => uint256) public userReputationScores;
    
    address public htsTokenAddress;
    address public admin;
    uint256 public constant MINIMUM_BOND = 100; // 100 BCDB tokens
    
    event MarketResolved(string indexed marketId, string outcome, uint256 confidence);
    event DisputeSubmitted(string indexed marketId, string disputeId, address disputant);
    event DisputeResolved(string indexed disputeId, bool successful);
    event BondSlashed(address indexed disputant, uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    function submitResolution(
        string memory marketId,
        string memory outcome,
        uint256 confidence
    ) external onlyAdmin {
        markets[marketId] = Market({
            marketId: marketId,
            outcome: outcome,
            confidence: confidence,
            disputed: false,
            disputeEndTime: block.timestamp + 48 hours,
            resolver: msg.sender
        });
        
        emit MarketResolved(marketId, outcome, confidence);
    }
    
    function submitDispute(
        string memory marketId,
        string memory disputeId,
        string memory reason,
        uint256 bondAmount
    ) external {
        require(markets[marketId].disputeEndTime > block.timestamp, "Dispute period ended");
        require(bondAmount >= MINIMUM_BOND, "Insufficient bond amount");
        
        // Lock HTS tokens as bond
        bool success = HederaTokenService.transferToken(
            htsTokenAddress, 
            msg.sender, 
            address(this), 
            int64(uint64(bondAmount))
        );
        require(success, "Bond transfer failed");
        
        marketDisputes[marketId].push(Dispute({
            disputeId: disputeId,
            disputant: msg.sender,
            reason: reason,
            bondAmount: bondAmount,
            resolved: false,
            successful: false
        }));
        
        markets[marketId].disputed = true;
        emit DisputeSubmitted(marketId, disputeId, msg.sender);
    }
    
    function resolveDispute(
        string memory marketId,
        uint256 disputeIndex,
        bool successful
    ) external onlyAdmin {
        Dispute storage dispute = marketDisputes[marketId][disputeIndex];
        require(!dispute.resolved, "Dispute already resolved");
        
        dispute.resolved = true;
        dispute.successful = successful;
        
        if (successful) {
            // Refund bond to disputant
            HederaTokenService.transferToken(
                htsTokenAddress,
                address(this),
                dispute.disputant,
                int64(uint64(dispute.bondAmount))
            );
            
            // Increase reputation
            userReputationScores[dispute.disputant] += 10;
        } else {
            // Slash 50% of bond, refund 50%
            uint256 slashAmount = dispute.bondAmount / 2;
            uint256 refundAmount = dispute.bondAmount - slashAmount;
            
            if (refundAmount > 0) {
                HederaTokenService.transferToken(
                    htsTokenAddress,
                    address(this),
                    dispute.disputant,
                    int64(uint64(refundAmount))
                );
            }
            
            // Decrease reputation
            if (userReputationScores[dispute.disputant] > 5) {
                userReputationScores[dispute.disputant] -= 5;
            }
            
            emit BondSlashed(dispute.disputant, slashAmount);
        }
        
        emit DisputeResolved(dispute.disputeId, successful);
    }
}
```

#### 5.2 Oracle Integration Contract (`OracleResolver.sol`) 
```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

contract OracleResolver {
    struct OracleData {
        string source;
        string data;
        uint256 timestamp;
        uint256 confidence;
        address submitter;
    }
    
    mapping(string => OracleData[]) public marketOracles;
    mapping(address => bool) public trustedOracles;
    address public admin;
    
    event OracleDataSubmitted(string indexed marketId, string source, uint256 confidence);
    event AutoResolutionTriggered(string indexed marketId, string outcome);
    
    modifier onlyTrustedOracle() {
        require(trustedOracles[msg.sender], "Not a trusted oracle");
        _;
    }
    
    function submitOracleData(
        string memory marketId,
        string memory source,
        string memory data,
        uint256 confidence
    ) external onlyTrustedOracle {
        marketOracles[marketId].push(OracleData({
            source: source,
            data: data,
            timestamp: block.timestamp,
            confidence: confidence,
            submitter: msg.sender
        }));
        
        emit OracleDataSubmitted(marketId, source, confidence);
        
        // Auto-resolve if high confidence consensus
        _checkAutoResolution(marketId);
    }
    
    function _checkAutoResolution(string memory marketId) internal {
        OracleData[] memory oracles = marketOracles[marketId];
        if (oracles.length >= 3) {
            uint256 avgConfidence = _calculateAverageConfidence(marketId);
            if (avgConfidence >= 90) {
                string memory outcome = _getConsensusOutcome(marketId);
                emit AutoResolutionTriggered(marketId, outcome);
            }
        }
    }
    
    function _calculateAverageConfidence(string memory marketId) internal view returns (uint256) {
        OracleData[] memory oracles = marketOracles[marketId];
        uint256 totalConfidence = 0;
        for (uint i = 0; i < oracles.length; i++) {
            totalConfidence += oracles[i].confidence;
        }
        return totalConfidence / oracles.length;
    }
    
    function _getConsensusOutcome(string memory marketId) internal view returns (string memory) {
        // Implement consensus logic based on oracle data
        // This is a simplified version - real implementation would be more sophisticated
        return "yes"; // Placeholder
    }
}
```

### Phase 6: API Integration with HCS Logging (Day 11-13)

#### 5.1 Football/Sports APIs
```typescript
// Example: Flashscore API integration
class FlashscoreAPI {
  async getMatchResult(matchId: string): Promise<MatchResult> {
    // Implementation for football match results
  }
  
  async validateMatchData(data: any): boolean {
    // Validate API response structure
  }
}
```

#### 5.2 News/Fact-checking APIs
```typescript
// Example: News API integration
class NewsVerificationAPI {
  async verifyStatement(statement: string): Promise<FactCheckResult> {
    // Implementation for news verification
  }
  
  async crossReferenceSource(sources: string[]): Promise<ConsensusResult> {
    // Cross-reference multiple sources
  }
}
```

#### 5.3 Scheduled Resolution Jobs
```typescript
// Background job for automatic resolution
class ResolutionScheduler {
  scheduleResolution(marketId: string, resolveAt: Date): void;
  processScheduledResolutions(): Promise<void>;
  handleAPIFailures(marketId: string, error: any): Promise<void>;
}
```

### Phase 6: Testing & Validation (Day 10-12)

#### 6.1 Unit Tests
- Resolution service functions
- Dispute submission validation
- API integration reliability
- Admin decision processing

#### 6.2 Integration Tests
- End-to-end resolution flow
- Dispute period management
- Admin workflow testing
- Database consistency checks

#### 6.3 User Acceptance Testing
- User dispute submission flow
- Admin dispute review workflow
- Resolution accuracy validation
- Mobile responsiveness

## Technical Implementation Details

### 1. Database Triggers
```sql
-- Auto-update market status when resolution is added
CREATE OR REPLACE FUNCTION update_market_status_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE markets 
  SET status = 'pending_resolution',
      dispute_period_end = NEW.dispute_period_end
  WHERE id = NEW.market_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resolution_status_trigger
  AFTER INSERT ON market_resolutions
  FOR EACH ROW
  EXECUTE FUNCTION update_market_status_on_resolution();
```

### 2. Real-time Updates
```typescript
// Supabase real-time subscription for resolution updates
const subscribeToResolutionUpdates = (marketId: string, callback: Function) => {
  return supabase
    .channel(`market-${marketId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'market_resolutions',
      filter: `market_id=eq.${marketId}`
    }, callback)
    .subscribe();
};
```

### 3. Error Handling & Fallbacks
```typescript
// Robust API integration with fallbacks
class ResolutionManager {
  async resolveMarket(marketId: string, sources: string[]) {
    for (const source of sources) {
      try {
        const result = await this.fetchFromAPI(source, marketId);
        if (this.validateResult(result)) {
          return await this.processResolution(marketId, result, source);
        }
      } catch (error) {
        console.warn(`API source ${source} failed:`, error);
        continue;
      }
    }
    
    // Fallback to manual admin resolution
    await this.flagForManualResolution(marketId);
  }
}
```

## Configuration & Settings

### 1. Enhanced Settings with Hedera Integration
```typescript
const HEDERA_RESOLUTION_SETTINGS = {
  // Standard settings
  disputePeriodHours: 48, // 48 hours default dispute period
  maxDisputesPerUser: 3, // Limit disputes per user per market
  minEvidenceLength: 100, // Minimum characters for dispute evidence
  autoResolveAfterHours: 72, // Auto-resolve if no disputes
  confidenceThresholds: {
    high: 0.9,   // 90%+ confidence auto-resolves
    medium: 0.7, // 70-89% confidence allows disputes
    low: 0.5     // <70% confidence requires manual review
  },
  
  // Hedera-specific settings
  network: 'testnet', // 'mainnet' | 'testnet' | 'previewnet'
  hcs: {
    resolutionTopicMemo: 'BlockCast Market Resolutions',
    disputeTopicMemo: 'BlockCast Dispute Submissions',
    adminTopicMemo: 'BlockCast Admin Actions',
    submitKeyRequired: false, // Set to true for private topics
  },
  hts: {
    disputeBondToken: {
      name: 'BlockCast Dispute Bond',
      symbol: 'BCDB',
      decimals: 2,
      initialSupply: 1000000, // 1 million tokens
      treasuryAccount: '0.0.xxxxx', // Admin account
    },
    minimumBondAmounts: {
      evidence: 100, // 100 BCDB tokens for evidence disputes
      interpretation: 250, // 250 BCDB tokens for interpretation disputes
      api_error: 500, // 500 BCDB tokens for API error disputes
    },
    bondSlashingPercentage: 50, // 50% of bond slashed for invalid disputes
  },
  smartContracts: {
    enableArbitration: true,
    gasLimitResolution: 300000,
    gasLimitDispute: 200000,
    maxContractExecutionTime: 300, // 5 minutes
  },
  agent: {
    mode: 'AUTONOMOUS', // 'AUTONOMOUS' | 'RETURN_BYTES'
    enabledPlugins: [
      'coreAccountPlugin',
      'coreConsensusPlugin', 
      'coreTokenPlugin',
      'coreEVMPlugin',
      'coreQueriesPlugin'
    ],
  }
};
```

### 2. API Source Configuration
```typescript
const API_SOURCES = {
  football: {
    flashscore: { 
      baseUrl: 'https://flashscore-api.com',
      rateLimitPerHour: 1000,
      reliability: 0.95
    },
    sportradar: {
      baseUrl: 'https://api.sportradar.com',
      rateLimitPerHour: 500,
      reliability: 0.98
    }
  },
  news: {
    factcheck: {
      baseUrl: 'https://factcheck-api.com',
      rateLimitPerHour: 200,
      reliability: 0.85
    }
  }
};
```

## Security Considerations

### 1. User Permissions
- Only users with active positions can dispute
- Rate limiting on dispute submissions
- Evidence URL validation and sanitization
- Admin role verification for resolution override

### 2. Data Validation
- API response validation schemas
- Input sanitization for dispute text
- File upload restrictions for evidence
- Cross-site scripting (XSS) prevention

### 3. Audit Trail
- All resolution decisions logged
- Admin action history maintained
- User dispute patterns tracked
- API call success/failure monitoring

## Deployment Strategy

### Phase 1: Hedera Network Setup and Testing
1. **Testnet Environment Setup**
   - Configure Hedera testnet accounts for admin and treasury
   - Deploy HTS dispute bond token on testnet
   - Create HCS topics for different message types
   - Test Hedera Agent Kit integration with all plugins

2. **Smart Contract Deployment (Testnet)**
   - Deploy arbitration smart contract
   - Deploy oracle resolver contract
   - Configure contract permissions and admin keys
   - Test contract interactions with HTS tokens

### Phase 2: Database Migration with Hedera Fields
1. Create enhanced tables with Hedera-specific fields in staging
2. Test Hedera transaction ID storage and retrieval
3. Deploy schema changes to production
4. Verify HCS topic and HTS token references

### Phase 3: Backend Service Deployment with Hedera Integration
1. Deploy Hedera service integration layer
2. Deploy enhanced resolution service with HCS publishing
3. Deploy dispute service with HTS bond management
4. Configure Hedera Agent Kit with proper credentials
5. Test all Hedera transactions in autonomous mode

### Phase 4: Frontend Component Deployment
1. Deploy Hedera-enhanced UI components
2. Update existing components with transaction status displays
3. Add HCS message viewers and transaction links
4. Test user workflows including bond payments

### Phase 5: Smart Contract Integration Activation
1. Deploy smart contracts to mainnet (if ready)
2. Configure oracle addresses and trusted sources
3. Enable advanced arbitration features
4. Monitor contract execution and gas costs

### Phase 6: Full System Integration Testing
1. End-to-end testing with real API data
2. Load testing with multiple concurrent disputes
3. HCS message throughput testing
4. Smart contract stress testing

## Success Metrics

### 1. Resolution Accuracy with Hedera Integration
- API resolution success rate > 95%
- False positive disputes < 5%  
- Admin override rate < 10%
- HCS message delivery success rate > 99.9%
- Smart contract execution success rate > 98%

### 2. User Engagement and Economic Incentives
- Dispute submission rate 2-5% of resolved markets
- Average dispute quality score > 7/10
- User satisfaction with resolution process > 85%
- Bond slashing rate for invalid disputes < 20%
- Average user reputation score improvement over time

### 3. System Performance and Hedera Network Efficiency
- Average resolution time < 24 hours
- Dispute review time < 48 hours
- API response time < 5 seconds
- HCS message consensus time < 5 seconds
- Smart contract execution time < 30 seconds
- Average transaction cost < $0.10
- Zero resolution conflicts or double-spending

### 4. Hedera-Specific Metrics
- HTS token circulation and liquidity
- HCS topic subscription and activity rates
- Smart contract gas efficiency (target < 300K gas per resolution)
- Network decentralization score (multiple oracle sources)
- Consensus timestamp accuracy vs system time < 1 second deviation

## Risk Mitigation

### 1. API Reliability and Oracle Security
- Multiple API source integration with cross-validation
- Fallback to manual resolution with HCS logging
- API health monitoring with automated alerts
- Rate limit management and circuit breakers
- Oracle manipulation detection via consensus mechanisms
- API call logging to HCS for complete auditability

### 2. Hedera Network Dependencies
- Multi-node consensus validation for critical transactions
- Automatic retry mechanisms for failed Hedera transactions
- Real-time monitoring of Hedera network status
- Fallback to HAPI when JSON-RPC relay is unavailable
- Gas price monitoring and optimization
- Account balance monitoring to prevent insufficient funds

### 3. Smart Contract Risk Management
- Formal verification of critical contract functions
- Multi-signature admin keys for contract operations
- Time-locked upgrades for contract modifications  
- Emergency pause functionality for critical bugs
- Gas limit optimization to prevent out-of-gas failures
- Contract audit by certified security firms

### 4. HTS Token Economics
- Token supply monitoring and inflation controls
- Bond amount dynamic adjustment based on market conditions
- Automated token distribution for ecosystem rewards
- Multi-signature treasury account management
- Regular token holder voting for parameter changes
- Economic attack prevention (e.g., bond manipulation)

### 5. Dispute Volume and Economic Attacks
- Dynamic bond requirements based on user reputation
- Automated spam detection using ML algorithms
- Rate limiting per account with exponential backoff
- Economic incentives alignment to discourage frivolous disputes
- Reputation-based dispute weighting systems
- Community governance for dispute parameter adjustments

### 6. Data Consistency and HCS Integration
- Database transaction integrity with Hedera transaction correlation
- Real-time HCS message validation and ordering
- Backup and recovery procedures for both database and Hedera state
- Cross-chain state reconciliation mechanisms
- Consensus timestamp synchronization
- Automatic conflict resolution for concurrent operations

## Post-Launch Monitoring

### 1. Analytics Dashboard
- Resolution accuracy metrics
- Dispute patterns analysis
- API performance monitoring
- User behavior tracking

### 2. Continuous Improvement
- Weekly resolution accuracy review
- Monthly dispute process optimization
- Quarterly API source evaluation
- Semi-annual user feedback collection

## Future Enhancements (Beyond MVP)

### 1. Advanced AI and Machine Learning Integration
- Automated dispute validity scoring using AI models deployed as Hedera smart contracts
- Resolution confidence prediction based on historical HCS data patterns
- Pattern recognition for fraud detection using on-chain behavioral analysis
- Natural language processing for evidence analysis with results published to HCS
- Sentiment analysis of community feedback via HCS topic monitoring

### 2. Enhanced Hedera Network Features
- Integration with Hedera File Service (HFS) for storing large evidence files
- Advanced HCS topic hierarchies for complex dispute categorization
- Custom HTS token features like scheduled transactions for automated payouts
- Integration with Hedera's future DID (Decentralized Identity) service
- Cross-shard transaction coordination for global market resolution
- Integration with Hedera Native Staking for governance token staking

### 3. Decentralized Governance and Community Features
- DAO governance using HTS governance tokens with voting smart contracts
- Community jury system with reputation-weighted voting via smart contracts
- Delegated dispute resolution with economic incentive alignment
- Cross-platform reputation system using Hedera Account Service
- Collaborative fact-checking network with HCS message verification
- Gamified verification rewards using NFT achievement tokens

### 4. Advanced Oracle and Data Features
- Multi-chain oracle network integration using Hedera as consensus layer
- Real-time event streaming with HCS subscription mechanisms
- Predictive resolution modeling using historical consensus data
- Decentralized API networks with quality-of-service smart contracts
- Time-series data analysis for market trend prediction
- Integration with IoT devices for real-world event verification

### 5. Enterprise and Institutional Features
- Institutional-grade compliance reporting via automated HCS logs
- Integration with traditional financial systems through Hedera bridges
- Advanced analytics dashboard with real-time Hedera network metrics
- API marketplace for third-party resolution services
- White-label resolution service deployment using contract templates
- Integration with legal frameworks for binding arbitration

### 6. Scalability and Performance Optimization
- Layer 2 scaling solutions while maintaining Hedera L1 security
- Advanced caching strategies for frequently accessed HCS topics
- Parallel processing of multiple market resolutions
- Dynamic resource allocation based on network congestion
- Advanced gas optimization techniques for smart contracts
- Cross-region deployment with Hedera mirror node synchronization

This enhanced implementation plan leverages Hedera's unique capabilities to build a world-class resolution and dispute system that provides transparency, efficiency, and trust while maintaining the flexibility to evolve with the platform's growing needs and the broader Hedera ecosystem.