import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function getCollateralTokens() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  // From your deployment: collateral token address
  const collateralTokenAddress = '0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d';
  const userWallet = '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead'; // From your log

  console.log('💰 Getting collateral tokens for betting...');
  console.log('🏦 Admin wallet:', signer.address);
  console.log('👤 User wallet:', userWallet);
  console.log('🪙 Collateral token:', collateralTokenAddress);

  const tokenABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function mint(address to, uint256 amount) external",
    "function totalSupply() external view returns (uint256)"
  ];

  const collateralToken = new ethers.Contract(collateralTokenAddress, tokenABI, signer);

  try {
    // Check current balance
    const userBalance = await collateralToken.balanceOf(userWallet);
    console.log('💳 Current user balance:', ethers.formatEther(userBalance), 'tokens');

    // If balance is low, mint some tokens
    if (userBalance < ethers.parseEther('10')) {
      console.log('🔄 Minting collateral tokens for user...');

      try {
        const mintTx = await collateralToken.mint(userWallet, ethers.parseEther('1000'));
        console.log('⏳ Transaction sent:', mintTx.hash);

        await mintTx.wait();
        console.log('✅ Minted 1000 collateral tokens!');

        const newBalance = await collateralToken.balanceOf(userWallet);
        console.log('💳 New balance:', ethers.formatEther(newBalance), 'tokens');
      } catch (mintError) {
        console.log('❌ Minting failed, trying transfer instead...');

        // If minting fails, try transferring from admin
        const adminBalance = await collateralToken.balanceOf(signer.address);
        console.log('💼 Admin balance:', ethers.formatEther(adminBalance));

        if (adminBalance > ethers.parseEther('100')) {
          const transferTx = await collateralToken.transfer(userWallet, ethers.parseEther('100'));
          await transferTx.wait();
          console.log('✅ Transferred 100 tokens to user!');

          const newBalance = await collateralToken.balanceOf(userWallet);
          console.log('💳 New user balance:', ethers.formatEther(newBalance), 'tokens');
        } else {
          console.log('❌ Admin has insufficient tokens to transfer');
        }
      }
    } else {
      console.log('✅ User already has sufficient tokens for betting!');
    }

    console.log('\n🎯 Ready to place real bets! Click Y or N on any market.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

getCollateralTokens().catch(console.error);