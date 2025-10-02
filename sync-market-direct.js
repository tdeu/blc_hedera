import { ethers } from 'ethers';

async function syncMarket() {
  const MARKET_ADDRESS = '0x3CC12aCb789d734f13A51191a933BF947d872e48'; // markettest 2 30/09
  const OUTCOME = 1; // YES

  console.log('🔄 Syncing market to blockchain...');
  console.log('Market Address:', MARKET_ADDRESS);
  console.log('Outcome:', OUTCOME === 1 ? 'YES' : 'NO');

  // Get signer from MetaMask
  if (typeof window !== 'undefined' && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const PREDICTION_MARKET_ABI = [
      "function preliminaryResolve(uint8 outcome) external",
      "function marketInfo() external view returns (tuple(string claim, address creator, uint256 endTime, uint256 totalYes, uint256 totalNo, uint8 status, uint8 outcome))"
    ];

    const marketContract = new ethers.Contract(MARKET_ADDRESS, PREDICTION_MARKET_ABI, signer);

    // Check current status
    try {
      const info = await marketContract.marketInfo();
      console.log('Current market status:', info.status); // 0=Open, 1=PendingResolution, 2=Resolved, 3=Cancelled
    } catch (e) {
      console.log('Could not get market info:', e.message);
    }

    // Call preliminaryResolve
    console.log('📤 Calling preliminaryResolve...');
    const tx = await marketContract.preliminaryResolve(OUTCOME);
    console.log('⏳ Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('🔗 Transaction hash:', receipt.hash);

    // Check new status
    try {
      const info = await marketContract.marketInfo();
      console.log('New market status:', info.status);
    } catch (e) {
      console.log('Could not get updated market info:', e.message);
    }

  } else {
    console.error('❌ MetaMask not found');
  }
}

syncMarket().catch(error => {
  console.error('❌ Error:', error.message);
  if (error.data) {
    console.error('Error data:', error.data);
  }
});
