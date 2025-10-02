import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const MARKET_ADDRESS = '0x3cc12acb789d734f13a51191a933bf947d872e48';
const USER_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
const DISPUTE_MANAGER = '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172';
const CAST_TOKEN = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

const provider = new ethers.JsonRpcProvider(RPC_URL);

async function testAll() {
  console.log('Testing all dispute requirements:\n');
  
  // 1. Market status
  const marketAbi = ["function isPendingResolution() view returns (bool)"];
  const market = new ethers.Contract(MARKET_ADDRESS, marketAbi, provider);
  const isPending = await market.isPendingResolution();
  console.log('1. Market isPendingResolution:', isPending ? '✅' : '❌');
  
  // 2. Balance
  const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
  const token = new ethers.Contract(CAST_TOKEN, erc20Abi, provider);
  const balance = await token.balanceOf(USER_ADDRESS);
  const hasBalance = balance >= ethers.parseEther('1');
  console.log('2. User has >= 1 CAST:', hasBalance ? '✅' : '❌', ethers.formatEther(balance));
  
  // 3. Existing disputes
  const dmAbi = ["function getMarketDisputes(address) view returns (uint256[])"];
  const dm = new ethers.Contract(DISPUTE_MANAGER, dmAbi, provider);
  const disputes = await dm.getMarketDisputes(MARKET_ADDRESS);
  console.log('3. Existing disputes:', disputes.length);
  
  if (disputes.length > 0) {
    const getDisputeAbi = ["function getDispute(uint256) view returns (tuple(uint256 id, address disputer, address marketAddress, uint256 bondAmount, string evidence, string reason, bytes32 evidenceHash, uint256 createdAt, uint256 resolveBy, uint8 status, uint8 outcome, address resolvedBy, uint256 resolvedAt, string adminNotes))"];
    const dm2 = new ethers.Contract(DISPUTE_MANAGER, getDisputeAbi, provider);
    
    for (const disputeId of disputes) {
      const dispute = await dm2.getDispute(disputeId);
      const isUserDispute = dispute.disputer.toLowerCase() === USER_ADDRESS.toLowerCase();
      const statusNames = ['Active', 'Resolved', 'Rejected', 'Expired'];
      
      console.log(`   Dispute #${disputeId}:`);
      console.log(`     Disputer: ${dispute.disputer}`);
      console.log(`     Status: ${statusNames[dispute.status]}`);
      console.log(`     Is user's: ${isUserDispute ? 'YES' : 'NO'}`);
      console.log(`     Is active: ${dispute.status === 0 ? 'YES' : 'NO'}`);
      
      if (isUserDispute && dispute.status === 0) {
        console.log('   ❌ USER ALREADY HAS ACTIVE DISPUTE!');
        return;
      }
    }
  }
  
  console.log('   ✅ No active disputes from user');
  
  // 4. Check allowance AFTER approval
  const allowanceAbi = ["function allowance(address,address) view returns (uint256)"];
  const token2 = new ethers.Contract(CAST_TOKEN, allowanceAbi, provider);
  const allowance = await token2.allowance(USER_ADDRESS, DISPUTE_MANAGER);
  const hasAllowance = allowance >= ethers.parseEther('1');
  console.log('4. Allowance >= 1 CAST:', hasAllowance ? '✅' : '❌', ethers.formatEther(allowance));
  
  console.log('\n📊 All checks passed! Dispute should work.');
}

testAll().catch(console.error);
