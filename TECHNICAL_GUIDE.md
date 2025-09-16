# BlockCast Technical Implementation Guide

This document provides comprehensive technical details for developers working on BlockCast's AI-powered prediction market platform with dispute resolution system.

---

## 🏗️ System Architecture

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Hedera Hashgraph (Testnet)
- **AI**: Anthropic Claude 3 Haiku
- **Smart Contracts**: Solidity + Hardhat
- **File Storage**: IPFS integration ready

### **Service Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  AI Proxy       │    │ Market Monitor  │
│   Port: 5173    │◄──►│  Port: 3001     │    │  Port: 3002     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Supabase DB   │◄─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │ Hedera Network  │
                        │  (Contracts +   │
                        │   HCS Topics)   │
                        └─────────────────┘
```

---

## 🗄️ Database Schema

### **Enhanced Market Schema**
```sql
-- Main markets table with dispute support
CREATE TABLE approved_markets (
  id SERIAL PRIMARY KEY,
  claim TEXT NOT NULL,
  category TEXT,
  source TEXT,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'pending_resolution', 'disputing', 'resolved', 'disputed_resolution', 'locked')),
  expires_at TIMESTAMPTZ,
  contract_address TEXT, -- Hedera contract address
  resolution_data JSONB, -- AI resolution details
  dispute_count INTEGER DEFAULT 0,
  dispute_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market resolutions with AI data
CREATE TABLE market_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id VARCHAR NOT NULL,
  outcome VARCHAR CHECK (outcome IN ('yes', 'no')),
  source VARCHAR NOT NULL,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  reasoning TEXT,
  api_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  dispute_period_end TIMESTAMPTZ NOT NULL,
  final_outcome VARCHAR CHECK (final_outcome IN ('yes', 'no')),
  resolved_by VARCHAR CHECK (resolved_by IN ('api', 'admin', 'contract')),
  admin_notes TEXT,
  -- Hedera integration fields
  hcs_topic_id VARCHAR,
  hts_token_id VARCHAR,
  transaction_id VARCHAR,
  consensus_timestamp TIMESTAMPTZ
);

-- Dispute system
CREATE TABLE market_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id VARCHAR NOT NULL,
  resolution_id UUID REFERENCES market_resolutions(id),
  user_id VARCHAR NOT NULL,
  dispute_reason TEXT NOT NULL,
  evidence_description TEXT,
  evidence_urls TEXT[], -- Array of evidence links
  status VARCHAR CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')) DEFAULT 'pending',
  admin_response TEXT,
  bond_amount DECIMAL(15,2), -- CAST tokens bonded
  bond_transaction_id VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🤖 AI Integration

### **Anthropic Claude Integration** (`src/services/anthropicClient.ts`)
```typescript
export interface AIAnalysisRequest {
  marketId: string;
  claim: string;
  evidence: Evidence[];
  context?: {
    region?: string;
    language?: string;
    category?: string;
  };
}

export interface AIAnalysisResponse {
  recommendation: 'yes' | 'no' | 'invalid';
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  evidenceSummary: string;
  sources: string[];
  flags: string[];
}

class AnthropicClient {
  async analyzeMarket(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);

    const response = await fetch('/api/anthropic-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    return this.parseAIResponse(await response.json());
  }
}
```

### **Market Monitor Service** (`src/services/marketMonitorService.ts`)
```typescript
class MarketMonitorService {
  private monitorInterval: NodeJS.Timeout | null = null;

  start() {
    this.monitorInterval = setInterval(async () => {
      await this.processExpiredMarkets();
    }, 60000); // 60 second cycles
  }

  async processExpiredMarkets() {
    const expiredMarkets = await this.getExpiredMarkets();

    for (const market of expiredMarkets) {
      await this.resolveMarket(market);
    }
  }

  async resolveMarket(market: BettingMarket) {
    // 1. Collect evidence
    const evidence = await this.collectMarketEvidence(market.id);

    // 2. AI analysis
    const analysis = await this.anthropicClient.analyzeMarket({
      marketId: market.id,
      claim: market.claim,
      evidence
    });

    // 3. Execute resolution based on confidence
    if (analysis.confidence >= 0.9) {
      await this.executeOnChainResolution(market, analysis);
    } else if (analysis.confidence >= 0.7) {
      await this.queueForAdminReview(market, analysis);
    } else {
      await this.flagForManualResolution(market, analysis);
    }
  }
}
```

---

## 🎯 Dispute System Implementation

### **Market Status Logic** (`src/components/BettingMarkets.tsx`)
```typescript
const isMarketDisputable = (market: BettingMarket): boolean => {
  if (!market.expiresAt || market.status === 'resolved') return false;

  const now = new Date();
  const disputePeriodEnd = market.dispute_period_end
    ? new Date(market.dispute_period_end)
    : new Date(market.expiresAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours

  return now <= disputePeriodEnd &&
         (market.status === 'pending_resolution' || market.status === 'disputing');
};

const getMarketStatusLabel = (market: BettingMarket): string => {
  if (market.status === 'resolved') return 'Resolved';
  if (isMarketDisputable(market)) return 'Disputable';
  return 'Resolved';
};
```

### **Dispute Submission** (`src/components/BettingMarkets.tsx`)
```typescript
const submitDispute = async () => {
  if (!disputeMarket || !disputeReason.trim()) {
    toast.error('Please provide a reason for the dispute');
    return;
  }

  try {
    // Submit dispute to database
    const { data, error } = await supabase
      .from('market_disputes')
      .insert({
        market_id: disputeMarket.id,
        user_id: 'current-user-id', // Replace with actual user ID
        dispute_reason: disputeReason,
        evidence_description: disputeEvidence,
        status: 'pending',
        bond_amount: 25.00 // CAST tokens
      });

    if (error) throw error;

    toast.success('Dispute submitted successfully. It will be reviewed by moderators.');
    setShowDisputeDialog(false);
  } catch (error) {
    toast.error('Failed to submit dispute');
    console.error('Dispute submission error:', error);
  }
};
```

---

## 🌐 Hedera Integration

### **Contract Addresses (Testnet)**
```typescript
const HEDERA_CONTRACTS = {
  ADMIN_MANAGER: '0xbeD4F659fFc3f01e0094d4705aDDC5DefB93F979',
  CAST_TOKEN: '0x154Ea3D6E7ce1b8194992BAf296603c8bB126373',
  TREASURY: '0x358Ed5B43eBe9e55D37AF5466a9f0472D76E4635',
  BET_NFT: '0xA8Af2EF4695Ca72803B058e46Dd2a55aEe3801b3',
  PREDICTION_MARKET_FACTORY: '0x934caa95f90C546c989F80D56147d28b1a1309D5'
};
```

### **Smart Contract Integration**
```typescript
class HederaEVMService {
  async resolveMarket(contractAddress: string, outcome: 'yes' | 'no') {
    const contract = new ethers.Contract(
      contractAddress,
      predictionMarketABI,
      this.signer
    );

    const outcomeEnum = outcome === 'yes' ? 2 : 3; // Contract enum values

    const tx = await contract.resolveMarket(outcomeEnum);
    await tx.wait();

    return tx.hash;
  }
}
```

### **HCS Integration**
```typescript
class HCSService {
  async submitEvidence(marketId: string, evidence: Evidence) {
    const message = {
      type: 'evidence',
      marketId,
      evidence,
      timestamp: new Date().toISOString(),
      submitter: evidence.userId
    };

    const response = await this.client.submitMessage(
      this.evidenceTopicId,
      JSON.stringify(message)
    );

    return response.transactionId;
  }

  async publishAIAttestation(marketId: string, analysis: AIAnalysisResponse) {
    const attestation = {
      type: 'ai_attestation',
      marketId,
      outcome: analysis.recommendation,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      timestamp: new Date().toISOString(),
      model: 'claude-3-haiku-20240307'
    };

    const response = await this.client.submitMessage(
      this.attestationTopicId,
      JSON.stringify(attestation)
    );

    return response.transactionId;
  }
}
```

---

## 🎮 UI Component Structure

### **Enhanced Market Cards**
```typescript
// Market card with dispute functionality
const MarketCard: React.FC<{ market: BettingMarket }> = ({ market }) => {
  const marketDisputable = isMarketDisputable(market);
  const marketStatus = getMarketStatusLabel(market);

  return (
    <Card>
      {/* Market info display */}

      {/* Status badge */}
      <Badge className={getMarketStatusColor(market)}>
        {marketStatus}
      </Badge>

      {/* Conditional action buttons */}
      {marketDisputable ? (
        <>
          <Button onClick={() => handleEvidenceSubmission(market)}>
            Submit Evidence
          </Button>
          <Button onClick={() => handleDispute(market)}>
            Dispute Resolution
          </Button>
        </>
      ) : (
        <div>Market Resolved - No further actions available</div>
      )}
    </Card>
  );
};
```

### **Dispute Dialog Component**
```typescript
const DisputeDialog: React.FC<DisputeDialogProps> = ({
  isOpen,
  disputeMarket,
  onClose
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dispute Market Resolution</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Dispute form fields */}
          <div>
            <Label>Reason for Dispute *</Label>
            <Input
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="e.g., Incorrect information, biased sources..."
            />
          </div>

          <div>
            <Label>Supporting Evidence</Label>
            <textarea
              value={disputeEvidence}
              onChange={(e) => setDisputeEvidence(e.target.value)}
              placeholder="Provide links, sources, or additional context..."
              rows={3}
            />
          </div>

          {/* Bond warning */}
          <div className="bg-yellow-50 p-2 rounded text-xs">
            ⚠️ Disputes are reviewed by moderators. False disputes may result in penalties.
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={submitDispute}>
            Submit Dispute
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

---

## 🔄 Resolution Flow Implementation

### **Complete Resolution Pipeline**
```typescript
class ResolutionPipeline {
  async processMarketResolution(marketId: string) {
    // 1. Market expiration detection
    const market = await this.getMarket(marketId);
    if (!this.isExpired(market)) return;

    // 2. Evidence collection
    const evidence = await this.collectEvidence(marketId);

    // 3. AI analysis
    const analysis = await this.anthropicClient.analyzeMarket({
      marketId,
      claim: market.claim,
      evidence
    });

    // 4. Store AI resolution
    const resolution = await this.storeResolution(marketId, analysis);

    // 5. Start dispute period
    await this.startDisputePeriod(marketId, resolution.id);

    // 6. Execute based on confidence
    if (analysis.confidence >= 0.9) {
      await this.executeImmedateResolution(market, analysis);
    } else {
      await this.waitForDisputes(marketId);
    }
  }

  async processDisputes(marketId: string) {
    const disputes = await this.getPendingDisputes(marketId);
    const resolution = await this.getResolution(marketId);

    // Admin review required
    if (disputes.length > 0) {
      await this.flagForAdminReview(marketId, {
        resolution,
        disputes,
        recommendedAction: this.analyzeDisputes(disputes)
      });
    } else {
      // No disputes, finalize resolution
      await this.finalizeResolution(marketId, resolution);
    }
  }
}
```

---

## 🚀 Deployment Configuration

### **Environment Variables**
```bash
# Core Application
NODE_ENV=production
PORT=3000

# AI Integration
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Hedera Network
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.your-account
HEDERA_PRIVATE_KEY=0x-your-private-key

# Smart Contracts (Testnet)
CONTRACT_ADMIN_MANAGER=0xbeD4F659fFc3f01e0094d4705aDDC5DefB93F979
CONTRACT_CAST_TOKEN=0x154Ea3D6E7ce1b8194992BAf296603c8bB126373
CONTRACT_TREASURY=0x358Ed5B43eBe9e55D37AF5466a9f0472D76E4635
CONTRACT_BET_NFT=0xA8Af2EF4695Ca72803B058e46Dd2a55aEe3801b3
CONTRACT_PREDICTION_MARKET_FACTORY=0x934caa95f90C546c989F80D56147d28b1a1309D5

# HCS Topics
HCS_EVIDENCE_TOPIC=0.0.your-evidence-topic
HCS_AI_ATTESTATIONS_TOPIC=0.0.your-attestation-topic
HCS_CHALLENGES_TOPIC=0.0.your-challenge-topic

# JSON RPC
JSON_RPC_URL=https://testnet.hashio.io/api
```

### **Docker Configuration** (Optional)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Expose ports
EXPOSE 3000 3001 3002

# Start services
CMD ["npm", "run", "start"]
```

---

## 🧪 Testing Strategy

### **Unit Tests**
```typescript
// Market monitor service tests
describe('MarketMonitorService', () => {
  test('should detect expired markets', async () => {
    const service = new MarketMonitorService();
    const markets = await service.getExpiredMarkets();
    expect(markets).toBeInstanceOf(Array);
  });

  test('should resolve high confidence markets automatically', async () => {
    const mockAnalysis = {
      confidence: 0.95,
      recommendation: 'yes' as const
    };
    const result = await service.executeOnChainResolution(mockMarket, mockAnalysis);
    expect(result).toBeTruthy();
  });
});

// Dispute system tests
describe('DisputeSystem', () => {
  test('should calculate dispute window correctly', () => {
    const market = { expiresAt: new Date(), status: 'pending_resolution' as const };
    expect(isMarketDisputable(market)).toBe(true);
  });

  test('should prevent disputes on resolved markets', () => {
    const market = { expiresAt: new Date(), status: 'resolved' as const };
    expect(isMarketDisputable(market)).toBe(false);
  });
});
```

### **Integration Tests**
```typescript
describe('End-to-End Resolution Flow', () => {
  test('complete market resolution pipeline', async () => {
    // 1. Create test market
    const market = await createTestMarket();

    // 2. Force expiry
    await forceMarketExpiry(market.id);

    // 3. Trigger monitor
    await triggerMonitorCycle();

    // 4. Verify resolution
    const resolved = await getMarket(market.id);
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolution_data).toBeDefined();
  });
});
```

---

## 🔍 Monitoring & Debugging

### **Health Check Endpoints**
```typescript
// AI Proxy health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    provider: process.env.AI_PROVIDER,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Market Monitor health
app.get('/health', (req, res) => {
  res.json({
    status: monitorService.isRunning ? 'running' : 'stopped',
    lastCycle: monitorService.lastCycleTime,
    processedMarkets: monitorService.stats.processed,
    errors: monitorService.stats.errors
  });
});
```

### **Logging Strategy**
```typescript
class Logger {
  static logResolution(marketId: string, analysis: AIAnalysisResponse) {
    console.log(`[RESOLUTION] Market ${marketId}:`, {
      outcome: analysis.recommendation,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning.substring(0, 100) + '...'
    });
  }

  static logDispute(disputeId: string, marketId: string) {
    console.log(`[DISPUTE] New dispute ${disputeId} for market ${marketId}`);
  }

  static logError(context: string, error: any) {
    console.error(`[ERROR] ${context}:`, error);
  }
}
```

---

## 🚨 Security Considerations

### **Input Validation**
```typescript
const disputeSchema = {
  marketId: { type: 'string', required: true },
  reason: { type: 'string', required: true, minLength: 10 },
  evidence: { type: 'string', maxLength: 5000 }
};

function validateDisputeInput(data: any): boolean {
  // Implement validation logic
  return true;
}
```

### **Rate Limiting**
```typescript
const disputeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 disputes per hour per user
  message: 'Too many disputes submitted. Try again later.'
});

app.post('/api/disputes', disputeRateLimit, submitDispute);
```

### **Error Handling**
```typescript
class ErrorHandler {
  static async handleAIError(error: any, marketId: string) {
    Logger.logError('AI Analysis Failed', { error, marketId });

    // Fallback to manual review
    await this.flagForManualReview(marketId, {
      reason: 'AI analysis failed',
      error: error.message
    });
  }

  static async handleContractError(error: any, marketId: string) {
    Logger.logError('Contract Execution Failed', { error, marketId });

    // Retry mechanism
    await this.scheduleRetry(marketId, 'contract_execution');
  }
}
```

---

## 🔍 System Implementation Analysis

### **✅ COMPLETED COMPONENTS (Working & Tested)**

#### **Evidence Collection System** ✅
- **File**: `src/utils/evidenceService.ts`
- **Status**: **FULLY OPERATIONAL**
- **Features**: Real HBAR payments (0.1 fee), Supabase storage, reward system
- **Integration**: MetaMask wallet, Hedera blockchain, economic incentives
- **Tested**: ✅ Evidence submissions working with real transactions

#### **AI Resolution Engine** ✅
- **Files**: `src/services/blockcastAIAgent.ts`, `src/services/anthropicClient.ts`
- **Status**: **FULLY IMPLEMENTED**
- **Features**: Multi-language analysis, external data integration, confidence scoring
- **Capabilities**: Hedera Agent Kit integration, sophisticated reasoning
- **Tested**: ✅ AI analysis working with real Anthropic API

#### **Market UI/UX Flow** ✅
- **Files**: `src/components/BettingMarkets.tsx`, `src/components/MarketPage.tsx`
- **Status**: **FULLY FUNCTIONAL**
- **Features**: Status badges, conditional actions, evidence submission interface
- **User Flow**: Proper disputable vs resolved market handling
- **Tested**: ✅ UI correctly shows market states and actions

#### **Database Schema & Storage** ✅
- **Files**: `database/schema.sql`, evidence schema, resolution tables
- **Status**: **COMPLETE & OPERATIONAL**
- **Features**: Market lifecycle, evidence tracking, dispute system
- **Integration**: Supabase with proper relationships
- **Tested**: ✅ All CRUD operations working

### **❌ CRITICAL IMPLEMENTATION GAPS**

#### **🚨 Gap 1: Market Lifecycle Automation**
```typescript
// CURRENT STATE: marketMonitorService.ts exists but incomplete
// MISSING: Automatic market expiry → AI resolution trigger
// PROBLEM: Markets stay 'active' indefinitely

// REQUIRED IMPLEMENTATION:
class MarketLifecycleService {
  async checkExpiredMarkets() {
    const expired = await this.getMarketsWithExpiredTime();
    for (const market of expired) {
      await this.triggerAIResolution(market.id);
    }
  }

  async triggerAIResolution(marketId: string) {
    // MISSING: Bridge to blockcastAIAgent.resolveMarket()
    const aiAgent = getBlockCastAIAgent();
    const result = await aiAgent.resolveMarket({
      marketId,
      evidenceTopics: [process.env.HCS_EVIDENCE_TOPIC]
    });
    await this.updateMarketStatus(marketId, 'disputable');
  }
}
```

#### **🚨 Gap 2: Betting System Backend**
```typescript
// CURRENT STATE: UI shows "Place Prediction" but no backend
// MISSING: Actual betting functionality with smart contracts
// PROBLEM: Users can't place Y/N bets with real payments

// REQUIRED IMPLEMENTATION:
class BettingService {
  async placeBet(marketId: string, prediction: 'yes' | 'no', amount: number) {
    // MISSING: Smart contract integration
    const contract = new ethers.Contract(
      HEDERA_CONTRACTS.PREDICTION_MARKET_FACTORY,
      predictionMarketABI,
      signer
    );

    const tx = await contract.placeBet(marketId, prediction === 'yes' ? 1 : 0, {
      value: ethers.parseEther(amount.toString())
    });

    return await tx.wait();
  }
}
```

#### **🚨 Gap 3: AI Resolution → Execution Pipeline**
```typescript
// CURRENT STATE: AI makes decisions but doesn't execute them
// MISSING: Bridge between AI analysis and smart contract execution
// PROBLEM: Markets get AI analysis but no on-chain resolution

// REQUIRED IMPLEMENTATION:
class ResolutionExecutionService {
  async executeAIResolution(marketId: string, aiDecision: any) {
    if (aiDecision.confidence > 0.9) {
      // MISSING: Smart contract execution
      const contract = new ethers.Contract(
        marketAddress,
        predictionMarketABI,
        adminSigner
      );

      const outcome = aiDecision.primaryOutcome === 'yes' ? 2 : 3;
      const tx = await contract.resolveMarket(outcome);
      await tx.wait();

      await this.updateMarketStatus(marketId, 'resolved');
    }
  }
}
```

#### **🔧 Gap 4: External Data Source Integration**
```typescript
// CURRENT STATE: Mock data in ai-market-resolution.ts:47-100
// MISSING: Real API integrations for trusted sources
// PROBLEM: AI can't verify against real-world data

// REQUIRED IMPLEMENTATION:
class ExternalDataService {
  async fetchNewsData(query: string, region?: string) {
    // MISSING: Real API integrations
    const sources = [
      await this.fetchBBCNews(query),
      await this.fetchReutersAfrica(query, region),
      await this.fetchGovernmentData(query, region)
    ];
    return this.synthesizeExternalData(sources);
  }

  async fetchBBCNews(query: string) {
    // MISSING: BBC News API integration
    const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&sources=bbc-news`);
    return await response.json();
  }
}
```

### **🎯 DEVELOPMENT PRIORITY MATRIX**

| Component | Status | Priority | Effort | Impact |
|-----------|---------|----------|--------|--------|
| Market Expiry Automation | ❌ Missing | 🚨 Critical | 2-3 days | High |
| Betting System Backend | ❌ Missing | 🚨 Critical | 3-5 days | High |
| AI→Execution Bridge | ❌ Missing | 🔧 High | 2-3 days | Medium |
| External Data APIs | 🔄 Mock Only | 🔧 High | 4-6 days | Medium |
| Evidence System | ✅ Complete | ✅ Done | - | - |
| AI Engine | ✅ Complete | ✅ Done | - | - |
| UI/UX Flow | ✅ Complete | ✅ Done | - | - |

### **🚀 IMMEDIATE NEXT STEPS (Week 1)**

1. **Fix Market Lifecycle** (`marketMonitorService.ts`)
   - Add automatic expiry detection
   - Integrate with `blockcastAIAgent.resolveMarket()`
   - Update market status to 'disputable' after AI analysis

2. **Implement Betting Backend**
   - Create `BettingService` class
   - Integrate with `CONTRACT_PREDICTION_MARKET_FACTORY`
   - Add bet placement with HBAR payments

3. **Connect AI to Execution**
   - Create `ResolutionExecutionService`
   - Execute high-confidence AI decisions on smart contracts
   - Update market status to 'resolved' after execution

### **📋 INTEGRATION CHECKLIST**

- [ ] **Market Expiry Detection**: Automated scheduler checking `expires_at`
- [ ] **AI Resolution Trigger**: Bridge between monitor service and AI agent
- [ ] **Betting System**: Smart contract integration for Y/N predictions
- [ ] **Resolution Execution**: AI decisions → smart contract calls
- [ ] **External Data**: Real news/government API integrations
- [ ] **End-to-End Testing**: Complete flow from bet → expiry → AI → resolution

---

This technical guide provides the implementation details needed to understand, maintain, and extend BlockCast's system. **The analysis shows that core components are complete but critical automation gaps prevent the full lifecycle from working end-to-end.** For additional help, refer to the main README.md or contact the development team.