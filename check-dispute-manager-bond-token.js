import { ethers } from 'ethers';

const RPC_URL = 'https://testnet.hashio.io/api';
const DISPUTE_MANAGER = '0xFa244C9a3e3A77D2933b73Bc7B584779e7C06172';

const provider = new ethers.JsonRpcProvider(RPC_URL);

const dmAbi = ["function bondToken() view returns (address)"];
const dm = new ethers.Contract(DISPUTE_MANAGER, dmAbi, provider);

const bondTokenAddress = await dm.bondToken();
console.log('DisputeManager.bondToken():', bondTokenAddress);
console.log('Expected CAST token:        0xC78Ac73844077917E20530E36ac935c4B56236c2');
console.log('Match:', bondTokenAddress.toLowerCase() === '0xC78Ac73844077917E20530E36ac935c4B56236c2'.toLowerCase() ? '✅' : '❌');
