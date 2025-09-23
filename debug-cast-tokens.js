import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function debugCastTokens() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const castTokenAddress = '0x5e383bD628a0cda81913bbd5EfB4DD1989fCc6e2';
  const marketAddress = '0xdbe5D793Be98990B3A328e38c7D85256994e81aC';

  console.log('💰 Checking CAST token status...');
  console.log('Wallet:', signer.address);
  console.log('CAST Token:', castTokenAddress);
  console.log('Market:', marketAddress);

  const castTokenABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function mint(address to, uint256 amount) external"
  ];

  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  try {
    // Check balance
    const balance = await castToken.balanceOf(signer.address);
    console.log('💳 CAST balance:', ethers.formatEther(balance));

    // Check allowance
    const allowance = await castToken.allowance(signer.address, marketAddress);
    console.log('🔓 Allowance to market:', ethers.formatEther(allowance));

    // If no balance, mint some
    if (balance < ethers.parseEther('100')) {
      console.log('🔄 Minting CAST tokens...');
      const mintTx = await castToken.mint(signer.address, ethers.parseEther('1000'));
      await mintTx.wait();
      console.log('✅ Minted 1000 CAST tokens');

      const newBalance = await castToken.balanceOf(signer.address);
      console.log('💳 New balance:', ethers.formatEther(newBalance));
    }

    // Approve more tokens if needed
    const requiredAmount = ethers.parseEther('100'); // Enough for betting
    if (allowance < requiredAmount) {
      console.log('🔄 Approving CAST tokens...');
      const approveTx = await castToken.approve(marketAddress, ethers.parseEther('1000'));
      await approveTx.wait();
      console.log('✅ Approved 1000 CAST tokens');

      const newAllowance = await castToken.allowance(signer.address, marketAddress);
      console.log('🔓 New allowance:', ethers.formatEther(newAllowance));
    }

    console.log('\n✅ CAST token setup complete! Try betting again.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCastTokens().catch(console.error);