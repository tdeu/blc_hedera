import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const MARKET_ADDRESS = '0x3cc12acb789d734f13a51191a933bf947d872e48';
const USER_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
const DISPUTE_MANAGER = '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172';

const provider = new ethers.JsonRpcProvider(RPC_URL);

const DM_ABI = [
  "function createDispute(address _marketAddress, string calldata _reason, string calldata _evidence, bytes32 _evidenceHash) external returns (uint256)"
];

async function simulateDispute() {
  const dm = new ethers.Contract(DISPUTE_MANAGER, DM_ABI, provider);
  
  const reason = "Evidence submitted via dispute form";
  const evidence = "eeeeeeeeeeeeeeeeeeeeeeezezeze\n\nLinks: www.truth.com";
  const evidenceHash = "0x63604d318e23a477d5dd3185b9add5dc8e293fe04d621ed40608a6c857e5be08";
  
  console.log('Simulating createDispute call...');
  console.log('Market:', MARKET_ADDRESS);
  console.log('Reason:', reason, `(${reason.length} chars)`);
  console.log('Evidence:', evidence, `(${evidence.length} chars)`);
  console.log('Hash:', evidenceHash);
  console.log('');
  
  try {
    // Try static call (simulation)
    const result = await dm.createDispute.staticCall(
      MARKET_ADDRESS,
      reason,
      evidence,
      evidenceHash,
      { from: USER_ADDRESS }
    );
    
    console.log('✅ Simulation succeeded! Would create dispute ID:', result.toString());
  } catch (error) {
    console.log('❌ Simulation failed:');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    if (error.data) {
      console.log('Error data:', error.data);
    }
    
    // Try to decode error
    if (error.message.includes('ERC20')) {
      console.log('\n💡 This looks like a token allowance/balance issue');
    }
  }
}

simulateDispute();
