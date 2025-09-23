import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkWalletBalance() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  // Collateral token address from your deployment
  const collateralTokenAddress = '0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d';

  console.log('💰 Checking collateral balances...');
  console.log('🪙 Collateral token:', collateralTokenAddress);

  const tokenABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)"
  ];

  const collateralToken = new ethers.Contract(collateralTokenAddress, tokenABI, signer);

  // Check common wallet addresses
  const walletsToCheck = [
    '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', // From previous log
    '0xfd76D4c18D5A10F558d057743bFB0218130157f4', // Admin wallet
    // Add your connected wallet address here if you know it
  ];

  console.log('📋 Checking balances for all possible wallets:');

  for (const wallet of walletsToCheck) {
    try {
      const balance = await collateralToken.balanceOf(wallet);
      console.log(`💳 ${wallet}: ${ethers.formatEther(balance)} tokens`);
    } catch (error) {
      console.log(`❌ ${wallet}: Error checking balance`);
    }
  }

  console.log('\n🔍 Please check which address your app wallet is using and let me know!');
  console.log('💡 You can find this in the browser console when you connect your wallet.');
}

checkWalletBalance().catch(console.error);