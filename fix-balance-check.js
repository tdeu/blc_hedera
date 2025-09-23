import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function fixBalanceCheck() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  // Exact address from your log (mixed case)
  const userWallet = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
  const collateralTokenAddress = '0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d';

  console.log('🔍 Debug balance check for exact address from app...');
  console.log('👤 User wallet (from app):', userWallet);
  console.log('🪙 Collateral token:', collateralTokenAddress);

  const tokenABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)"
  ];

  const collateralToken = new ethers.Contract(collateralTokenAddress, tokenABI, signer);

  try {
    // Check balance for exact address
    const balance = await collateralToken.balanceOf(userWallet);
    console.log('💳 Current balance:', ethers.formatEther(balance), 'tokens');

    if (balance < ethers.parseEther('10')) {
      console.log('🔄 Transferring more tokens to this exact address...');

      const transferTx = await collateralToken.transfer(userWallet, ethers.parseEther('500'));
      console.log('⏳ Transaction:', transferTx.hash);

      await transferTx.wait();
      console.log('✅ Transferred 500 tokens!');

      const newBalance = await collateralToken.balanceOf(userWallet);
      console.log('💳 New balance:', ethers.formatEther(newBalance), 'tokens');
    } else {
      console.log('✅ Wallet already has sufficient tokens!');
    }

    // Test both address formats
    console.log('\n🔍 Testing both address formats:');
    const lowerBalance = await collateralToken.balanceOf(userWallet.toLowerCase());
    console.log('📍 Lowercase balance:', ethers.formatEther(lowerBalance));

    const mixedBalance = await collateralToken.balanceOf(userWallet);
    console.log('📍 Mixed case balance:', ethers.formatEther(mixedBalance));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixBalanceCheck().catch(console.error);