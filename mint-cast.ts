import { castTokenService } from './src/utils/castTokenService';
import { walletService } from './src/utils/walletService';

async function mintCastTokens() {
  try {
    const targetAddress = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
    const mintAmount = '500';

    console.log('🏭 Minting 500 CAST tokens to:', targetAddress);
    console.log('🔄 Initializing wallet service...');

    // Initialize wallet connection if needed
    if (!walletService.isConnected()) {
      console.log('⚠️ Wallet not connected, attempting connection...');
      await walletService.connectWallet();
    }

    console.log('✅ Wallet connected, proceeding with minting...');

    const result = await castTokenService.mintTokens(targetAddress, mintAmount);

    console.log('✅ Minting completed successfully!');
    console.log('📤 Transaction hash:', result.transactionHash);

    // Check balance after minting
    console.log('⏳ Checking balance in 5 seconds...');
    setTimeout(async () => {
      try {
        const balance = await castTokenService.getBalance(targetAddress);
        console.log('💰 New CAST balance:', balance, 'CAST');
      } catch (error) {
        console.log('ℹ️ Balance will update shortly...');
      }
    }, 5000);

  } catch (error: any) {
    console.error('❌ Minting failed:', error.message || error);
  }
}

mintCastTokens();