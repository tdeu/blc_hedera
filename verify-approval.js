import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const USER_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
const DISPUTE_MANAGER = '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172';
const CORRECT_CAST_TOKEN = '0xB9e39C8d1856cf1E1b9F1DD0B35DFB7C62b80C84';

const provider = new ethers.JsonRpcProvider(RPC_URL);

const tokenAbi = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const token = new ethers.Contract(CORRECT_CAST_TOKEN, tokenAbi, provider);

const allowance = await token.allowance(USER_ADDRESS, DISPUTE_MANAGER);
const balance = await token.balanceOf(USER_ADDRESS);

console.log('CORRECT CAST Token:', CORRECT_CAST_TOKEN);
console.log('User balance:', ethers.formatEther(balance), 'CAST');
console.log('Allowance to DisputeManager:', ethers.formatEther(allowance), 'CAST');
console.log('');

if (balance >= ethers.parseEther('1')) {
  console.log('✅ User has enough balance');
} else {
  console.log('❌ User does NOT have enough balance');
}

if (allowance >= ethers.parseEther('1')) {
  console.log('✅ User has approved DisputeManager');
} else {
  console.log('❌ User has NOT approved DisputeManager');
  console.log('   You need to approve before creating dispute!');
}
