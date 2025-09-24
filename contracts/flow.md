# BlockCast Development Plan - Smart Contract Integration Roadmap

## Executive Summary

**Current Status: 70% Complete**
- ✅ Core betting functionality: 95% complete
- ⚠️ Admin functions: 40% complete
- ❌ Dispute system: 15% complete
- ❌ NFT trading: 5% complete

**Goal**: Integrate core smart contracts under `/contracts` to create a fully functional prediction market platform with dispute resolution and NFT trading capabilities.

---

## Smart Contract Ecosystem Overview

### 🔗 **Available Smart Contracts**
```
✅ PredictionMarketFactory.sol - Market creation factory
✅ PredictionMarket.sol - Individual market contracts
✅ CastToken.sol - Platform ERC20 token
✅ AdminManager.sol - Role-based access control
✅ DisputeManager.sol - Dispute resolution with bonds
✅ BetNFT.sol - Position NFTs with marketplace
✅ Treasury.sol - Fee collection and management
⏸️ GovernanceModule.sol - Not in scope (future enhancement)
📄 PredictionMarketFactoryImproved.sol - Empty file
```

### 🏗️ **Contract Architecture**
```
                    BLOCKCAST ECOSYSTEM
         ┌─────────────────────────────────────────┐
         │          AdminManager.sol               │
         │        (Access Control)                 │
         └─────────────────┬───────────────────────┘
                          │
    ┌─────────────────────┼───────────────────────┐
    │                     │                       │
┌───▼────┐    ┌───────────▼──┐    ┌──────────────▼─┐
│Factory │───►│PredictionMkt │    │DisputeManager  │
│        │    │┌───────────┐ │    │• Bond system   │
│• Create│    ││  Pricing  │ │    │• Evidence      │
│• Reward│    ││  Engine   │ │    │• 7-day period  │
└────────┘    │└───────────┘ │    └────────────────┘
    │         └──────────────┘             │
    ▼                  │                   │
┌────────┐        ┌────▼────┐         ┌────▼────┐
│CastTokn│        │BetNFT   │         │Treasury │
│• Reward│        │• Positions      │ │• Fees   │
│• CAST  │        │• Marketplace    │ │• Mgmt   │
└────────┘        └─────────┘         └─────────┘
```

---

## Phase 1: Critical Missing Integrations (Week 1-2)

### 🚨 **Priority 1A: DisputeManager Integration**

**Status**: Contract exists ✅ | Frontend integration ❌ (0% complete)

**What's Missing**:
- No dispute creation workflow in UI
- Mock dispute data in admin panel
- No bond locking mechanism
- Missing evidence-to-blockchain integration

**Implementation Tasks**:

1. **Create DisputeManager Service** (`src/utils/disputeManagerService.ts`)
   ```typescript
   class DisputeManagerService {
     async createDispute(marketId: string, evidence: string): Promise<string>
     async resolveDispute(disputeId: string, outcome: boolean): Promise<void>
     async getActiveDisputes(): Promise<Dispute[]>
     async getBondRequirement(): Promise<number>
   }
   ```

2. **Update DisputeModal Component** (`src/components/DisputeModal.tsx`)
   ```typescript
   // Replace mock functions with real contract calls
   const handleSubmitDispute = async () => {
     const bondAmount = await disputeManagerService.getBondRequirement();
     await castTokenService.approve(disputeManagerAddress, bondAmount);
     await disputeManagerService.createDispute(marketId, evidence);
   };
   ```

3. **Enhance Admin Dispute Panel** (`src/components/admin/AdminDisputePanel.tsx`)
   ```typescript
   // Real-time dispute data from blockchain
   const disputes = await disputeManagerService.getActiveDisputes();
   // Admin resolution with bond handling
   const resolveDispute = async (disputeId, decision) => {
     await disputeManagerService.resolveDispute(disputeId, decision);
   };
   ```

**Expected Outcome**: Fully functional dispute system with 100 CAST bond requirement

### 🚨 **Priority 1B: Contract Address Configuration**

**Status**: Partial deployment - missing Treasury and AdminManager addresses

**Current Addresses** (from `src/config/constants.ts`):
```typescript
✅ CAST_TOKEN: '0x5e383bD628a0cda81913bbd5EfB4DD1989fCc6e2'
✅ FACTORY_CONTRACT: '0x31049333C880702e1f5Eae7d26A125c667cee91B'
❌ TREASURY_CONTRACT: '0x0000...' // Placeholder
❌ ADMIN_MANAGER_CONTRACT: '0x0000...' // Placeholder
❌ DISPUTE_MANAGER_CONTRACT: Not configured
❌ BET_NFT_CONTRACT: Not configured
```

**Tasks**:
1. Deploy missing contracts to Hedera testnet
2. Update constants.ts with real addresses
3. Test contract connectivity

### 🚨 **Priority 1C: Two-Stage Resolution Contract Integration**

**Status**: UI exists ✅ | Contract calls ❌ (Mock functions only)

**Current Issue**: `TwoStageResolutionPanel.tsx` uses mock data

**Implementation**:
```typescript
// Replace in TwoStageResolutionPanel.tsx
const handlePreliminaryResolve = async (marketId: string, outcome: 'yes' | 'no') => {
  const marketContract = await hederaEVMService.getMarketContract(marketId);
  await marketContract.preliminaryResolve(outcome === 'yes');
};

const handleFinalResolve = async (marketId: string) => {
  const marketContract = await hederaEVMService.getMarketContract(marketId);
  await marketContract.finalResolve();
};
```

---

## Phase 2: BetNFT Marketplace Development (Week 3-4)

### 🎯 **Priority 2A: BetNFT Service Layer**

**Status**: Contract exists ✅ | Service missing ❌

**Create** `src/utils/betNFTService.ts`:
```typescript
class BetNFTService {
  async mintBetNFT(marketId: string, shares: number, position: 'yes' | 'no'): Promise<string>
  async listNFT(tokenId: string, price: number): Promise<void>
  async buyNFT(tokenId: string): Promise<void>
  async getMyNFTs(address: string): Promise<BetNFT[]>
  async getMarketplaceNFTs(): Promise<BetNFT[]>
  async transferShares(tokenId: string, to: string): Promise<void>
}
```

### 🎯 **Priority 2B: NFT Marketplace UI**

**Create** `src/components/NFTMarketplace.tsx`:
- View all listed BetNFTs
- Buy/sell interface
- Position value calculator
- Transfer functionality

**Integrate with** `MarketPage.tsx`:
- Auto-mint NFT on bet placement
- Show NFT in user portfolio
- Quick sell/transfer options

### 🎯 **Priority 2C: NFT Metadata and Display**

**Features**:
- Visual NFT cards with market data
- Position value tracking
- Rarity/timing indicators
- Trading history

---

## Phase 3: Enhanced Admin Functions (Week 5-6)

### 🛠️ **Priority 3A: Complete Treasury Integration**

**Status**: Service exists ✅ | UI limited ⚠️

**Enhance** `src/components/admin/TreasuryDashboard.tsx`:
```typescript
const treasuryFunctions = {
  async withdrawFees(token: string, amount: number): Promise<void>
  async getFeeBalance(token: string): Promise<number>
  async getRevenueAnalytics(): Promise<RevenueData>
  async setProtocolFee(newFee: number): Promise<void>
}
```

### 🛠️ **Priority 3B: Advanced Market Management**

**Features**:
- Bulk market operations
- Market performance analytics
- Automated resolution triggers
- Emergency pause mechanisms

### 🛠️ **Priority 3C: AdminManager Integration**

**Integrate role-based access**:
```typescript
// Update all admin functions to use AdminManager contract
const checkAdminAccess = async (address: string): Promise<boolean> => {
  return await adminManagerContract.isAdmin(address);
};
```

---

## Phase 4: Advanced Features (Week 7-10)

### 🚀 **Priority 4A: AI Resolution Integration**

**Connect AI recommendations to contracts**:
```typescript
const aiResolution = await aiAgentService.getResolutionRecommendation(marketId);
if (aiResolution.confidence >= 0.95) {
  await marketContract.preliminaryResolve(aiResolution.outcome);
}
```

### 🚀 **Priority 4B: Advanced Market Types**

- Multi-option markets
- Conditional markets
- Time-series markets
- Sports betting integration

### 🚀 **Priority 4C: Platform Enhancements**

- Advanced analytics dashboard
- Automated market maker improvements
- Performance optimizations
- Enhanced user experience features

---

## Implementation Checklist

### **Week 1-2: Critical Foundations**
- [ ] Deploy missing contracts (Treasury, AdminManager, DisputeManager)
- [ ] Create DisputeManagerService
- [ ] Integrate real dispute creation workflow
- [ ] Update admin panel with real dispute resolution
- [ ] Fix two-stage resolution contract calls
- [ ] Test end-to-end dispute workflow

### **Week 3-4: NFT Marketplace**
- [ ] Create BetNFTService
- [ ] Build NFT marketplace UI
- [ ] Integrate NFT minting with betting
- [ ] Implement secondary trading
- [ ] Add NFT portfolio management
- [ ] Test NFT transfer functionality

### **Week 5-6: Admin Enhancement**
- [ ] Complete treasury management UI
- [ ] Add revenue analytics
- [ ] Integrate AdminManager contract
- [ ] Build bulk market operations
- [ ] Add emergency controls
- [ ] Test multi-admin workflows

### **Week 7-10: Advanced Features**
- [ ] AI-contract integration
- [ ] Advanced market types
- [ ] Platform enhancements
- [ ] Performance optimizations
- [ ] Security audits
- [ ] Production deployment preparation

---

## Success Metrics

### **Phase 1 Completion**:
- ✅ All disputes can be created and resolved on-chain
- ✅ 100 CAST bond system working
- ✅ Two-stage resolution fully automated
- ✅ All contract addresses deployed and configured

### **Phase 2 Completion**:
- ✅ NFTs minted automatically on bets
- ✅ Secondary marketplace functional
- ✅ Share transfers working
- ✅ NFT portfolios displayed correctly

### **Phase 3 Completion**:
- ✅ Full treasury management
- ✅ Multi-admin access control
- ✅ Advanced market analytics
- ✅ Emergency controls functional

### **Phase 4 Completion**:
- ✅ AI-driven resolution recommendations
- ✅ Advanced market types supported
- ✅ Platform performance optimized
- ✅ Production-ready deployment

**Final Goal**: A comprehensive prediction market platform where core functions (market creation, betting, disputes, NFT trading, treasury) are seamlessly managed through smart contracts with an intuitive, high-performance frontend interface.