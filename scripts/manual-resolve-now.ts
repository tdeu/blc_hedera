/**
 * Manual script to immediately resolve the specific market
 * This bypasses the monitor and directly calls preliminaryResolve()
 */

import { ethers } from 'ethers';

const MARKET_CONTRACT = '0x8430B58B3E97Beb9DE81D7aC5179748cF48a797F';
const BET_NFT_CONTRACT = '0x9D9AC2a41F84C4B2d5c80FCFcB54d26e38C3Aa91';
const ADMIN_PRIVATE_KEY = '98570d874eda35327ae5253c87aa74a5b0e9e33e2189b022a0f8877ed812ee0a';

const MARKET_ABI = [
  "function getMarketInfo() external view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))",
  "function isPendingResolution() external view returns (bool)",
  "function preliminaryResolve(uint8 outcome) external"
];

const BET_NFT_ABI = [
  "event BetNFTMinted(uint256 indexed tokenId, address indexed market, address indexed owner, uint256 shares, bool isYes)"
];

async function manualResolveNow() {
  console.log('🚀 MANUAL RESOLUTION - IMMEDIATE ACTION');
  console.log('='.repeat(60));

  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  
  try {
    // 1. Check current status
    console.log('\n📊 1. Current market status...');
    const marketContract = new ethers.Contract(MARKET_CONTRACT, MARKET_ABI, provider);
    
    const marketInfo = await marketContract.getMarketInfo();
    const isPending = await marketContract.isPendingResolution();
    const statuses = ['Submited', 'Open', 'PendingResolution', 'Resolved', 'Canceled'];
    
    console.log(`   Question: ${marketInfo.question}`);
    console.log(`   Status: ${statuses[marketInfo.status]} (${marketInfo.status})`);
    console.log(`   Is Pending Resolution: ${isPending ? 'YES' : 'NO'}`);
    
    if (isPending) {
      console.log('✅ Market is already in PendingResolution state - no action needed');
      return;
    }

    // 2. Analyze bets
    console.log('\n📊 2. Analyzing bet majority...');
    const betNFT = new ethers.Contract(BET_NFT_CONTRACT, BET_NFT_ABI, provider);
    
    const filter = betNFT.filters.BetNFTMinted(null, MARKET_CONTRACT, null);
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100000);
    
    const events = await betNFT.queryFilter(filter, fromBlock, currentBlock);
    console.log(`   Found ${events.length} bet events`);
    
    if (events.length === 0) {
      console.log('❌ No bets found - cannot determine outcome');
      return;
    }
    
    let yesBets = 0;
    let noBets = 0;
    
    for (const event of events) {
      const isYes = event.args.isYes;
      if (isYes) {
        yesBets++;
      } else {
        noBets++;
      }
    }
    
    console.log(`   YES bets: ${yesBets}`);
    console.log(`   NO bets: ${noBets}`);
    
    const majorityOutcome = yesBets > noBets ? 'yes' : 'no';
    const contractOutcome = majorityOutcome === 'yes' ? 1 : 2;
    
    console.log(`   🎯 Majority outcome: ${majorityOutcome.toUpperCase()}`);
    console.log(`   📝 Contract outcome value: ${contractOutcome}`);

    // 3. Check admin wallet
    console.log('\n🔐 3. Checking admin wallet...');
    const adminAddress = await adminWallet.getAddress();
    const balance = await provider.getBalance(adminAddress);
    const hbarBalance = parseFloat(ethers.formatEther(balance));
    
    console.log(`   Admin address: ${adminAddress}`);
    console.log(`   Admin balance: ${hbarBalance} HBAR`);
    
    if (hbarBalance < 1) {
      console.log('⚠️  Low admin balance - transaction might fail');
    }

    // 4. Call preliminaryResolve
    console.log('\n🚀 4. Calling preliminaryResolve()...');
    const adminMarketContract = new ethers.Contract(MARKET_CONTRACT, MARKET_ABI, adminWallet);
    
    console.log(`   Calling preliminaryResolve(${contractOutcome})...`);
    const tx = await adminMarketContract.preliminaryResolve(contractOutcome);
    
    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // 5. Verify the result
    console.log('\n✅ 5. Verifying result...');
    const newIsPending = await marketContract.isPendingResolution();
    const newMarketInfo = await marketContract.getMarketInfo();
    
    console.log(`   New Status: ${statuses[newMarketInfo.status]} (${newMarketInfo.status})`);
    console.log(`   Is Pending Resolution: ${newIsPending ? 'YES' : 'NO'}`);
    
    if (newIsPending) {
      console.log('\n🎉 SUCCESS! Market is now in PendingResolution state');
      console.log('   Users can now submit evidence/disputes');
      console.log('   Evidence submission should work immediately!');
    } else {
      console.log('\n❌ FAILED! Market is still not in PendingResolution state');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Fix: Add more HBAR to your admin wallet');
    } else if (error.message.includes('nonce')) {
      console.log('\n💡 Fix: Wait a moment and try again (nonce issue)');
    } else if (error.message.includes('gas')) {
      console.log('\n💡 Fix: Gas estimation issue - try increasing gas limit');
    }
  }
}

// Run the manual resolution immediately
manualResolveNow();
