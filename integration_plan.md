# BlockCast Integration Plan - 2 Day Sprint

## Deployed Contract Addresses (Hedera Testnet)
```
AdminManager: 0x82B5FdaA1Fb566D1215277d40a04E369052c03E0
Treasury: 0xabbc9868cbfab2Db4336D0e192DF24754A8C8Da8
DisputeManager: 0xCB8B4E630b3443a34ceDB9B8C58B8cF5675d362b
BetNFT: 0x3b1E8b887162e7a58b992ad0A9b2c760D57f68C1
CastToken: 0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d
PredictionMarketFactory: 0x97bF56127fD8BD6A8211d5a993c7B215CCe3671A
```

## Environment Configuration
```
Hedera Account: 0.0.6421186
Network: Hedera Testnet (testnet.mirrornode.hedera.com)
Deployer Address: 0xfd76D4c18D5A10F558d057743bFB0218130157f4
```

---

## STEP 1: Fix Contract Configuration
**Goal**: Ensure all contract addresses are properly configured and accessible

**What I need from you**:
- Content of `src/config/constants.ts`
- Content of `.env` file (remove sensitive keys, just show structure)

**Test after completion**:
```bash
npm run dev
# Open browser console, run:
console.log(window.ethereum)
# Should show MetaMask object
```

---

## STEP 2: Fix Contract Connection Service
**Goal**: Create proper contract instances for all deployed contracts

**What I need from you**:
- Content of `src/services/hederaEVMService.ts`
- Content of `src/hooks/useHedera.ts`

**Test after completion**:
```javascript
// In browser console after connecting wallet:
const service = new HederaEVMService()
service.getCastTokenBalance('YOUR_WALLET_ADDRESS')
# Should return actual token balance, not undefined
```

---

## STEP 3: Fix Betting System Integration
**Goal**: Connect betting interface to real smart contracts

**What I need from you**:
- Content of `src/components/BettingMarkets.tsx`
- Content of `src/services/approvedMarketsService.ts`
- Show me what happens when you click "Place Bet" button (console errors)

**Test after completion**:
```bash
# Place a small test bet on any market
# Transaction should appear in Hedera explorer
# Market odds should update immediately after transaction
```

---

## STEP 4: Fix Market Creation Integration
**Goal**: Connect market creation to PredictionMarketFactory contract

**What I need from you**:
- Content of `src/components/CreateMarketModal.tsx`
- Show me what happens when you submit a new market (any errors)

**Test after completion**:
```bash
# Create a test market
# New market should appear in database
# New PredictionMarket contract should be deployed
# Betting should work on the new market
```

---

## STEP 5: Implement DisputeManager Service
**Goal**: Create service layer for dispute functionality

**What I need from you**:
- Content of `src/components/DisputeModal.tsx`
- Confirm if file `src/services/disputeManagerService.ts` exists

**I will provide**:
- Complete `disputeManagerService.ts` implementation
- Updated `DisputeModal.tsx` with real contract calls

**Test after completion**:
```bash
# Try to submit a dispute on a resolved market
# Should require 100 CAST tokens
# Transaction should succeed and dispute should be stored
```

---

## STEP 6: Fix Two-Stage Resolution System
**Goal**: Connect admin resolution panel to real contract calls

**What I need from you**:
- Content of `src/components/admin/TwoStageResolutionPanel.tsx`
- Show me current admin panel behavior when resolving markets

**Test after completion**:
```bash
# Admin resolves a market through two-stage process
# Market status should change to PendingResolution, then Resolved
# Users should be able to claim winnings
```

---

## STEP 7: Implement BetNFT Service and Marketplace
**Goal**: Connect NFT minting and trading to BetNFT contract

**What I need from you**:
- Confirm if `src/services/betNFTService.ts` exists
- Content of any NFT-related components

**I will provide**:
- Complete `betNFTService.ts` implementation
- NFT marketplace UI component
- Integration with betting system

**Test after completion**:
```bash
# Place a bet - should automatically mint NFT
# List NFT for sale on marketplace
# Buy NFT from marketplace
# Shares should transfer correctly
```

---

## STEP 8: Fix Treasury Integration
**Goal**: Connect treasury management to real Treasury contract

**What I need from you**:
- Content of `src/components/admin/TreasuryDashboard.tsx`
- Content of any treasury-related services

**Test after completion**:
```bash
# Admin should see real fee balances in treasury
# Admin should be able to withdraw fees
# Transaction should succeed on Hedera testnet
```

---

## STEP 9: Implement HCS Evidence Integration
**Goal**: Fix browser SDK timeout and enable evidence submission to HCS

**What I need from you**:
- Content of current evidence submission code
- Any existing HCS integration attempts
- Error messages when submitting evidence

**I will provide**:
- Fixed HCS implementation with proper timeout handling
- Fallback to database storage
- Evidence-to-blockchain integration

**Test after completion**:
```bash
# Submit evidence for a market
# Evidence should be stored in HCS (or fallback to database)
# Admin should see evidence in resolution panel
```

---

## STEP 10: Complete AI Resolution Pipeline Integration
**Goal**: Connect AI analysis results to smart contract resolution

**What I need from you**:
- Content of AI resolution service files
- Show me how AI analysis currently works
- Content of market monitoring service

**Test after completion**:
```bash
# Market expires automatically
# AI analysis runs and provides confidence score
# Market resolves automatically via smart contract
# Users can claim winnings
# Creator receives CAST token rewards
```

---

## Before We Start - Prerequisites Check

Please run these commands and confirm they work:

```bash
cd blockcast_new
npm install
npm run dev
```

Then in another terminal:
```bash
npm run server    # AI Proxy (Port 3001)
npm run monitor   # Market Monitor (Port 3002)
```

Confirm all three services start without errors.

Also verify in browser:
1. App loads at `http://localhost:5173`
2. MetaMask connects to Hedera testnet
3. You can see some markets in the interface

Once confirmed, we'll start with Step 1.

---

## Critical Success Factors

Each step must pass its test before moving to the next step. This ensures we build a solid foundation and don't waste time on dependent issues.

If any step fails its test, we fix it completely before proceeding.

The goal is a fully functional dapp where:
- Users can create and bet on markets with real HBAR
- AI automatically resolves expired markets
- Users can dispute resolutions with CAST tokens
- NFTs are minted and traded for positions
- All transactions happen on Hedera blockchain
- Evidence is submitted to HCS