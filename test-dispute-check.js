import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const MARKET_ADDRESS = '0x3cc12acb789d734f13a51191a933bf947d872e48';
const USER_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
const DISPUTE_MANAGER = '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172';
const CAST_TOKEN = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

const provider = new ethers.JsonRpcProvider(RPC_URL);

// Check each requirement individually
async function checkRequirements() {
  // 1. Check market isPendingResolution
  const marketAbi = ["function isPendingResolution() view returns (bool)"];
  const market = new ethers.Contract(MARKET_ADDRESS, marketAbi, provider);
  const isPending = await market.isPendingResolution();
  console.log('1. isPendingResolution():', isPending ? '✅ TRUE' : '❌ FALSE');
  
  // 2. Check CAST balance
  const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
  const castToken = new ethers.Contract(CAST_TOKEN, erc20Abi, provider);
  const balance = await castToken.balanceOf(USER_ADDRESS);
  const balanceInTokens = ethers.formatEther(balance);
  console.log('2. CAST Balance:', balanceInTokens, balance >= ethers.parseEther('1') ? '✅ >= 1' : '❌ < 1');
  
  // 3. Check allowance
  const allowanceAbi = ["function allowance(address,address) view returns (uint256)"];
  const castForAllowance = new ethers.Contract(CAST_TOKEN, allowanceAbi, provider);
  const allowance = await castForAllowance.allowance(USER_ADDRESS, DISPUTE_MANAGER);
  const allowanceInTokens = ethers.formatEther(allowance);
  console.log('3. Allowance:', allowanceInTokens, allowance >= ethers.parseEther('1') ? '✅ >= 1' : '❌ < 1');
  
  // 4. Try to simulate the transferFrom
  console.log('\n🔍 Testing transferFrom simulation...');
  try {
    const transferAbi = ["function transferFrom(address,address,uint256) returns (bool)"];
    const castForTransfer = new ethers.Contract(CAST_TOKEN, transferAbi, provider);
    
    // Simulate as if DisputeManager is calling
    const result = await castForTransfer.transferFrom.staticCall(
      USER_ADDRESS,
      DISPUTE_MANAGER,
      ethers.parseEther('1')
    );
    console.log('   transferFrom simulation:', result ? '✅ SUCCESS' : '❌ FAILED');
  } catch (err) {
    console.log('   transferFrom simulation: ❌ FAILED');
    console.log('   Error:', err.message);
  }
}

checkRequirements();
