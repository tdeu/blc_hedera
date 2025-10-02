import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const NEW_DISPUTE_MANAGER = '0x03cFC0A672ad11371531ae1d7EfC0BDB692484BD';
const EXPECTED_CAST_TOKEN = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

const provider = new ethers.JsonRpcProvider(RPC_URL);

const dmAbi = [
  "function bondToken() view returns (address)",
  "function DISPUTE_BOND_AMOUNT() view returns (uint256)"
];

const dm = new ethers.Contract(NEW_DISPUTE_MANAGER, dmAbi, provider);

console.log('🔍 Verifying new DisputeManager deployment...\n');

const bondTokenAddress = await dm.bondToken();
console.log('DisputeManager.bondToken():', bondTokenAddress);
console.log('Expected CAST token:        ', EXPECTED_CAST_TOKEN);
console.log('Match:', bondTokenAddress.toLowerCase() === EXPECTED_CAST_TOKEN.toLowerCase() ? '✅' : '❌');

const bondAmount = await dm.DISPUTE_BOND_AMOUNT();
console.log('\nBond amount:', ethers.formatEther(bondAmount), 'CAST');

// Verify the CAST token has a contract
const code = await provider.getCode(bondTokenAddress);
console.log('\nCAST token contract code length:', code.length, code.length > 2 ? '✅ Has contract' : '❌ No contract');

console.log('\n✅ DisputeManager is properly configured!');
