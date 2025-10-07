import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
const block = await provider.getBlock('latest');

const realNow = Math.floor(Date.now() / 1000);
const blockchainNow = Number(block.timestamp);
const drift = blockchainNow - realNow;

console.log('\n🕐 BLOCKCHAIN CLOCK DRIFT ANALYSIS\n');
console.log('Real UTC time:      ', realNow, '(' + new Date(realNow * 1000).toISOString() + ')');
console.log('Blockchain time:    ', blockchainNow, '(' + new Date(blockchainNow * 1000).toISOString() + ')');
console.log('\n⏰ DRIFT:');
console.log('   Seconds:  ', drift);
console.log('   Minutes:  ', Math.floor(drift / 60));
console.log('   Hours:    ', (drift / 3600).toFixed(2));
console.log('\n📊 CURRENT BUFFER: 1800 seconds (30 minutes)');
console.log('✅ REQUIRED BUFFER:', Math.ceil(drift / 60) + 5, 'minutes (drift + 5 min safety)');
console.log('');
