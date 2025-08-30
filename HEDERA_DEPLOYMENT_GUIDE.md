# BlockCast Hedera Integration Deployment Guide

This guide will help you deploy and integrate Saad's smart contracts with your BlockCast frontend on Hedera.

## 🚀 Prerequisites

### 1. Hedera Account Setup
1. Go to [Hedera Portal](https://portal.hedera.com)
2. Create account and get 1000 free HBAR on testnet
3. Save your **Account ID** and **Private Key**

### 2. Required API Keys (Optional but Recommended)
- **Pinata IPFS**: [pinata.cloud](https://pinata.cloud) for evidence storage
- **Web3.Storage**: [web3.storage](https://web3.storage) as backup IPFS provider

## 📦 Installation

### 1. Install Additional Dependencies
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox ethers dotenv
npm install ipfs-http-client  # if using local IPFS node
```

### 2. Environment Configuration
Update your `.env` file:

```env
# Existing variables...

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.your-account-id
HEDERA_PRIVATE_KEY=your-private-key

# Contract Addresses (will be filled after deployment)
CONTRACT_ADMIN_MANAGER=
CONTRACT_CAST_TOKEN=
CONTRACT_TREASURY=
CONTRACT_BET_NFT=
CONTRACT_PREDICTION_MARKET_FACTORY=

# HCS Topic IDs (will be created during setup)
HCS_EVIDENCE_TOPIC=
HCS_AI_ATTESTATIONS_TOPIC=
HCS_CHALLENGES_TOPIC=

# IPFS Configuration (optional)
PINATA_API_KEY=your-pinata-key
WEB3_STORAGE_API_KEY=your-web3-storage-key
INFURA_IPFS_API_KEY=your-infura-ipfs-key
```

## 🔧 Deployment Steps

### 1. Deploy Smart Contracts
```bash
npx hardhat run scripts/deploy.js --network hederaTestnet
```

This will deploy all contracts and save addresses to `deployments-hederaTestnet.json`.

### 2. Update Environment Variables
After deployment, copy the contract addresses from the deployment file to your `.env`:

```env
CONTRACT_ADMIN_MANAGER=0x...
CONTRACT_CAST_TOKEN=0x...
CONTRACT_TREASURY=0x...
CONTRACT_BET_NFT=0x...
CONTRACT_PREDICTION_MARKET_FACTORY=0x...
```

### 3. Create HCS Topics
Run the HCS setup script:
```bash
node scripts/setup-hcs.js
```

Or manually create topics:
```javascript
import { HCSService } from './src/utils/hcsService.js';
import { initializeHederaConfig } from './src/utils/hederaConfig.js';

const config = initializeHederaConfig();
const hcs = new HCSService(config);

// Create topics
const evidenceTopic = await hcs.createTopic('BlockCast Evidence Topic');
const attestationTopic = await hcs.createTopic('BlockCast AI Attestations Topic');  
const challengeTopic = await hcs.createTopic('BlockCast Challenges Topic');

console.log('Evidence Topic:', evidenceTopic);
console.log('AI Attestations Topic:', attestationTopic);
console.log('Challenges Topic:', challengeTopic);
```

Update your `.env` with the topic IDs.

## 🏗️ Integration with Your Frontend

Your existing frontend already has the structure to integrate. The integration points are:

### 1. Market Creation
The `useHedera` hook in `src/utils/useHedera.tsx` should connect to:
```typescript
import { ContractService } from './contractService';
import { initializeHederaConfig } from './hederaConfig';

const config = initializeHederaConfig();
const contractService = new ContractService(config);

// Create market
const marketId = await contractService.createMarket(
  "Will Bitcoin reach $100k by end of 2024?",
  Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
);
```

### 2. Evidence Submission
Integration in your verification components:
```typescript
import { ipfsService, IPFSService } from './ipfsService';
import { HCSService } from './hcsService';

// Upload evidence to IPFS
const evidence = IPFSService.createEvidenceData(
  marketId,
  userAddress,
  "Price screenshot from CoinGecko",
  "Bitcoin price on Dec 31, 2024",
  "image",
  file // or text content
);

const ipfsResult = await ipfsService.uploadEvidence(evidence);

// Submit to HCS
const hcsMessage = HCSService.createEvidenceMessage(
  marketId,
  evidence.id,
  ipfsResult.hash,
  userAddress,
  evidence.title,
  evidence.evidenceType
);

await hcsService.submitEvidence(hcsMessage);
```

### 3. Market Data Integration
Replace mock data with real contract data:
```typescript
// In your BettingMarkets component
const markets = await contractService.getAllMarkets();
const marketInfos = await Promise.all(
  markets.map(addr => contractService.getMarketInfo(addr))
);
```

## 🤖 AI Agent Integration

For the AI attestation part of your flow:

### 1. AI Agent Service
Create `src/utils/aiAgent.js`:
```javascript
import { HCSService } from './hcsService.js';
import { ipfsService } from './ipfsService.js';

export class AIAgent {
  async processMarket(marketId) {
    // 1. Collect evidence from HCS
    const evidence = await hcsService.getMarketEvidence(marketId);
    
    // 2. Download evidence from IPFS
    const evidenceData = await Promise.all(
      evidence.map(e => ipfsService.getEvidence(e.ipfsHash))
    );
    
    // 3. AI processing (integrate with your AI service)
    const outcome = await this.analyzeEvidence(evidenceData);
    
    // 4. Submit attestation to HCS
    const attestation = HCSService.createAttestationMessage(
      marketId,
      outcome.result, // 'yes' or 'no'
      outcome.confidence,
      outcome.reasoning,
      evidence.map(e => e.evidenceId),
      'ai-agent-v1'
    );
    
    await hcsService.submitAttestation(attestation);
    
    // 5. Resolve contract
    const outcome_enum = outcome.result === 'yes' ? 2 : 3; // Yes = 2, No = 3
    await contractService.resolveMarket(marketAddress, outcome_enum, adminSigner);
  }
}
```

## 🔍 Testing Your Integration

### 1. Test Contract Deployment
```bash
npx hardhat run scripts/test-contracts.js --network hederaTestnet
```

### 2. Test IPFS Integration
```javascript
import { ipfsService } from './src/utils/ipfsService.js';

// Test providers
const status = await ipfsService.testProviders();
console.log('IPFS Provider Status:', status);
```

### 3. Test HCS Integration
```javascript
import { HCSService } from './src/utils/hcsService.js';

// Test message submission
const testMessage = HCSService.createEvidenceMessage(
  'test-market',
  'test-evidence',
  'QmTest',
  'test-user',
  'Test Evidence',
  'text'
);

await hcsService.submitEvidence(testMessage);
```

## 🚨 Important Notes

1. **Do not modify your frontend** - All integration is done through utility services
2. **Test on Hedera Testnet first** - Free HBAR for testing
3. **Set up monitoring** - Track HCS messages and contract events
4. **Handle errors gracefully** - Network issues, failed transactions
5. **Use batch operations** - For multiple evidence submissions

## 🔄 Development Workflow

1. Deploy contracts to testnet
2. Create HCS topics  
3. Update environment variables
4. Test individual components
5. Test full flow: Market → Evidence → AI → Resolution
6. Deploy to mainnet when ready

## 📋 Checklist

- [ ] Hedera account created and funded
- [ ] Environment variables configured
- [ ] Smart contracts deployed
- [ ] HCS topics created
- [ ] IPFS providers configured  
- [ ] Contract integration tested
- [ ] Evidence flow tested
- [ ] AI agent integration planned
- [ ] Frontend integration points identified

## 🆘 Troubleshooting

### Common Issues
1. **"Insufficient HBAR"** - Fund your account via Hedera Portal
2. **"Invalid network"** - Check HEDERA_NETWORK in .env
3. **"Contract not found"** - Verify contract addresses after deployment
4. **"IPFS upload failed"** - Check API keys or use local node
5. **"Topic not found"** - Ensure HCS topics are created

### Getting Help
- Hedera Discord: [discord.gg/hedera](https://discord.gg/hedera)
- Hedera Docs: [docs.hedera.com](https://docs.hedera.com)
- Your hedera-docs directory has comprehensive guides

Good luck with your BlockCast integration! 🚀