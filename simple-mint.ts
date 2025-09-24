import { ethers } from 'ethers';
import { TOKEN_ADDRESSES } from './src/config/constants';

const CAST_TOKEN_ABI = [
  "function mint(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

async function mintCastTokens() {
  try {
    const targetAddress = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
    const mintAmount = '500';

    console.log('🏭 Direct CAST token minting to:', targetAddress);
    console.log('📊 Amount:', mintAmount, 'CAST');

    // Check if we have a provider available (this might work if MetaMask is configured)
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log('🔗 Connected with:', await signer.getAddress());

      const contract = new ethers.Contract(
        TOKEN_ADDRESSES.CAST_TOKEN,
        CAST_TOKEN_ABI,
        signer
      );

      console.log('🏭 Minting tokens...');
      const amountInWei = ethers.parseEther(mintAmount);
      const tx = await contract.mint(targetAddress, amountInWei);

      console.log('📤 Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('✅ Minting completed!');
      console.log('📤 Final transaction hash:', receipt.transactionHash);

      // Check balance
      const balance = await contract.balanceOf(targetAddress);
      const balanceFormatted = ethers.formatEther(balance);
      console.log('💰 New CAST balance:', balanceFormatted, 'CAST');

    } else {
      console.log('❌ No Ethereum provider available');
      console.log('This script needs to run in a browser environment with MetaMask');
    }

  } catch (error: any) {
    console.error('❌ Minting failed:', error.message || error);
  }
}

// For browser console use
if (typeof window !== 'undefined') {
  (window as any).mintCastTokens = mintCastTokens;
  console.log('✅ mintCastTokens() function available in console');
}

mintCastTokens();