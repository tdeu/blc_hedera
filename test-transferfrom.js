import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const USER_ADDRESS = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';
const DISPUTE_MANAGER = '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172';
const CAST_TOKEN = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

const provider = new ethers.JsonRpcProvider(RPC_URL);

async function testTransferFrom() {
  const tokenAbi = [
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)"
  ];
  
  const token = new ethers.Contract(CAST_TOKEN, tokenAbi, provider);
  
  // Check current state
  const balance = await token.balanceOf(USER_ADDRESS);
  const allowance = await token.allowance(USER_ADDRESS, DISPUTE_MANAGER);
  
  console.log('Current state:');
  console.log('  Balance:', ethers.formatEther(balance), 'CAST');
  console.log('  Allowance:', ethers.formatEther(allowance), 'CAST');
  console.log('');
  
  // Try to simulate transferFrom AS IF dispute manager is calling it
  console.log('Simulating transferFrom(user → disputeManager, 1 CAST)...');
  
  try {
    const result = await token.transferFrom.staticCall(
      USER_ADDRESS,
      DISPUTE_MANAGER,
      ethers.parseEther('1'),
      { from: DISPUTE_MANAGER }  // Simulate call FROM DisputeManager
    );
    
    console.log('✅ transferFrom would succeed:', result);
  } catch (error) {
    console.log('❌ transferFrom would fail:');
    console.log('Message:', error.message);
    
    if (error.data) {
      // Try to decode the error
      const errorSelector = error.data.slice(0, 10);
      console.log('Error selector:', errorSelector);
      
      if (errorSelector === '0xfb8f41b2') {
        console.log('This is ERC20InsufficientAllowance!');
        // Decode the error parameters
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address', 'uint256', 'uint256'],
          '0x' + error.data.slice(10)
        );
        console.log('  Spender:', decoded[0]);
        console.log('  Current allowance:', ethers.formatEther(decoded[1]));
        console.log('  Needed:', ethers.formatEther(decoded[2]));
      }
    }
  }
}

testTransferFrom();
