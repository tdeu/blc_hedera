# BlockCast - African Truth Verification Platform

BlockCast is a decentralized prediction market platform focused on truth verification in Africa, built on Hedera Hashgraph with comprehensive blockchain integration and MetaMask wallet support.

## 🌍 Overview

BlockCast combines prediction markets with AI-powered truth verification to combat misinformation across Africa. Users can create markets, place bets on truth claims, submit evidence, and participate in a community-driven verification process.

## 🗄️ **SUPABASE DATABASE INTEGRATION**

### ✅ **PERSISTENT MARKET STORAGE**
BlockCast now features **dual-layer storage architecture** that maintains web3 principles while ensuring reliable data persistence:

- **Blockchain Layer (Sensitive Data)**: All financial transactions, bets, and settlements remain on Hedera blockchain
- **Supabase Layer (Market Metadata)**: Market titles, descriptions, approval status, and admin actions stored in PostgreSQL
- **Real-time Sync**: When admins approve markets, they're instantly stored in Supabase for global visibility
- **Cross-Device Persistence**: Approved markets visible to all users regardless of which admin approved them
- **Fallback System**: Gracefully falls back to localStorage if Supabase is unavailable

### 🔄 **ADMIN APPROVAL WORKFLOW**
1. **Market Submission**: Users submit markets via "Submit New Claim" → stored in localStorage (pending)
2. **Admin Review**: Super admins see pending markets in Admin Dashboard
3. **Market Approval**: Admin clicks "Approve" → market stored in **both** localStorage AND Supabase
4. **Global Visibility**: All users immediately see approved market on homepage (loaded from Supabase)
5. **Blockchain Integration**: Approved markets can then be deployed as smart contracts

### 🏗️ **DATABASE SCHEMA**
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
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Creation timestamp
    approved_at TIMESTAMPTZ DEFAULT NOW(), -- Approval timestamp
    approved_by TEXT NOT NULL,            -- Admin wallet address who approved
    approval_reason TEXT,                 -- Optional approval reason
    submitter_address TEXT NOT NULL      -- Original submitter wallet
);
```

### 🔐 **SECURITY & PRIVACY**
- **No Sensitive Data**: Only market metadata stored in Supabase, never private keys or transaction data
- **Public Information**: All stored data is public anyway (market descriptions, categories)
- **Admin Addresses**: Approval tracking by admin wallet addresses (non-sensitive)
- **Web3 Compliant**: Maintains decentralization for financial/sensitive operations

### 📊 **SUPABASE FEATURES**
- **Row Level Security (RLS)**: Enabled with public read access, controlled write access
- **Real-time Updates**: Instant market visibility across all users
- **Performance Indexes**: Optimized queries for category, country, and approval date
- **Admin Analytics**: Track approval statistics and admin activity

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

## 🎯 **HEDERA BLOCKCHAIN INTEGRATION - WHAT YOU CAN DO**

### ✅ **FULLY INTEGRATED FEATURES**

#### 1. **CREATE PREDICTION MARKETS** 🏭
- **UI Flow**: `Verify Claims` → `Submit New Claim` → Fill form → Click "Submit for Review"
- **Blockchain Action**: Creates new smart contract via `PredictionMarketFactory` at `0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa`
- **Contract Deployed**: Each market gets unique contract address (e.g., `0x2b7f2F1Ab881a0611FcFACe6dEF41666D014588B`)
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

#### 3. **BET NFT CREATION & TRADING** 🎨
- **Automatic Creation**: Every bet automatically mints NFT receipt via `BetNFT` contract at `0x1eabfE3518F9f49eA128cCE521F432089AF6BbfF`
- **NFT Data**: Contains market address, share count, position (YES/NO), timestamp
- **Trading**: NFTs are tradeable on secondary markets (list/buy/sell functions)
- **Metadata**: JSON metadata with bet details and market information
- **Ownership**: True ownership - you control your bet positions as NFTs

#### 4. **EVIDENCE SUBMISSION** 📋
- **UI Flow**: `Community` → `Submit Evidence` → Upload files → Add description → Submit
- **Blockchain Action**: Evidence hash and metadata stored on Hedera Consensus Service (HCS)
- **HCS Topic**: Evidence stored on topic `0.0.6701034`
- **IPFS Integration**: Files uploaded to decentralized IPFS storage
- **Timestamping**: Immutable timestamps via HCS for evidence ordering
- **AI Processing**: Evidence becomes available for AI attestation system

#### 5. **MARKET RESOLUTION** ⚖️
- **Admin Function**: Market resolution via `resolveMarket()` function
- **Outcome Setting**: Sets final outcome (YES/NO/INVALID)  
- **Automatic Settlement**: Winners automatically receive payouts
- **CAST Rewards**: Market creators receive 100 CAST tokens upon resolution
- **Final State**: Market permanently resolved on-chain

### 🏗️ **SMART CONTRACT ADDRESSES (HEDERA TESTNET)**

| Contract | Address | Purpose |
|----------|---------|---------|
| **PredictionMarketFactory** | `0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa` | Creates new prediction markets |
| **CastToken** | `0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c` | Betting collateral & rewards |
| **BetNFT** | `0x1eabfE3518F9f49eA128cCE521F432089AF6BbfF` | NFT receipts for bet positions |
| **Treasury** | `0x2294B9B3dbD2A23206994294D4cd4599Fdd8BdDD` | Protocol fee collection |
| **AdminManager** | `0xBE13b8Af1c2d22F86EF64B1a20752158A98eAF82` | Access control & governance |

### 🔗 **HCS TOPIC IDS (HEDERA CONSENSUS SERVICE)**

| Topic | ID | Purpose |
|-------|----|---------| 
| **Evidence Topic** | `0.0.6701034` | Community evidence submissions |
| **AI Attestations Topic** | `0.0.6701057` | AI verification results |
| **Challenges Topic** | `0.0.6701064` | Community challenges to AI decisions |

### 💱 **WALLET CONNECTION & ACCOUNT DETAILS**

- **Connect Wallet**: Use MetaMask with Hedera Testnet configuration
- **Your Wallet Address**: Display varies based on connected account (e.g., `0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead`)
- **Network**: Hedera Testnet (Chain ID: 296)
- **RPC Endpoint**: `https://testnet.hashio.io/api`
- **Currency**: HBAR (18 decimals)
- **Balance**: Real-time HBAR balance from your MetaMask wallet

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

### Core Workflow
1. **Market Creation** → User creates a new market question on a smart contract
2. **Trading Phase** → Community trades YES/NO shares using tokens
3. **Evidence Submission** → Community posts evidence to IPFS and references it in Hedera Consensus Service (HCS)
4. **Evidence Collection** → All evidence is timestamped and ordered by HCS
5. **AI Attestation** → At market end, AI agent ingests evidence, decides outcome, posts signed verdict to HCS + smart contract
6. **Challenge Window** → Community can challenge AI resolution by posting counter-evidence (IPFS + HCS) and staking tokens
7. **Final Resolution** → If no valid challenge, contract finalizes AI outcome; if challenged, vote/quorum resolves
8. **Settlement** → Smart contract pays winning traders, slashes losing challengers, rewards evidence contributors

### Hedera Integration
- **Smart Contracts**: Market logic, betting, and settlements
- **HCS Topics**: Evidence storage, AI attestations, challenge submissions
- **IPFS**: Decentralized evidence file storage
- **Token System**: CAST tokens for betting and governance

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
```

**Note**: With MetaMask integration, environment variables are only needed for development features. Regular users just need MetaMask!

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
- **MetaMask Integration** (Ethers.js v6)
- **Hedera EVM JSON-RPC** (HashIO API)
- **Hedera Consensus Service (HCS)** for evidence storage
- **IPFS** for file storage (Pinata, Web3.Storage, Infura)

### Database & Storage
- **Supabase** (@supabase/supabase-js) - PostgreSQL database for market metadata
- **Row Level Security (RLS)** - Secure data access policies
- **Real-time Subscriptions** - Live updates for approved markets

### Smart Contracts
- **PredictionMarketFactory.sol** - Market creation and management
- **CastToken.sol** - ERC20 token for betting and governance
- **BetNFT.sol** - NFT receipts for bet positions

## 📁 Project Structure

```
blockcast_new/
├── src/
│   ├── components/          # React components
│   │   ├── BettingMarkets.tsx     # Main markets interface
│   │   ├── VerificationInput.tsx  # Truth verification form
│   │   ├── TopNavigation.tsx      # Navigation with wallet connect
│   │   ├── Settings.tsx           # User settings and portfolio
│   │   └── ui/                    # Reusable UI components
│   ├── utils/
│   │   ├── walletService.ts           # MetaMask wallet integration
│   │   ├── hederaEVMService.ts        # Hedera EVM contract interactions
│   │   ├── hederaService.ts           # Hedera HCS integration
│   │   ├── useHedera.ts               # React hook for Hedera
│   │   ├── ipfsService.ts             # IPFS file storage
│   │   ├── contractService.ts         # Smart contract interactions
│   │   ├── supabase.ts                # Supabase client configuration
│   │   ├── approvedMarketsService.ts  # Supabase market storage service
│   │   ├── adminService.ts            # Admin approval workflow
│   │   └── pendingMarketsService.ts   # localStorage pending markets
│   └── App.tsx                    # Main application component
├── contracts/                     # Solidity smart contracts
├── scripts/                      # Deployment and setup scripts
└── artifacts/                    # Compiled contract artifacts
```

## 🔗 Hedera Integration Details

### HCS Topics Created
- **Evidence Topic (0.0.6701034)**: Community-submitted evidence for markets
- **AI Attestations Topic (0.0.6701057)**: AI agent decisions and reasoning
- **Challenges Topic (0.0.6701064)**: Community challenges to AI resolutions

### 📊 **DETAILED UI TO BLOCKCHAIN FLOW**

#### **Creating a Market:**
```
UI: Verify Claims Tab → Submit New Claim Form
    ↓
Frontend: hederaEVMService.createMarket()
    ↓
Blockchain: PredictionMarketFactory.createMarket()
    ↓
Events: MarketCreated(id, address, question)
    ↓
Result: New contract deployed + Market ID returned
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

#### **Evidence Submission:**
```
UI: Community Tab → Submit Evidence → Upload Files
    ↓
IPFS: Files uploaded to decentralized storage
    ↓
HCS: Evidence metadata + IPFS hash → Topic 0.0.6701034
    ↓
Result: Evidence timestamped and indexed for AI processing
```

### 💰 **TOKEN ECONOMICS ON HEDERA**

- **CastToken Supply**: Mintable ERC20 token for betting
- **Market Creation**: Requires gas fees in HBAR
- **Bet Placement**: Uses CastToken as collateral
- **Market Resolution**: Creator receives 100 CAST tokens
- **Protocol Fees**: 2% default fee rate to Treasury
- **NFT Trading**: Secondary market trading of bet positions

### Smart Contract Addresses (ACTIVE DEPLOYMENT)
- **AdminManager**: 0xBE13b8Af1c2d22F86EF64B1a20752158A98eAF82
- **CastToken**: 0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c
- **Treasury**: 0x2294B9B3dbD2A23206994294D4cd4599Fdd8BdDD
- **BetNFT**: 0x1eabfE3518F9f49eA128cCE521F432089AF6BbfF
- **PredictionMarketFactory**: 0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa

### Authentication & Session Management
The app uses Hedera SDK authentication with:
- Environment variables prefixed with `VITE_` for browser access
- DER-encoded ED25519 private keys
- Automatic fallback to mock mode if Hedera unavailable

## 🧪 Testing & Development

### Run Tests
```bash
npm test                    # Run all tests
npm run lint               # Code linting
npm run typecheck          # TypeScript checking
```

### Hedera Setup Scripts
```bash
npm run setup:hcs         # Create HCS topics
npm run deploy:hedera     # Deploy smart contracts
```

### Mock Mode
If Hedera credentials are invalid, the app automatically runs in mock mode with simulated blockchain transactions for development.

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

#### Missing Create Market Button
- **Cause**: UI component may have been modified or removed
- **Fix**: Check BettingMarkets component for market creation interface

## 🌐 Features

### Core Features
- **Truth Verification**: AI-powered fact-checking with community evidence
- **Prediction Markets**: Bet on truth claims with YES/NO positions
- **Evidence Submission**: Upload and reference evidence via IPFS + HCS
- **Multi-language Support**: English, French, Swahili
- **Portfolio Management**: Track bets, winnings, and verification history
- **Community Features**: Social feeds, governance participation

### Blockchain Features
- **Hedera Smart Contracts**: All bets and markets on-chain
- **HCS Evidence Storage**: Immutable evidence timestamps
- **IPFS Integration**: Decentralized file storage
- **Token Economics**: CAST token rewards and governance
- **NFT Bet Receipts**: Tradeable bet position NFTs

## 📊 Data Flow

### Evidence Submission Flow
1. User submits evidence via VerificationInput
2. Evidence uploaded to IPFS (multiple providers)
3. IPFS hash and metadata submitted to HCS Evidence Topic
4. Evidence indexed and made available for AI processing

### Market Resolution Flow
1. Market expires, triggers AI attestation process
2. AI analyzes all HCS evidence for the market
3. AI posts decision to HCS AI Attestations Topic
4. Community has challenge window to dispute
5. Final outcome recorded on smart contract
6. Winnings distributed to correct positions

## 🔐 Security

- **Private Key Management**: Environment variables only, never committed
- **Evidence Integrity**: IPFS content addressing + HCS timestamps
- **Consensus Verification**: Hedera network consensus for all transactions
- **Challenge Mechanism**: Community governance for AI decision appeals

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🔗 Resources

- **Hedera Documentation**: https://docs.hedera.com
- **Hedera Portal**: https://portal.hedera.com  
- **IPFS Documentation**: https://docs.ipfs.io
- **Smart Contract Source**: See `/contracts` directory
- **Hedera Integration Guide**: See `HEDERA_INTEGRATION.md`

---

*Built with ❤️ for truth verification in Africa*