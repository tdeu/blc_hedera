const { ethers } = require('ethers');

async function checkContractState() {
    // RPC provider
    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

    // Market addresses to check
    const workingMarket = '0x5b1371d050bf57946A9CCb81E2a8008524C3F83A'; // Older working market
    const brokenMarket = '0x39d64Ae0765Be566D3640024b2e0e835C033d478';  // New test market

    // Market ABI
    const marketABI = [
        "function yesShares() external view returns (uint256)",
        "function noShares() external view returns (uint256)",
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
        "function reserve() external view returns (uint256)"
    ];

    console.log('🔍 Checking contract states...\n');

    // Check working market
    console.log('📊 WORKING MARKET:', workingMarket);
    const workingContract = new ethers.Contract(workingMarket, marketABI, provider);
    try {
        const yesShares = await workingContract.yesShares();
        const noShares = await workingContract.noShares();
        const reserve = await workingContract.reserve();
        const [priceYes, priceNo] = await workingContract.getCurrentPrice();

        console.log('  - YES shares:', ethers.formatEther(yesShares));
        console.log('  - NO shares:', ethers.formatEther(noShares));
        console.log('  - Reserve:', ethers.formatEther(reserve));
        console.log('  - Price YES:', ethers.formatEther(priceYes));
        console.log('  - Price NO:', ethers.formatEther(priceNo));
    } catch (error) {
        console.log('  ❌ Error:', error.message);
    }

    console.log('\n📊 BROKEN MARKET:', brokenMarket);
    const brokenContract = new ethers.Contract(brokenMarket, marketABI, provider);
    try {
        const yesShares = await brokenContract.yesShares();
        const noShares = await brokenContract.noShares();
        const reserve = await brokenContract.reserve();
        const [priceYes, priceNo] = await brokenContract.getCurrentPrice();

        console.log('  - YES shares:', ethers.formatEther(yesShares));
        console.log('  - NO shares:', ethers.formatEther(noShares));
        console.log('  - Reserve:', ethers.formatEther(reserve));
        console.log('  - Price YES:', ethers.formatEther(priceYes));
        console.log('  - Price NO:', ethers.formatEther(priceNo));
    } catch (error) {
        console.log('  ❌ Error:', error.message);
    }

    console.log('\n✅ Contract state check completed');
}

checkContractState().catch(console.error);