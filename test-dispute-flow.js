import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const MARKET_ADDRESS = '0x3cc12acb789d734f13a51191a933bf947d872e48';
const USER_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
const DISPUTE_MANAGER = '0x03cFC0A672ad11371531ae1d7EfC0BDB692484BD'; // NEW deployment
const CAST_TOKEN = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

const provider = new ethers.JsonRpcProvider(RPC_URL);

async function testDisputeFlow() {
  console.log('🧪 Testing dispute creation flow with NEW DisputeManager\n');

  // 1. Check market status
  const marketAbi = ["function isPendingResolution() view returns (bool)"];
  const market = new ethers.Contract(MARKET_ADDRESS, marketAbi, provider);
  const isPending = await market.isPendingResolution();
  console.log('1. Market isPendingResolution:', isPending ? '✅' : '❌');

  // 2. Check user balance
  const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
  const token = new ethers.Contract(CAST_TOKEN, erc20Abi, provider);
  const balance = await token.balanceOf(USER_ADDRESS);
  const hasBalance = balance >= ethers.parseEther('1');
  console.log('2. User has >= 1 CAST:', hasBalance ? '✅' : '❌', ethers.formatEther(balance));

  // 3. Check existing disputes on NEW DisputeManager
  const dmAbi = [
    "function getMarketDisputes(address) view returns (uint256[])",
    "function createDispute(address _marketAddress, string calldata _reason, string calldata _evidence, bytes32 _evidenceHash) external returns (uint256)"
  ];
  const dm = new ethers.Contract(DISPUTE_MANAGER, dmAbi, provider);
  const disputes = await dm.getMarketDisputes(MARKET_ADDRESS);
  console.log('3. Existing disputes on new DM:', disputes.length, '✅');

  // 4. Check current allowance
  const allowanceAbi = ["function allowance(address,address) view returns (uint256)"];
  const token2 = new ethers.Contract(CAST_TOKEN, allowanceAbi, provider);
  const allowance = await token2.allowance(USER_ADDRESS, DISPUTE_MANAGER);
  console.log('4. Current allowance for new DM:', ethers.formatEther(allowance), 'CAST');

  console.log('\n📝 Simulating dispute creation...');

  const reason = "Evidence submitted via dispute form";
  const evidence = "Test evidence for the new DisputeManager deployment";
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(evidence));

  try {
    // Simulate the dispute creation
    const result = await dm.createDispute.staticCall(
      MARKET_ADDRESS,
      reason,
      evidence,
      evidenceHash,
      { from: USER_ADDRESS }
    );

    console.log('✅ Simulation succeeded! Would create dispute ID:', result.toString());
    console.log('\n🎉 NEW DisputeManager is working correctly!');
    console.log('📌 User needs to:');
    console.log('   1. Approve CAST tokens for new DisputeManager:', DISPUTE_MANAGER);
    console.log('   2. Submit dispute through the UI');
  } catch (error) {
    console.log('❌ Simulation failed:');
    console.log('Error:', error.message);

    if (error.message.includes('ERC20InsufficientAllowance')) {
      console.log('\n💡 This is expected - user needs to approve the NEW DisputeManager address first');
      console.log('   The old approval was for:', '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172');
      console.log('   New DisputeManager is:', DISPUTE_MANAGER);
    }
  }
}

testDisputeFlow().catch(console.error);
