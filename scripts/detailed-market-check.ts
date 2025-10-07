import { ethers } from 'ethers';

const MARKET_CONTRACT = '0x6f517004FAce006cb4B137a6702cD5Efa8cA392b';

async function detailedCheck() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

  // First, let's call isPendingResolution directly
  const isPendingABI = ["function isPendingResolution() external view returns (bool)"];
  const contract1 = new ethers.Contract(MARKET_CONTRACT, isPendingABI, provider);

  console.log('\n🔍 DIRECT CONTRACT STATE CHECKS');
  console.log('='.repeat(80));

  try {
    const isPending = await contract1.isPendingResolution();
    console.log('isPendingResolution():', isPending);
  } catch (e) {
    console.log('❌ isPendingResolution() failed:', e.message);
  }

  // Check the raw status value
  const statusABI = ["function marketInfo() external view returns (bytes32, string, address, uint256, uint8)"];
  const contract2 = new ethers.Contract(MARKET_CONTRACT, statusABI, provider);

  try {
    const info = await contract2.marketInfo();
    const statuses = ['Submited', 'Open', 'PendingResolution', 'Resolved', 'Canceled'];
    console.log('\nRaw marketInfo.status:', info[4], '→', statuses[info[4]]);
  } catch (e) {
    console.log('❌ marketInfo() failed:', e.message);
  }

  // Check individual fields
  const detailABI = [
    "function preliminaryResolveTime() external view returns (uint256)",
    "function preliminaryOutcome() external view returns (uint8)",
    "function resolvedOutcome() external view returns (uint8)",
  ];
  const contract3 = new ethers.Contract(MARKET_CONTRACT, detailABI, provider);

  try {
    const prelimTime = await contract3.preliminaryResolveTime();
    console.log('\npreliminaryResolveTime:', Number(prelimTime));
    if (Number(prelimTime) > 0) {
      console.log('  Date:', new Date(Number(prelimTime) * 1000).toLocaleString());
    } else {
      console.log('  ❌ Market has NOT been preliminarily resolved yet');
    }
  } catch (e) {
    console.log('❌ preliminaryResolveTime() failed:', e.message);
  }

  try {
    const prelimOutcome = await contract3.preliminaryOutcome();
    const outcomes = ['Unset', 'Yes', 'No'];
    console.log('\npreliminaryOutcome:', outcomes[prelimOutcome], `(${prelimOutcome})`);
  } catch (e) {
    console.log('❌ preliminaryOutcome() failed:', e.message);
  }

  try {
    const resolvedOutcome = await contract3.resolvedOutcome();
    const outcomes = ['Unset', 'Yes', 'No'];
    console.log('resolvedOutcome:', outcomes[resolvedOutcome], `(${resolvedOutcome})`);
  } catch (e) {
    console.log('❌ resolvedOutcome() failed:', e.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 ANALYSIS:');
  console.log('If preliminaryResolveTime = 0, the market has NEVER been resolved.');
  console.log('If status = Open (1), then AI has not called preliminaryResolve() yet.');
  console.log('\nThis means the DisputeManager is correctly rejecting your dispute because:');
  console.log('  • The market is still "Open", not "PendingResolution"');
  console.log('  • You can only dispute markets that have been preliminarily resolved');
  console.log('  • isPendingResolution() returns false because status != PendingResolution');
  console.log('\n');
}

detailedCheck();
