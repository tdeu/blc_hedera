import { ethers } from 'ethers';

const errorData = '0xfb8f41b2000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000';

// Common ERC20 custom errors
const errors = [
  'error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)',
  'error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)',
  'error ERC20InvalidSender(address sender)',
  'error ERC20InvalidReceiver(address receiver)'
];

for (const errorSig of errors) {
  try {
    const iface = new ethers.Interface([errorSig]);
    const selector = errorData.slice(0, 10);
    const errorFragment = iface.fragments.find(f => iface.getFunction(f.name).selector === selector);
    
    if (errorFragment) {
      const decoded = iface.parseError(errorData);
      console.log(`✅ Error: ${decoded.name}`);
      console.log('Arguments:');
      for (let i = 0; i < decoded.args.length; i++) {
        const value = decoded.args[i];
        console.log(`  ${errorFragment.inputs[i].name}:`, value.toString());
        if (errorFragment.inputs[i].type.includes('uint')) {
          console.log(`    (${ethers.formatEther(value)} CAST)`);
        }
      }
      break;
    }
  } catch (e) {
    // Try next error
  }
}
