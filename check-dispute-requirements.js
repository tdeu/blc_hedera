import { ethers } from 'ethers';

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const MARKET_ADDRESS = '0x3cc12acb789d734f13a51191a933bf947d872e48';
const USER_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
const DISPUTE_MANAGER_ADDRESS = '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172';

const MARKET_ABI = [
  "function isPendingResolution() external view returns (bool)",
  "function marketInfo() external view returns (tuple(bytes32 claimId, address creator, uint256 endTime, uint8 status))"
];

const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

const DISPUTE_MANAGER_ABI = [
  "function DISPUTE_BOND_AMOUNT() external view returns (uint256)",
  "function getMarketDisputes(address) external view returns (uint256[])",
  "function getDispute(uint256) external view returns (tuple(uint256 id, address disputer, address marketAddress, uint256 bondAmount, string evidence, string reason, bytes32 evidenceHash, uint256 createdAt, uint256 resolveBy, uint8 status, uint8 outcome, address resolvedBy, uint256 resolvedAt, string adminNotes))"
];

async function checkDisputeRequirements() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log('\n🔍 Checking dispute requirements for market:', MARKET_ADDRESS);
  console.log('👤 User:', USER_ADDRESS);
  console.log('');

  try {
    // Check market status
    const market = new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, provider);
    const isPending = await market.isPendingResolution();
    const marketInfo = await market.marketInfo();

    console.log('📊 Market Status:');
    console.log('  - isPendingResolution():', isPending);
    console.log('  - status enum value:', marketInfo.status.toString());
    console.log('  - Expected: status=2 (PendingResolution)');
    console.log('');

    // Check CAST token balance and allowance
    const castToken = new ethers.Contract(CAST_TOKEN_ADDRESS, ERC20_ABI, provider);
    const balance = await castToken.balanceOf(USER_ADDRESS);
    const allowance = await castToken.allowance(USER_ADDRESS, DISPUTE_MANAGER_ADDRESS);

    console.log('💰 CAST Token (Bond Requirements):');
    const balanceInTokens = ethers.formatEther(balance);
    const allowanceInTokens = ethers.formatEther(allowance);
    console.log('  - User balance:', balanceInTokens, 'CAST');
    console.log('  - Allowance to DisputeManager:', allowanceInTokens, 'CAST');
    console.log('');

    // Check bond requirement
    const disputeManager = new ethers.Contract(DISPUTE_MANAGER_ADDRESS, DISPUTE_MANAGER_ABI, provider);
    const bondAmount = await disputeManager.DISPUTE_BOND_AMOUNT();
    const bondInTokens = ethers.formatEther(bondAmount);
    console.log('  - Required bond:', bondInTokens, 'CAST');
    console.log('  - Has enough balance?', parseFloat(balanceInTokens) >= parseFloat(bondInTokens) ? '✅ YES' : '❌ NO');
    console.log('  - Has enough allowance?', parseFloat(allowanceInTokens) >= parseFloat(bondInTokens) ? '✅ YES' : '❌ NO');
    console.log('');

    // Check existing disputes
    console.log('🏛️ Existing Disputes:');
    try {
      const existingDisputes = await disputeManager.getMarketDisputes(MARKET_ADDRESS);
      console.log('  - Number of disputes:', existingDisputes.length);

      if (existingDisputes.length > 0) {
        console.log('  - Dispute IDs:', existingDisputes.map(d => d.toString()).join(', '));
        console.log('');

        // Check each dispute to see if any belong to this user
        for (const disputeId of existingDisputes) {
          const dispute = await disputeManager.getDispute(disputeId);
          const isUserDispute = dispute.disputer.toLowerCase() === USER_ADDRESS.toLowerCase();
          const statusNames = ['Active', 'Resolved', 'Rejected', 'Expired'];
          const outcomeNames = ['Pending', 'Upheld', 'Rejected'];

          if (isUserDispute) {
            console.log(`  ⚠️ Dispute #${disputeId} - BELONGS TO THIS USER`);
            console.log(`     Status: ${statusNames[dispute.status]}`);
            console.log(`     Outcome: ${outcomeNames[dispute.outcome]}`);
            console.log(`     Reason: ${dispute.reason}`);
            console.log(`     Created: ${new Date(Number(dispute.createdAt) * 1000).toLocaleString()}`);
            console.log('');
          }
        }
      }
    } catch (disputeError) {
      console.log('  ⚠️ Could not fetch disputes:', disputeError.message);
    }
    console.log('');

    // Summary
    console.log('📋 Summary:');
    console.log('  ✅ Market is in PendingResolution:', isPending);
    console.log('  ' + (parseFloat(balanceInTokens) >= parseFloat(bondInTokens) ? '✅' : '❌') + ' Has enough CAST balance');
    console.log('  ' + (parseFloat(allowanceInTokens) >= parseFloat(bondInTokens) ? '✅' : '❌') + ' Has approved DisputeManager');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDisputeRequirements();
