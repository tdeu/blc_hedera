# BlockCast - African Truth Verification Platform

BlockCast is a decentralized prediction market platform focused on truth verification in Africa, built on Hedera Hashgraph with comprehensive blockchain integration.

## 🌍 Overview

BlockCast combines prediction markets with AI-powered truth verification to combat misinformation across Africa. Users can create markets, place bets on truth claims, submit evidence, and participate in a community-driven verification process.

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
- **UI Flow**: `Betting Markets` → Select market → Choose YES/NO → Enter amount → Place Bet
- **Blockchain Action**: Calls `buyYes()` or `buyNo()` on individual market contract
- **Collateral**: Uses CastToken (`0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c`) as betting currency
- **Token Approval**: Automatic ERC20 approval before bet placement
- **Pricing**: Dynamic automated market maker (AMM) pricing based on current pool ratios
- **Transaction**: EVM transaction recorded on Hedera with bet details
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

### 💱 **YOUR HEDERA ACCOUNT DETAILS**

- **Main Account ID**: `0.0.6643581`
- **EVM Account ID**: `0.0.6421186` 
- **EVM Address**: `0xfd76D4c18D5A10F558d057743bFB0218130157f4`
- **Network**: Hedera Testnet
- **RPC Endpoint**: `https://testnet.hashio.io/api`

### 🔍 **VERIFY YOUR TRANSACTIONS**

**View Your Account Activity:**
- Main Account: https://hashscan.io/testnet/account/0.0.6643581
- EVM Account: https://hashscan.io/testnet/account/0.0.6421186

**View Contract Activity:**
- Factory Contract: https://hashscan.io/testnet/contract/`<CONTRACT_ID>`
- Recent Transaction: https://hashscan.io/testnet/transaction/`<TRANSACTION_HASH>`

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

### Environment Setup
1. Create a Hedera testnet account at https://portal.hedera.com
2. Copy your credentials to `.env`:

```bash
# Hedera Testnet Configuration
VITE_HEDERA_TESTNET_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
VITE_HEDERA_TESTNET_PRIVATE_KEY=YOUR_DER_ENCODED_PRIVATE_KEY

# Deployment Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_DER_ENCODED_PRIVATE_KEY

# HCS Topic IDs (created during setup)
HCS_EVIDENCE_TOPIC=0.0.6701034
HCS_AI_ATTESTATIONS_TOPIC=0.0.6701057
HCS_CHALLENGES_TOPIC=0.0.6701064
```

### Start Development
```bash
npm run dev
```
App runs at: http://localhost:3000

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
- **Hedera Consensus Service (HCS)** for evidence storage
- **IPFS** for file storage (Pinata, Web3.Storage, Infura)

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
│   │   ├── Settings.tsx           # User settings and portfolio
│   │   └── ui/                    # Reusable UI components
│   ├── utils/
│   │   ├── hederaService.ts       # Hedera blockchain integration
│   │   ├── useHedera.ts           # React hook for Hedera
│   │   ├── ipfsService.ts         # IPFS file storage
│   │   └── contractService.ts     # Smart contract interactions
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