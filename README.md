# BlockCast - African Truth Verification Platform

BlockCast is a decentralized prediction market platform focused on truth verification in Africa, built on Hedera Hashgraph with comprehensive blockchain integration, MetaMask wallet support, and an advanced resolution and dispute system.

## 🌍 Overview

BlockCast combines prediction markets with AI-powered truth verification to combat misinformation across Africa. Users can create markets, place bets on truth claims, submit evidence, and participate in a community-driven verification process with built-in dispute resolution mechanisms.

## 🗄️ **SUPABASE DATABASE INTEGRATION**

### ✅ **PERSISTENT MARKET STORAGE**
BlockCast now features **dual-layer storage architecture** that maintains web3 principles while ensuring reliable data persistence:

- **Blockchain Layer (Sensitive Data)**: All financial transactions, bets, and settlements remain on Hedera blockchain
- **Supabase Layer (Market Metadata)**: Market titles, descriptions, approval status, admin actions, and dispute records stored in PostgreSQL
- **Real-time Sync**: When admins approve markets, they're instantly stored in Supabase for global visibility
- **Cross-Device Persistence**: Approved markets visible to all users regardless of which admin approved them
- **Fallback System**: Gracefully falls back to localStorage if Supabase is unavailable

### 🔄 **ADMIN APPROVAL WORKFLOW**
1. **Market Submission**: Users submit markets via "Submit New Claim" → stored in localStorage (pending)
2. **Admin Review**: Super admins see pending markets in Admin Dashboard
3. **Market Approval**: Admin clicks "Approve" → market stored in **both** localStorage AND Supabase
4. **Global Visibility**: All users immediately see approved market on homepage (loaded from Supabase)
5. **Blockchain Integration**: Approved markets can then be deployed as smart contracts

### 🏗️ **ENHANCED DATABASE SCHEMA**
```sql
-- Approved Markets Table (Supabase PostgreSQL)
CREATE TABLE approved_markets (
    id TEXT PRIMARY KEY,                  -- Market UUID
    claim TEXT NOT NULL,                  -- Market question/claim
    description TEXT,                     -- Detailed description
    category TEXT NOT NULL,               -- Category (Politics, Sports, etc.)
    country TEXT NOT NULL,                -- Target country
    region TEXT NOT NULL,                 -- Geographic region
    market_type TEXT NOT NULL,            -- Market type classification
    confidence_level TEXT NOT NULL,       -- AI confidence level
    expires_at TIMESTAMPTZ NOT NULL,      -- Market expiration
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'resolving' | 'resolved'
    resolution TEXT,                      -- 'yes' | 'no' | null
    ai_proposed_outcome TEXT,             -- AI's proposed resolution
    ai_confidence_score DECIMAL,          -- AI confidence (0-1)
    dispute_window_start TIMESTAMPTZ,     -- When dispute period began
    dispute_window_end TIMESTAMPTZ,       -- When dispute period ends
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Creation timestamp
    approved_at TIMESTAMPTZ DEFAULT NOW(), -- Approval timestamp
    resolved_at TIMESTAMPTZ,              -- Resolution timestamp
    approved_by TEXT NOT NULL,            -- Admin wallet address who approved
    resolved_by TEXT,                     -- Admin who made final resolution
    approval_reason TEXT,                 -- Optional approval reason
    resolution_reason TEXT,               -- Admin's resolution justification
    submitter_address TEXT NOT NULL      -- Original submitter wallet
);

-- Disputes Table
CREATE TABLE market_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id TEXT NOT NULL REFERENCES approved_markets(id),
    disputer_address TEXT NOT NULL,       -- Wallet address of disputer
    dispute_reason TEXT NOT NULL,         -- Reason for dispute
    evidence_ipfs_hash TEXT,              -- IPFS hash of evidence files
    evidence_description TEXT,            -- Description of submitted evidence
    bond_amount DECIMAL NOT NULL,         -- Staked bond amount
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'valid' | 'invalid' | 'reviewed'
    admin_review_notes TEXT,              -- Admin's review comments
    reward_amount DECIMAL DEFAULT 0,      -- Reward if dispute was valid
    created_at TIMESTAMPZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT                      -- Admin who reviewed dispute
);

-- Protocol Rewards Table
CREATE TABLE protocol_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_address TEXT NOT NULL,
    reward_type TEXT NOT NULL,            -- 'valid_dispute' | 'market_creation' | 'betting_reward'
    amount DECIMAL NOT NULL,
    market_id TEXT REFERENCES approved_markets(id),
    dispute_id UUID REFERENCES market_disputes(id),
    transaction_hash TEXT,               -- Hedera transaction hash
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'distributed' | 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    distributed_at TIMESTAMPTZ
);
```

### 🔐 **SECURITY & PRIVACY**
- **No Sensitive Data**: Only market metadata stored in Supabase, never private keys or transaction data
- **Public Information**: All stored data is public anyway (market descriptions, categories, disputes)
- **Admin Addresses**: Approval and resolution tracking by admin wallet addresses (non-sensitive)
- **Web3 Compliant**: Maintains decentralization for financial/sensitive operations
- **Dispute Privacy**: Evidence stored on IPFS with only hashes in database

### 📊 **SUPABASE FEATURES**
- **Row Level Security (RLS)**: Enabled with public read access, controlled write access
- **Real-time Updates**: Instant market visibility and dispute notifications across all users
- **Performance Indexes**: Optimized queries for category, country, approval date, and dispute status
- **Admin Analytics**: Track approval statistics, dispute resolution rates, and admin activity

## ⚖️ **RESOLUTION AND DISPUTE SYSTEM**

### 🔄 **COMPLETE RESOLUTION FLOW**

#### **Phase 1: Market Creation**
- Creator opens market with question, outcomes, and end time
- **HTS** mints outcome tokens (`YES`, `NO`) via Hedera Token Service
- **Supabase** stores market metadata with `status: 'active'`
- Market deployed as smart contract on Hedera

#### **Phase 2: Market Closing**
- At expiration time, market `status` changes to `'resolving'`
- Market closure event published on **HCS Topic 0.0.6701064** for auditable timestamp
- AI resolution process automatically triggered

#### **Phase 3: AI Resolution**
- Off-chain AI service fetches data from multiple sources (APIs, news, social media)
- AI analyzes all HCS evidence submitted during market lifetime
- AI proposes outcome (`yes` or `no`) with confidence score (0-1)
- AI resolution proposal recorded on **HCS** for transparency
- AI decision stored in Supabase (`ai_proposed_outcome`, `ai_confidence_score`)

#### **Phase 4: Dispute Window**
- **Fixed 48-hour dispute period** opens automatically after AI resolution
- `dispute_window_start` and `dispute_window_end` timestamps set in database
- Users can submit disputes with evidence during this window
- **Bond Requirement**: Disputers must stake protocol tokens to discourage spam
- Dispute submissions logged to **Supabase** and anchored on **HCS**

#### **Phase 5: Admin Review**
- Admin dashboard displays:
  - AI's proposed resolution with confidence score
  - All submitted disputes with evidence links
  - Complete HCS audit trail
  - Community evidence submitted during market lifetime
- Admin options:
  - **Confirm AI Resolution**: Accept AI decision as final
  - **Override Outcome**: Provide corrected resolution with justification
- Admin decision broadcast on **HCS** for full auditability
- **Dispute Resolution**:
  - **Valid Disputers** (provided correct contradictory evidence):
    - Receive protocol token rewards
    - Get gas fees refunded
    - Recover their dispute bonds
  - **Invalid Disputers** (false or weak evidence):
    - Lose their dispute bonds (slashed to treasury)
    - Slashed tokens redistributed to valid disputers

#### **Phase 6: Final Settlement**
- Smart contract executes final settlement:
  - Winning outcome token holders redeem via **HTS**
  - Protocol reward tokens distributed to participants
  - Valid disputers receive rewards, invalid disputers are slashed
  - Treasury collects fees and redistributes slashed bonds
- Market `status` set to `'resolved'` with final outcome
- All transactions permanently recorded on Hedera blockchain

### 🎯 **DISPUTE INCENTIVE MECHANISM**

#### **Bond Requirements**
- **Minimum Bond**: 10 CAST tokens to submit dispute
- **Dynamic Scaling**: Higher stakes markets require higher bonds
- **Bond Recovery**: Valid disputers get full bond back + rewards

#### **Reward Structure**
- **Valid Disputers**: 2x their bond amount + gas refund + share of slashed bonds
- **Market Creators**: 100 CAST tokens upon successful resolution
- **Active Bettors**: Bonus rewards for participation in disputed markets

#### **Slashing Mechanism**
- **Invalid Disputes**: 100% of bond slashed to treasury
- **Treasury Redistribution**: 50% to valid disputers, 50% to protocol development
- **Repeat Offenders**: Progressive penalties for multiple invalid disputes

### 🔍 **DISPUTE EVIDENCE SYSTEM**

#### **Evidence Submission Process**
1. **File Upload**: Documents, images, links uploaded to IPFS
2. **Evidence Description**: Detailed explanation of why AI was wrong
3. **Source Citation**: Links to authoritative sources
4. **IPFS Storage**: Evidence permanently stored with content addressing
5. **HCS Anchoring**: Evidence hash and metadata timestamped on HCS
6. **Bond Staking**: Required token stake to complete submission

#### **Evidence Quality Standards**
- **Authoritative Sources**: Government websites, established news outlets, official statements
- **Timestamp Verification**: Evidence must predate market resolution
- **Relevance Check**: Must directly contradict AI's reasoning
- **Format Requirements**: Clear, readable, and verifiable content

## 🦊 **METAMASK WALLET INTEGRATION**

### ✅ **CONNECT YOUR WALLET**
- **One-Click Connection**: Click "Connect Wallet" button in navigation
- **Auto Network Setup**: MetaMask automatically adds Hedera Testnet (Chain ID: 296)
- **Real HBAR Balance**: See your actual HBAR balance instead of mock amounts
- **Network Switching**: Automatic switching to Hedera Testnet
- **Account Management**: Switch accounts seamlessly with wallet updates
- **Transaction Signing**: All transactions signed through your MetaMask wallet

### 🔗 **HEDERA TESTNET CONFIGURATION**
- **Network Name**: Hedera Testnet  
- **RPC URL**: `https://testnet.hashio.io/api`
- **Chain ID**: 296 (0x128)
- **Currency Symbol**: HBAR
- **Block Explorer**: `https://hashscan.io/testnet/`

### 💳 **WALLET FEATURES**
- **Real Balance Display**: Shows actual HBAR from your wallet
- **Transaction History**: All transactions viewable on HashScan
- **Wallet Address Display**: See your connected address (e.g., `0x32b0...aead`)
- **Connect/Disconnect**: Easy wallet management in UI
- **Auto-Reconnect**: Remembers wallet connection on page refresh
- **Dispute Bond Management**: Track staked bonds and pending disputes

## 🎯 **HEDERA BLOCKCHAIN INTEGRATION - COMPLETE FEATURE SET**

### ✅ **FULLY INTEGRATED FEATURES**

#### 1. **CREATE PREDICTION MARKETS** 🏭
- **UI Flow**: `Verify Claims` → `Submit New Claim` → Fill form → Click "Submit for Review"
- **Blockchain Action**: Creates new smart contract via `PredictionMarketFactory` at `0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa`
- **HTS Integration**: Automatic minting of YES/NO outcome tokens
- **Contract Deployed**: Each market gets unique contract address
- **Transaction**: EVM transaction on Hedera testnet with full confirmation
- **Events Emitted**: `MarketCreated(marketId, marketAddress, question)`
- **Gas Used**: ~5M gas limit with automatic pricing
- **Storage**: Market data permanently stored on Hedera blockchain

#### 2. **PLACE PREDICTIONS/BETS** 💰
- **UI Flow**: `Betting Markets` → Select market → Choose YES/NO → Enter HBAR amount → Place Bet
- **Wallet Required**: Must connect MetaMask wallet to place bets
- **Balance Check**: Automatically checks your real HBAR balance before betting
- **Blockchain Action**: Calls `buyYes()` or `buyNo()` on individual market contract
- **Collateral**: Uses CastToken (`0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c`) as betting currency
- **Token Approval**: Automatic ERC20 approval before bet placement via your wallet
- **Pricing**: Dynamic automated market maker (AMM) pricing based on current pool ratios
- **Transaction**: EVM transaction signed by your MetaMask and recorded on Hedera
- **Gas Fees**: Real HBAR gas fees paid from your connected wallet
- **NFT Minting**: Automatic BetNFT creation for each bet position (tradeable receipt)

#### 3. **SUBMIT DISPUTES WITH EVIDENCE** ⚖️
- **UI Flow**: `Disputes` → `Submit Dispute` → Upload evidence → Stake bond → Submit
- **Bond Staking**: Required CAST token stake via smart contract
- **Evidence Upload**: Files uploaded to IPFS with automatic hash generation
- **HCS Recording**: Dispute metadata and evidence hash recorded on HCS Topic 0.0.6701064
- **Database Storage**: Dispute details stored in Supabase for admin review
- **Real-time Updates**: Dispute status updates via Supabase real-time subscriptions
- **Transaction**: Bond staking transaction signed via MetaMask

#### 4. **BET NFT CREATION & TRADING** 🎨
- **Automatic Creation**: Every bet automatically mints NFT receipt via `BetNFT` contract at `0x1eabfE3518F9f49eA128cCE521F432089AF6BbfF`
- **NFT Data**: Contains market address, share count, position (YES/NO), timestamp
- **Trading**: NFTs are tradeable on secondary markets (list/buy/sell functions)
- **Metadata**: JSON metadata with bet details and market information
- **Ownership**: True ownership - you control your bet positions as NFTs

#### 5. **EVIDENCE SUBMISSION** 📋
- **UI Flow**: `Community` → `Submit Evidence` → Upload files → Add description → Submit
- **Blockchain Action**: Evidence hash and metadata stored on Hedera Consensus Service (HCS)
- **HCS Topic**: Evidence stored on topic `0.0.6701034`
- **IPFS Integration**: Files uploaded to decentralized IPFS storage
- **Timestamping**: Immutable timestamps via HCS for evidence ordering
- **AI Processing**: Evidence becomes available for AI attestation system

#### 6. **MARKET RESOLUTION & DISPUTE HANDLING** ⚖️
- **AI Resolution**: Automated outcome proposal based on evidence analysis
- **Dispute Submission**: Community can challenge AI decisions with evidence
- **Admin Review**: Final resolution by authenticated administrators
- **Outcome Setting**: Sets final outcome (YES/NO/INVALID) on smart contract
- **Automatic Settlement**: Winners automatically receive payouts via HTS
- **Dispute Rewards**: Valid disputers receive protocol token rewards
- **Bond Slashing**: Invalid disputers lose staked bonds to treasury
- **CAST Rewards**: Market creators receive 100 CAST tokens upon resolution
- **Final State**: Market permanently resolved on-chain with full audit trail

### 🏗️ **SMART CONTRACT ADDRESSES (HEDERA TESTNET)**

| Contract | Address | Purpose |
|----------|---------|---------|
| **PredictionMarketFactory** | `0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa` | Creates new prediction markets |
| **CastToken** | `0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c` | Betting collateral, rewards & dispute bonds |
| **BetNFT** | `0x1eabfE3518F9f49eA128cCE521F432089AF6BbfF` | NFT receipts for bet positions |
| **Treasury** | `0x2294B9B3dbD2A23206994294D4cd4599Fdd8BdDD` | Protocol fee collection & bond slashing |
| **AdminManager** | `0xBE13b8Af1c2d22F86EF64B1a20752158A98eAF82` | Access control & governance |
| **DisputeManager** | `0x[TO_BE_DEPLOYED]` | Dispute bond staking & resolution |

### 🔗 **HCS TOPIC IDS (HEDERA CONSENSUS SERVICE)**

| Topic | ID | Purpose |
|-------|----|---------| 
| **Evidence Topic** | `0.0.6701034` | Community evidence submissions |
| **AI Attestations Topic** | `0.0.6701057` | AI verification results & confidence scores |
| **Disputes Topic** | `0.0.6701064` | Dispute submissions & admin resolutions |
| **Market Events Topic** | `0.0.[NEW_TOPIC]` | Market creation, closure, and resolution events |

### 💱 **WALLET CONNECTION & ACCOUNT DETAILS**

- **Connect Wallet**: Use MetaMask with Hedera Testnet configuration
- **Your Wallet Address**: Display varies based on connected account (e.g., `0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead`)
- **Network**: Hedera Testnet (Chain ID: 296)
- **RPC Endpoint**: `https://testnet.hashio.io/api`
- **Currency**: HBAR (18 decimals)
- **Balance**: Real-time HBAR balance from your MetaMask wallet
- **Bond Tracking**: Display of staked dispute bonds and pending rewards

### 🔍 **VERIFY YOUR TRANSACTIONS**

**View Your Connected Wallet Activity:**
- Your MetaMask Address: Check HashScan with your connected address
- Example: https://hashscan.io/testnet/address/0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead

**View Contract Activity:**
- Factory Contract: https://hashscan.io/testnet/address/0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa
- Recent Transaction: https://hashscan.io/testnet/transaction/`<YOUR_TRANSACTION_HASH>`

**Recent Successful Transactions:**
- Market Creation: `0x2b425869dee36f2a5dd31a64d9adf26f611b471d5d9e7ff26c2e1f9f537f1221`
- Contract Address: `0xE579549b2A641f4Fb171ed680F9a80c15c45Db61`
- Market Creation 2: Contract `0x538d2Ee299667dC8f75894135890664A911fc645`

## 🏗️ Architecture & Flow

### Core Workflow with Dispute Resolution
1. **Market Creation** → User creates a new market question on a smart contract with HTS token minting
2. **Trading Phase** → Community trades YES/NO shares using tokens
3. **Evidence Submission** → Community posts evidence to IPFS and references it in HCS
4. **Evidence Collection** → All evidence is timestamped and ordered by HCS
5. **Market Closure** → Market automatically closes at expiration, status changes to 'resolving'
6. **AI Attestation** → AI agent ingests evidence, decides outcome, posts signed verdict to HCS + smart contract
7. **Dispute Window** → 48-hour period for community to challenge AI resolution with bonded disputes
8. **Admin Review** → Admin evaluates AI decision and all disputes, makes final resolution
9. **Dispute Resolution** → Valid disputers rewarded, invalid disputers slashed
10. **Final Settlement** → Smart contract pays winning traders, distributes rewards, handles slashing
11. **Audit Trail** → Complete history preserved on HCS for transparency

### Enhanced Hedera Integration
- **Smart Contracts**: Market logic, betting, settlements, and dispute resolution
- **HTS (Hedera Token Service)**: Outcome tokens, protocol rewards, dispute bonds
- **HCS Topics**: Evidence storage, AI attestations, dispute submissions, market events
- **IPFS**: Decentralized evidence and dispute documentation storage
- **Token System**: CAST tokens for betting, governance, dispute bonds, and rewards

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Hedera testnet account (portal.hedera.com)
- Git

### Installation
```bash
git clone <repository-url>
cd blockcast_new
npm install
```

### Supabase Setup (Required for Persistent Storage)
1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) → Create new project
2. **Set up Database**: 
   - Copy the SQL from `supabase-schema.sql` 
   - Run it in your Supabase SQL Editor
   - Execute the enhanced schema including dispute tables
3. **Add Credentials**: 
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key from project settings:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### MetaMask Wallet Setup
1. **Install MetaMask**: Download from https://metamask.io
2. **Get Testnet HBAR**: Visit https://portal.hedera.com/register for testnet tokens
3. **Connect Wallet**: Click "Connect Wallet" in the app - MetaMask will auto-configure Hedera Testnet
4. **Get CAST Tokens**: Use the faucet feature in-app to get CAST tokens for betting and dispute bonds

### Optional Environment Setup (For Development)
For development features, create `.env` file:

```bash
# Optional: Hedera Testnet Configuration (for fallback/development)
VITE_HEDERA_TESTNET_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
VITE_HEDERA_TESTNET_PRIVATE_KEY=YOUR_DER_ENCODED_PRIVATE_KEY
VITE_HEDERA_PRIVATE_KEY_EVM=YOUR_ETHEREUM_STYLE_PRIVATE_KEY

# HCS Topic IDs (pre-created)
HCS_EVIDENCE_TOPIC=0.0.6701034
HCS_AI_ATTESTATIONS_TOPIC=0.0.6701057
HCS_CHALLENGES_TOPIC=0.0.6701064
HCS_MARKET_EVENTS_TOPIC=0.0.[NEW_TOPIC]

# Dispute System Configuration
DISPUTE_WINDOW_HOURS=48
MIN_DISPUTE_BOND=10
DISPUTE_REWARD_MULTIPLIER=2
```

**Note**: With MetaMask integration, environment variables are only needed for development features. Regular users just need MetaMask and some CAST tokens!

### Start Development
```bash
npm run dev
```
App runs at: http://localhost:3000

**⚠️ TROUBLESHOOTING**: If you get `ERR_CONNECTION_REFUSED` when accessing localhost:3000 in your browser:
- The Vite config has been updated with `host: true` in `vite.config.ts` to fix this issue
- If it still doesn't work, restart the dev server after making this change

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Lucide React** for icons

### Blockchain & Web3
- **Hedera Hashgraph** (@hashgraph/sdk)
- **Hedera Smart Contracts** (Solidity)
- **Hedera Token Service (HTS)** for outcome tokens and dispute bonds
- **MetaMask Integration** (Ethers.js v6)
- **Hedera EVM JSON-RPC** (HashIO API)
- **Hedera Consensus Service (HCS)** for evidence and dispute storage
- **IPFS** for file storage (Pinata, Web3.Storage, Infura)

### Database & Storage
- **Supabase** (@supabase/supabase-js) - PostgreSQL database for market metadata and disputes
- **Row Level Security (RLS)** - Secure data access policies
- **Real-time Subscriptions** - Live updates for markets, disputes, and resolutions

### Smart Contracts
- **PredictionMarketFactory.sol** - Market creation and management
- **CastToken.sol** - ERC20 token for betting, governance, and dispute bonds
- **BetNFT.sol** - NFT receipts for bet positions
- **DisputeManager.sol** - Bond staking, dispute resolution, and slashing

## 📁 Enhanced Project Structure

```
blockcast_new/
├── src/
│   ├── components/          # React components
│   │   ├── BettingMarkets.tsx     # Main markets interface
│   │   ├── VerificationInput.tsx  # Truth verification form
│   │   ├── DisputeInterface.tsx   # Dispute submission and management
│   │   ├── AdminDashboard.tsx     # Enhanced admin panel with dispute review
│   │   ├── TopNavigation.tsx      # Navigation with wallet connect
│   │   ├── Settings.tsx           # User settings and portfolio
│   │   └── ui/                    # Reusable UI components
│   ├── utils/
│   │   ├── walletService.ts           # MetaMask wallet integration
│   │   ├── hederaEVMService.ts        # Hedera EVM contract interactions
│   │   ├── hederaService.ts           # Hedera HCS integration
│   │   ├── htsService.ts              # Hedera Token Service integration
│   │   ├── useHedera.ts               # React hook for Hedera
│   │   ├── ipfsService.ts             # IPFS file storage
│   │   ├── contractService.ts         # Smart contract interactions
│   │   ├── disputeService.ts          # Dispute management and resolution
│   │   ├── supabase.ts                # Supabase client configuration
│   │   ├── approvedMarketsService.ts  # Supabase market storage service
│   │   ├── adminService.ts            # Admin approval workflow
│   │   ├── aiResolutionService.ts     # AI outcome prediction service
│   │   └── pendingMarketsService.ts   # localStorage pending markets
│   └── App.tsx                    # Main application component
├── contracts/                     # Solidity smart contracts
│   ├── PredictionMarketFactory.sol
│   ├── CastToken.sol
│   ├── BetNFT.sol
│   └── DisputeManager.sol        # New dispute resolution contract
├── scripts/                      # Deployment and setup scripts
└── artifacts/                    # Compiled contract artifacts
```

## 🔗 Hedera Integration Details

### Enhanced HCS Topics
- **Evidence Topic (0.0.6701034)**: Community-submitted evidence for markets
- **AI Attestations Topic (0.0.6701057)**: AI agent decisions, reasoning, and confidence scores
- **Disputes Topic (0.0.6701064)**: Community disputes, admin resolutions, and bond transactions
- **Market Events Topic (0.0.[NEW])**: Market lifecycle events (creation, closure, resolution)

### 📊 **DETAILED UI TO BLOCKCHAIN FLOW WITH DISPUTES**

#### **Creating a Market:**
```
UI: Verify Claims Tab → Submit New Claim Form
    ↓
Frontend: hederaEVMService.createMarket()
    ↓
Blockchain: 
  1. PredictionMarketFactory.createMarket()
  2. HTS.mintOutcomeTokens(YES, NO)
    ↓
Events: MarketCreated(id, address, question)
    ↓
HCS: Market creation event recorded on Market Events Topic
    ↓
Result: New contract deployed + HTS tokens minted + Market ID returned
```

#### **Placing a Bet:**
```
UI: Betting Markets → Select Market → Choose YES/NO → Enter Amount
    ↓
Frontend: handlePlaceBet() → hederaPlaceBet()
    ↓
Blockchain: 
  1. CastToken.approve(marketAddress, betAmount)
  2. PredictionMarket.buyYes(shares) OR buyNo(shares)
  3. BetNFT.mintBetNFT(user, market, shares, isYes)
    ↓
Result: Bet recorded + NFT receipt minted + User balance updated
```

#### **AI Resolution Process:**
```
Market Expiry Triggered
    ↓
AI Service: Fetches all HCS evidence + external data sources
    ↓
AI Analysis: Processes evidence, generates outcome + confidence score
    ↓
HCS: AI decision recorded on AI Attestations Topic
    ↓
Database: Market status → 'resolving', dispute window opens
    ↓
UI: Users notified of AI decision + dispute window
```

#### **Submitting a Dispute:**
```
UI: Disputes Tab → Submit Dispute → Upload Evidence → Stake Bond
    ↓
IPFS: Evidence files uploaded to decentralized storage
    ↓
Frontend: disputeService.submitDispute()
    ↓
Blockchain:
  1. CastToken.approve(DisputeManager, bondAmount)
  2. DisputeManager.stakeBond(marketId, bondAmount)
    ↓
HCS: Dispute + evidence hash recorded on Disputes Topic
    ↓
Database: Dispute entry created in market_disputes table
    ↓
Result: Bond staked + Evidence preserved + Admin notified
```

#### **Admin Resolution:**
```
Admin Dashboard: Reviews AI decision + all disputes + evidence
    ↓
Admin Decision: Confirm AI OR Override with new outcome
    ↓
Frontend: adminService.resolveMarket()
    ↓
Blockchain:
  1. PredictionMarket.resolveMarket(finalOutcome)
  2. HTS.payoutWinners()
  3. DisputeManager.processRewards() // Reward valid disputers
  4. DisputeManager.slashInvalidBonds() // Slash invalid disputers
    ↓
HCS: Final resolution recorded on Disputes Topic
    ↓
Database: Market status → 'resolved', dispute statuses updated
    ↓
Result: Market settled + Rewards distributed + Bonds processed
```

### 💰 **ENHANCED TOKEN ECONOMICS ON HEDERA**

#### **Core Tokens**
- **HBAR**: Network gas fees and native transactions
- **CAST Token**: Primary utility token for betting, governance, and dispute bonds
- **YES/NO Tokens**: HTS outcome tokens for each market (automatically minted/burned)

#### **Economic Flows**
- **Market Creation**: Gas fees in HBAR + 100 CAST token reward upon resolution
- **Bet Placement**: Uses CAST tokens as collateral
- **Dispute Bonds**: 10-50 CAST tokens staked per dispute (market-dependent)
- **Protocol Fees**: 2% default fee rate to Treasury
- **Valid Dispute Rewards**: 2x bond amount + gas refund + share of slashed bonds
- **NFT Trading**: Secondary market trading of bet positions
- **Slashing Redistribution**: 50% to valid disputers, 50% to protocol development

#### **Incentive Alignment**
- **Quality Disputes**: High rewards for legitimate evidence
- **Spam Prevention**: Bond requirements deter frivolous disputes
- **Community Participation**: Shared rewards encourage active verification
- **Long-term Sustainability**: Protocol fees fund ongoing development

### Smart Contract Addresses (ACTIVE DEPLOYMENT)
- **AdminManager**: 0xBE13b8Af1c2d22F86EF64B1a20752158A98eAF82
- **CastToken**: 0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c
- **Treasury**: 0x2294B9B3dbD2A23206994294D4cd4599Fdd8BdDD
- **BetNFT**: 0x1eabfE3518F9f49eA128cCE521F432089AF6BbfF
- **PredictionMarketFactory**: 0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa
- **DisputeManager**: [TO BE DEPLOYED] - New contract for dispute resolution

### Authentication & Session Management
The app uses multiple authentication layers:
- **MetaMask Integration**: Primary wallet authentication for all users
- **Hedera SDK Authentication**: Backend services with environment variables
- **Admin Role Management**: Via AdminManager smart contract
- **Supabase RLS**: Database-level access control

## 🧪 Testing & Development

### Run Tests
```bash
npm test                    # Run all tests
npm run test:dispute        # Test dispute resolution system
npm run test:integration    # Full integration tests
npm run lint               # Code linting
npm run typecheck          # TypeScript checking
```

### Hedera Setup Scripts
```bash
npm run setup:hcs         # Create HCS topics
npm run deploy:hedera     # Deploy smart contracts
npm run setup:disputes    # Deploy dispute resolution contracts
npm run mint:test-tokens  # Mint test CAST tokens for development
```

### Development Features
```bash
npm run dev:mock          # Run with mock blockchain (no Hedera needed)
npm run dev:testnet       # Run with Hedera testnet
npm run admin:dashboard   # Start admin-only development mode
```

### Mock Mode
If Hedera credentials are invalid, the app automatically runs in mock mode with simulated blockchain transactions, dispute resolution, and AI outcomes for development.

## 🔧 Troubleshooting

### Common Issues

#### "No session token found"
- **Cause**: Incorrect environment variable prefixes
- **Fix**: Use `VITE_` prefix for browser variables, `import.meta.env` instead of `process.env`

#### "Transaction Expired" 
- **Cause**: Hedera account inactive or network issues
- **Fix**: Verify account has HBAR balance, refresh credentials from portal.hedera.com

#### "Invalid Amount or Insufficient Balance"
- **Cause**: Betting validation logic not properly connected
- **Fix**: Check handlePlaceBet function and user balance state management

#### "Dispute Bond Insufficient"
- **Cause**: User doesn't have enough CAST tokens for dispute bond
- **Fix**: Use in-app faucet or verify CAST token balance

#### "Evidence Upload Failed"
- **Cause**: IPFS service unavailable or file too large
- **Fix**: Check IPFS service status, ensure files are under 10MB

#### Missing Create Market Button
- **Cause**: UI component may have been modified or removed
- **Fix**: Check BettingMarkets component for market creation interface

#### Admin Dashboard Access Denied
- **Cause**: Connected wallet is not registered as admin
- **Fix**: Verify admin status via AdminManager contract or contact system administrator

#### Dispute Window Closed
- **Cause**: Trying to submit dispute after 48-hour window
- **Fix**: Check market status and dispute window timestamps

### Network Issues
If experiencing connectivity issues:
1. Check MetaMask network configuration
2. Verify Hedera testnet RPC endpoint: `https://testnet.hashio.io/api`
3. Ensure sufficient HBAR for gas fees
4. Try refreshing the page to reconnect wallet

## 🌐 Enhanced Features

### Core Features
- **Truth Verification**: AI-powered fact-checking with community evidence
- **Prediction Markets**: Bet on truth claims with YES/NO positions
- **Dispute Resolution**: Community-driven challenge system with economic incentives
- **Evidence Submission**: Upload and reference evidence via IPFS + HCS
- **Multi-language Support**: English, French, Swahili, Arabic
- **Portfolio Management**: Track bets, winnings, disputes, and verification history
- **Community Features**: Social feeds, governance participation, dispute discussions

### Advanced Blockchain Features
- **Hedera Smart Contracts**: All bets, markets, and disputes on-chain
- **HTS Integration**: Native outcome tokens with automatic minting/burning
- **HCS Evidence Storage**: Immutable evidence timestamps and ordering
- **IPFS Integration**: Decentralized file storage with content addressing
- **Token Economics**: CAST token rewards, governance, and dispute bonds
- **NFT Bet Receipts**: Tradeable bet position NFTs with full metadata
- **Automated Settlement**: Smart contract-based payouts and reward distribution
- **Dispute Incentives**: Economic rewards for valid disputes, slashing for invalid ones

### AI & Resolution Features
- **Multi-source Analysis**: AI aggregates data from news, social media, government sources
- **Confidence Scoring**: AI provides confidence levels (0-1) for all decisions
- **Evidence Integration**: AI considers all community-submitted evidence
- **Dispute Processing**: AI analysis of challenge evidence for admin review
- **Continuous Learning**: AI improves over time based on dispute outcomes

## 📊 Data Flow with Complete Dispute Resolution

### Market Lifecycle with Disputes
1. **Creation**: User creates market → HTS mints tokens → Smart contract deployed
2. **Trading**: Community bets using CAST tokens → NFT receipts issued
3. **Evidence**: Community submits evidence → IPFS storage → HCS timestamps
4. **Expiration**: Market closes → Status changes to 'resolving'
5. **AI Analysis**: AI evaluates all evidence → Proposes outcome with confidence
6. **Dispute Window**: 48-hour period for community challenges
7. **Dispute Processing**: Users stake bonds → Submit counter-evidence → HCS recording
8. **Admin Review**: Admin evaluates AI + disputes → Makes final decision
9. **Resolution**: Smart contract executes outcome → HTS handles payouts
10. **Reward Distribution**: Valid disputers rewarded → Invalid disputers slashed
11. **Settlement**: Winners receive tokens → Market marked as resolved
12. **Audit Trail**: Complete history preserved on HCS and Supabase

### Evidence Submission Flow with Disputes
1. **Regular Evidence**: User submits during market lifetime → IPFS + HCS storage
2. **Dispute Evidence**: User challenges AI decision → Stakes bond + submits evidence
3. **Evidence Verification**: IPFS ensures content integrity via hashing
4. **Timestamp Ordering**: HCS provides immutable sequence of all submissions
5. **Admin Access**: All evidence accessible via admin dashboard for review
6. **AI Integration**: Evidence feeds into AI analysis for better decisions

### Financial Flow with Incentives
1. **Market Creation**: Creator pays gas fees → Receives 100 CAST upon resolution
2. **Betting**: Users stake CAST tokens → Receive outcome tokens + NFT receipts
3. **Dispute Bonds**: Disputers stake 10-50 CAST → Held in smart contract escrow
4. **Resolution Rewards**: Valid disputers get 2x bond + gas refund + slashed bond share
5. **Invalid Penalties**: Failed disputers lose bonds to treasury → 50% redistributed
6. **Protocol Fees**: 2% of all bets to treasury → Funds development and rewards
7. **Treasury Management**: Automated distribution of fees and slashed bonds

## 🔐 Enhanced Security

### Multi-layer Security Architecture
- **Smart Contract Security**: Audited contracts with reentrancy protection
- **Private Key Management**: Environment variables only, never committed to git
- **Evidence Integrity**: IPFS content addressing prevents tampering
- **Consensus Verification**: Hedera network consensus for all transactions
- **Bond Economics**: Financial incentives prevent spam and manipulation
- **Admin Multisig**: Multiple admin signatures required for critical operations
- **Database Security**: Supabase RLS policies protect sensitive data
- **HCS Immutability**: Consensus service provides tamper-proof audit trails

### Dispute System Security
- **Bond Requirements**: Economic barriers to frivolous disputes
- **Evidence Verification**: IPFS hashes ensure evidence authenticity
- **Admin Accountability**: All admin decisions recorded on HCS
- **Slashing Mechanisms**: Financial penalties for bad actors
- **Time Windows**: Fixed periods prevent gaming the system
- **Multiple Reviews**: AI + community + admin triple verification

### Privacy Protections
- **Wallet Anonymity**: Only wallet addresses stored, no personal data
- **Evidence Privacy**: IPFS allows selective sharing of sensitive documents
- **Dispute Confidentiality**: Evidence can be submitted privately to admins
- **Metadata Minimal**: Only necessary data stored in public databases

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/dispute-system-enhancement`
3. Install dependencies: `npm install`
4. Set up local environment with `.env` file
5. Run tests: `npm run test`
6. Make changes and test thoroughly
7. Commit changes: `git commit -m 'Add advanced dispute resolution features'`
8. Push to branch: `git push origin feature/dispute-system-enhancement`
9. Open a Pull Request with detailed description

### Code Standards
- **TypeScript**: Strict type checking required
- **ESLint**: Follow configured linting rules
- **Testing**: Unit tests required for new features
- **Documentation**: Update README for any new features
- **Smart Contracts**: Solidity 0.8.19+ with full test coverage

### Contribution Areas
- **Frontend Components**: React components for dispute interfaces
- **Smart Contracts**: Solidity contracts for new features
- **AI Integration**: Machine learning models for outcome prediction
- **Testing**: Comprehensive test suites for all features
- **Documentation**: User guides and technical documentation
- **Translations**: Multi-language support expansion

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

### Open Source Components
- **React & TypeScript**: MIT License
- **Hedera SDK**: Apache 2.0 License
- **Supabase**: Apache 2.0 License
- **IPFS**: MIT/Apache dual license
- **Tailwind CSS**: MIT License

## 👤 **USER PROFILE & DATA INTEGRATION - COMPLETE**

### ✅ **COMPREHENSIVE USER DATA DISPLAY**
BlockCast now features **full user profile integration** that displays real customer data from both database and blockchain sources:

#### **🔄 Data Architecture (Database + Blockchain)**
- **Database Storage (Supabase)**: Market metadata, approval status, admin actions, dispute records
- **Blockchain Storage (Hedera)**: Financial transactions, bets, settlements, user profiles (HCS + localStorage)
- **Real-time Integration**: User statistics update dynamically as users interact with platform
- **Cross-platform Sync**: Data persistence across devices and sessions

#### **📊 User Profile Features**
- **📈 Real Statistics**: Markets created, bets placed, correct predictions, total winnings, reputation score
- **💰 Portfolio Integration**: Live betting history with actual blockchain data
- **🎯 Created Markets**: All markets user has submitted, with approval/resolution status
- **📱 Clean Navigation**: Dedicated Profile page without navigation interference
- **⚙️ Settings Separation**: Profile editing separate from app settings for better UX

#### **🎨 Enhanced Navigation Structure**
**Desktop Dropdown Menu**:
- **Profile** → Clean dedicated profile page (no overlay issues)
- **Portfolio** → Betting portfolio with real transaction data  
- **My Markets** → Settings tab showing user's created markets
- **History** → Settings tab with verification/betting history
- **Settings** → App preferences and account settings

**Mobile Menu**: 
- **Profile** → Direct access to profile page
- **Account Settings** → Full settings component

#### **🔧 Navigation Fix - Modal Overlay Issue RESOLVED**
**Problem**: Redundant navigation menu was covering profile content, blocking user access to profile information.

**Solution Implemented**:
- ✅ **Eliminated Duplicate Navigation**: Removed redundant 8-tab navigation overlay from profile page
- ✅ **Created Dedicated Profile Component**: Clean profile page with direct access to user data
- ✅ **Fixed Z-Index Conflicts**: Proper layering with z-[100] for dropdowns above z-50 navigation
- ✅ **Streamlined Settings**: Reduced from 8 tabs to 7 tabs, removed redundant profile tab
- ✅ **Mobile Optimization**: Clean navigation structure on all device sizes

#### **📱 User Experience Improvements**
- **Direct Profile Access**: Click "Profile" → immediate access to profile content (no navigation overlay)
- **Real-time Data**: All user statistics load from actual database/blockchain sources
- **Portfolio Integration**: Betting history shows actual transactions with blockchain confirmation
- **Market Creation Tracking**: Users see status of all markets they've created
- **Clean Interface**: No interference from navigation overlays or redundant menus

#### **🛠️ Technical Implementation**
```typescript
// New dedicated Profile component
export default function Profile({ userBalance }: ProfileProps) {
  const { profile } = useUser();
  const [userStats, setUserStats] = useState({
    marketsCreated: 0,
    totalBetsPlaced: 0, 
    correctPredictions: 0,
    totalWinnings: 0,
    reputationScore: 0
  });
  
  // Load real statistics from userDataService
  const loadUserStats = async () => {
    const stats = await userDataService.getUserStats(profile.walletAddress);
    setUserStats(stats);
  };
}

// UserDataService integration
class UserDataService {
  // Fetch user's created markets from Supabase
  async getUserCreatedMarkets(walletAddress: string): Promise<UserCreatedMarket[]>
  
  // Get betting history from blockchain/localStorage  
  async getUserBettingHistory(walletAddress: string): Promise<UserBettingHistory[]>
  
  // Calculate comprehensive user statistics
  async getUserStats(walletAddress: string): Promise<UserStats>
  
  // Record new bets and market creations for persistence
  recordBet(walletAddress: string, marketId: string, ...)
  recordMarketCreation(walletAddress: string, marketId: string, ...)
}
```

#### **🎯 Navigation Flow (Fixed)**
```
Main Navigation Bar (Top)
├── Truth Markets
├── Verify Truth  
├── Community
├── Social Hub
└── User Avatar Dropdown
    ├── Profile → Clean Profile Page ✅
    ├── Portfolio → Betting Portfolio ✅  
    ├── My Markets → Settings/Markets Tab ✅
    ├── History → Settings/History Tab ✅
    └── Settings → App Preferences ✅
```

#### **📊 Profile Page Components**
- **Profile Header**: Avatar, display name, bio, edit functionality
- **Statistics Cards**: Balance, markets created, predictions accuracy, total winnings  
- **Wallet Information**: Connected address, member since, account status
- **Real-time Updates**: Statistics refresh as user places bets/creates markets

### ✅ **USER DATA SERVICES**
- **userDataService.ts**: Comprehensive service for fetching user-specific data
- **UserCreatedMarkets.tsx**: Component displaying all markets user has created
- **Profile.tsx**: Dedicated profile page with complete user information
- **Settings.tsx**: Streamlined settings focused on app preferences (profile tab removed)

## 🔗 Resources & Documentation

### Official Documentation
- **Hedera Documentation**: https://docs.hedera.com
- **Hedera Portal**: https://portal.hedera.com  
- **HTS Guide**: https://docs.hedera.com/guides/docs/sdks/tokens
- **HCS Documentation**: https://docs.hedera.com/guides/docs/sdks/consensus
- **IPFS Documentation**: https://docs.ipfs.io
- **Supabase Docs**: https://supabase.com/docs

### Development Resources
- **Smart Contract Source**: See `/contracts` directory
- **API Documentation**: See `/docs/api` directory
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Contributing Guide**: See `CONTRIBUTING.md`
- **Security Audit**: See `SECURITY_AUDIT.md`

### Community & Support
- **Discord**: [BlockCast Community Discord](#)
- **GitHub Issues**: Report bugs and feature requests
- **Developer Forum**: Technical discussions and Q&A
- **Twitter**: @BlockCastAfrica for updates and announcements

### Block Explorer Links
- **Hedera Mainnet**: https://hashscan.io/mainnet/
- **Hedera Testnet**: https://hashscan.io/testnet/
- **Your Transactions**: Replace with your wallet address in HashScan URL

---

*Built with ❤️ for truth verification in Africa*

## 🚀 Future Roadmap

### Phase 1: Core Platform Features (Current - COMPLETED ✅)
- ✅ **AI-powered resolution** with confidence scoring
- ✅ **Community dispute submission** with evidence
- ✅ **Economic incentives** via bond staking
- ✅ **Admin review and final resolution**
- ✅ **Automated reward and slashing distribution**
- ✅ **Complete User Profile System** with real data from DB + blockchain
- ✅ **Navigation Interface Fixes** - eliminated modal overlay issues
- ✅ **Customer Data Integration** - users can view their markets, bets, and history
- ✅ **Dedicated Profile Page** - clean interface without navigation interference
- ✅ **Real-time Statistics** - dynamic updates of user metrics and portfolio

### Phase 2: Advanced Features (Q2 2025)
- **Multi-language AI**: Support for French, Swahili, Arabic fact-checking
- **Reputation System**: User credibility scores based on dispute history
- **Automated Resolution**: High-confidence AI decisions bypass admin review
- **Mobile App**: Native iOS/Android apps with full dispute functionality
- **Cross-chain Bridge**: Expand to other blockchain networks

### Phase 3: Scale & Governance (Q3-Q4 2025)
- **DAO Governance**: Community voting on protocol parameters
- **Advanced Analytics**: Comprehensive market and dispute analytics
- **API Platform**: Public APIs for third-party integrations
- **Institutional Features**: Enterprise tools for media organizations
- **Mainnet Migration**: Full production deployment on Hedera mainnet

### Long-term Vision
- **Continental Expansion**: Scale beyond Africa to global markets
- **Educational Integration**: Partnership with schools and universities
- **Media Partnerships**: Integration with major African news outlets
- **Government Collaboration**: Official fact-checking for public information
- **Research Platform**: Academic research on misinformation patterns

---

*This README reflects the complete BlockCast platform with full dispute resolution capabilities as recommended by the blockchain development team.*