// Quick CAST token minting script
import { castTokenService } from './src/utils/castTokenService.js';

async function mintCastTokens() {
  try {
    const targetAddress = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
    const mintAmount = '500';

    console.log('🏭 Minting 500 CAST tokens to:', targetAddress);

    const result = await castTokenService.mintTokens(targetAddress, mintAmount);

    console.log('✅ Minting result:', result);
    console.log('📤 Transaction hash:', result.transactionHash);

    // Check balance after minting
    setTimeout(async () => {
      const balance = await castTokenService.getBalance(targetAddress);
      console.log('💰 New CAST balance:', balance, 'CAST');
    }, 5000);

  } catch (error) {
    console.error('❌ Minting failed:', error);
  }
}

mintCastTokens();