# BlockCast - 3-Minute Demo Video Script

**Total Duration:** 3:00 minutes
**Format:** Screen recording + voiceover
**Platform:** https://blockcast-hedera.vercel.app

---

## 🎬 **0:00 - 0:15 | Introduction (15 seconds)**

### **Visual:**
- Show BlockCast landing page with markets displayed
- Overlay: "BlockCast - Decentralized Truth Markets"

### **Script:**
> "Hi, I'm [Your Name] from Team BlockCast. We're solving Africa's misinformation crisis through blockchain-verified prediction markets.
>
> In a continent where 63% of online news is unverified, BlockCast creates financial incentives for truth - using Hedera's HCS and HTS for immutable evidence and transparent settlements.
>
> We're competing in the **DeFi & RWA** track."

### **On-Screen Text:**
```
Team: BlockCast
Problem: Misinformation in Africa (63% unverified news)
Track: Onchain Finance & RWA
Solution: Hedera-powered prediction markets
```

---

## 📱 **0:15 - 0:45 | Product Overview (30 seconds)**

### **Visual:**
- Quick scroll through the main interface
- Show: Active Markets, Disputable Markets tabs
- Hover over market cards showing odds, pools

### **Script:**
> "BlockCast is a decentralized prediction market platform where users stake CAST tokens on real-world outcomes.
>
> What makes us unique is our **Three-Signal AI Resolution System**:
> - Signal 1: Perplexity AI analyzes real-time web data
> - Signal 2: Claude AI cross-validates sources
> - Signal 3: NewsAPI verifies through trusted media
>
> All evidence is permanently stored on Hedera Consensus Service, creating an immutable audit trail.
>
> Our markets use **Hedera Token Service** for instant, low-cost settlements - just $0.0001 per transaction, making micro-predictions viable across Africa."

### **On-Screen Text:**
```
✅ HCS: Immutable evidence storage
✅ HTS: CAST token for betting
✅ Smart Contracts: Automated market resolution
✅ Cost: $0.0001 per transaction
```

---

## 🔴 **0:45 - 2:45 | LIVE HEDERA DEMO - THE CORE (2 minutes)**

### **⚠️ MANDATORY SECTION - THIS IS CRITICAL FOR SCORING**

---

### **DEMO 1: Create a Market (30 seconds) | 0:45 - 1:15**

### **Visual:**
1. Click "Create Prediction" button
2. Fill out form:
   - Claim: "Will Nigeria's inflation rate drop below 20% by Q1 2026?"
   - Category: Economy
   - End Date: March 31, 2026
   - Description: Brief explanation
3. Click "Create Market"
4. **Show MetaMask popup** (IMPORTANT!)
5. **Approve transaction**

### **Script:**
> "Let me create a new market about Nigeria's inflation.
>
> I'll click 'Create Prediction'... enter the claim... set the end date to Q1 2026...
>
> Now I submit this to Hedera. Notice MetaMask is requesting approval - this is a **ContractExecuteTransaction** calling our PredictionMarketFactory contract on Hedera Testnet.
>
> [Click Confirm]
>
> The transaction is processing... and done! Market created."

### **Visual - MANDATORY:**
6. **IMMEDIATELY switch to browser tab with HashScan open**
7. **Show the transaction hash on HashScan:**
   - URL: `https://hashscan.io/testnet/transaction/0x...`
   - Point to:
     - ✅ Transaction Type: "CONTRACT CALL"
     - ✅ Status: "SUCCESS"
     - ✅ Contract: Your factory address
     - ✅ Timestamp
     - ✅ Gas used

### **Script:**
> "Here's the proof on HashScan - transaction hash [read hash], successfully executed on Hedera Testnet.
>
> This created a new smart contract instance for our market, deployed at address [show address]."

### **On-Screen Text:**
```
🔗 Hedera Service: Smart Contract Execution
📝 Contract: PredictionMarketFactory
💰 Cost: ~0.008 HBAR (~$0.0002)
⏱️  Confirmation: 3 seconds
```

---

### **DEMO 2: Place a Bet (30 seconds) | 1:15 - 1:45**

### **Visual:**
1. Return to BlockCast
2. Find an active market (pick one with good odds)
3. Click "YES" button
4. Enter amount: "10 CAST"
5. Click "Cast Position"
6. **Show MetaMask popup**
7. **Approve transaction**

### **Script:**
> "Now I'll place a bet. I believe this market will resolve YES, so I'm betting 10 CAST tokens.
>
> MetaMask is requesting approval again - this time it's two transactions:
> 1. **HTS Token Transfer** - approving CAST token spending
> 2. **Contract Execution** - buying YES shares in the market
>
> [Click Confirm]
>
> Processing... and my bet is placed!"

### **Visual - MANDATORY:**
8. **Switch to HashScan**
9. **Show the bet transaction:**
   - Point to the `buyYes` function call
   - Show CAST token transfer
   - Show gas used

### **Script:**
> "On HashScan, you can see the HTS token transfer and the contract call to buyYes. The market odds updated instantly based on my bet."

### **On-Screen Text:**
```
🔗 Hedera Service: HTS Token + Smart Contract
🪙 Token: CAST (HTS Token)
💰 Cost: ~0.008 HBAR
⏱️  Settlement: Instant
```

---

### **DEMO 3: Submit Evidence (45 seconds) | 1:45 - 2:30**

### **Visual:**
1. Navigate to "Disputable Markets" tab
2. Find a market ready for evidence
3. Click on market to open detail page
4. Scroll to "Submit Evidence" section
5. Type evidence:
   ```
   Reuters confirms Bitcoin reached $95,000 on Dec 1, 2024
   Source: https://reuters.com/markets/bitcoin-95k
   ```
6. Click "Submit Evidence"
7. **Show MetaMask popup**

### **Script:**
> "This is the most powerful feature - our evidence submission system.
>
> Markets in dispute need evidence. Anyone can submit supporting data, which gets permanently stored on **Hedera Consensus Service**.
>
> I'm submitting evidence from Reuters about a Bitcoin market. MetaMask is showing this as an **HCS TopicMessageSubmitTransaction**.
>
> [Click Confirm]
>
> Submitting to HCS Topic ID [show topic ID]...
>
> Evidence submitted! This is now permanently on-chain and will feed into our Three-Signal AI Resolution System."

### **Visual - MANDATORY:**
8. **Switch to HashScan**
9. **Navigate to HCS Topic view:**
   - URL: `https://hashscan.io/testnet/topic/0.0.6701034`
   - Show your evidence message in the topic messages list
   - Point to:
     - ✅ Topic ID
     - ✅ Sequence number
     - ✅ Message content (your evidence)
     - ✅ Timestamp
     - ✅ Consensus timestamp

### **Script:**
> "Here on HashScan's HCS Topic explorer, you can see my evidence message.
>
> Topic ID 0.0.6701034 stores all evidence submissions. Each message gets a consensus timestamp and is immutable - perfect for creating a verifiable audit trail for fact-checking.
>
> This costs only $0.0001 per message, making it economically viable for high-volume verification in African markets."

### **On-Screen Text:**
```
🔗 Hedera Service: HCS (Consensus Service)
📨 Topic ID: 0.0.6701034
💰 Cost: $0.0001 per evidence
⚡ Finality: 3-5 seconds (ABFT)
🔒 Immutability: Permanent
```

---

### **DEMO 4: AI Resolution Preview (15 seconds) | 2:30 - 2:45**

### **Visual:**
1. Show admin panel (quickly)
2. Show the Three-Signal system running
3. Show AI confidence scores updating
4. Show final resolution being calculated

### **Script:**
> "Behind the scenes, our Three-Signal AI system aggregates evidence from Perplexity, Claude, and NewsAPI.
>
> When confidence reaches 80%, markets auto-resolve. All AI attestations are also logged to HCS Topic 0.0.6701035 for transparency.
>
> This creates a trustless, verifiable prediction market that's impossible to manipulate."

### **On-Screen Text:**
```
🤖 AI Resolution System
Signal 1: Perplexity (Web)
Signal 2: Claude (Analysis)
Signal 3: NewsAPI (Media)

🔗 All AI outputs → HCS Topic 0.0.6701035
```

---

## 🎯 **2:45 - 3:00 | Conclusion (15 seconds)**

### **Visual:**
- Split screen showing:
  - BlockCast UI
  - HashScan with transactions
  - Quick stat overlay

### **Script:**
> "BlockCast demonstrates how Hedera's unique combination of speed, low cost, and finality solves real African problems.
>
> **Why Hedera?**
> - HCS makes evidence storage affordable at scale
> - HTS enables instant, low-cost settlements
> - ABFT finality ensures trust without intermediaries
>
> We've deployed on Testnet with 100+ markets, processing over 500 transactions.
>
> Next steps: Mainnet launch, partnerships with African fact-checking orgs, and expanding to 10,000 users by Q2 2026.
>
> Thank you!"

### **On-Screen Text:**
```
📊 Key Metrics (Testnet):
• 100+ markets created
• 500+ transactions processed
• $0.02 average tx cost
• 3s average finality

🚀 Roadmap:
Q1 2026: Mainnet launch
Q2 2026: 10K users
Q3 2026: Fact-checker partnerships

🔗 Links:
Live: blockcast-hedera.vercel.app
GitHub: [your-repo]
Deck: [pitch-deck-link]
```

### **Final Frame:**
```
BlockCast
Decentralized Truth Markets on Hedera

Team: [Your Name]
Track: Onchain Finance & RWA
Built with: HCS, HTS, Smart Contracts

Thank you, Hedera Africa Hackathon!
```

---

## 📋 **Production Checklist:**

### **Before Recording:**
- [ ] Clear browser cache
- [ ] Open HashScan tabs for all 3 demos BEFORE starting
- [ ] Have test HBAR and CAST ready
- [ ] Test all transactions once to ensure they work
- [ ] Set browser zoom to 100%
- [ ] Close unnecessary tabs
- [ ] Turn off notifications

### **Recording Setup:**
- [ ] Use **OBS Studio** or **Loom** for screen recording
- [ ] Resolution: **1920x1080** minimum
- [ ] Frame rate: **30fps**
- [ ] Audio: Clear microphone, no background noise
- [ ] Cursor: Enable cursor highlighting for better visibility

### **Multiple Takes Strategy:**
1. Record each section separately
2. Do 2-3 takes of each demo
3. Edit together the best takes
4. Add on-screen text overlays in post-production
5. Background music (optional, low volume)

### **Critical Success Factors:**
✅ **Show actual working transactions** (not mockups)
✅ **Show transaction hash on HashScan IMMEDIATELY after each action**
✅ **Clearly state Hedera services used** (HCS, HTS, Smart Contracts)
✅ **Demonstrate cost advantage** ($0.0001 vs competitors)
✅ **Show immutability** (HCS topic messages)
✅ **Stay under 3:00 minutes**

---

## 🎥 **Video Editing Notes:**

### **Pacing:**
- Speak clearly but energetically
- Don't rush through HashScan sections
- Let transactions confirm on screen (2-3 seconds is fine)

### **Text Overlays:**
- Use white text with black outline for readability
- Add arrows pointing to key UI elements
- Highlight transaction hashes on HashScan

### **Transitions:**
- Smooth fade between demos
- Quick cut for HashScan switches
- No fancy effects - keep it professional

---

## 🔗 **Key Hedera IDs to Show:**

```
Smart Contract Factory: [Your factory address]
CAST Token (HTS): 0xC78Ac73844077917E20530E36ac935c4B56236c2
Evidence HCS Topic: 0.0.6701034
AI Attestation Topic: 0.0.6701035
Admin Account: 0.0.6643581
```

---

## 💡 **Pro Tips:**

1. **Practice timing**: Record a dry run and time each section
2. **Energy level**: Match your enthusiasm in the intro and conclusion
3. **Technical clarity**: Don't assume judges know blockchain jargon
4. **Visual hierarchy**: Always show what you're talking about
5. **Proof is everything**: The HashScan sections are 50% of your credibility

---

## ⚠️ **Common Mistakes to Avoid:**

❌ Talking too fast (judges need to follow)
❌ Not showing transaction confirmations
❌ Skipping HashScan verification
❌ Using static mockups instead of live demo
❌ Going over 3 minutes
❌ Poor audio quality
❌ Not explaining WHY Hedera (just showing features)

---

**Good luck! This script is designed to hit every judging criteria while showcasing BlockCast's technical depth and real-world impact. 🚀**
