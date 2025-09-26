async function main() {
    const { ethers } = await import("ethers");
    const marketAddress = '0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd';

    console.log(`🔍 Checking contract state at: ${marketAddress}`);

    // Connect to Hedera testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
    const wallet = new ethers.Wallet(privateKey, provider);

    // Load contract ABI
    const fs = await import("fs");
    const contractAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarket.sol/PredictionMarket.json', 'utf8')).abi;
    const market = new ethers.Contract(marketAddress, contractAbi, wallet);

    try {
        // Get current prices
        const [yPrice, nPrice] = await market.getCurrentPrice();
        console.log('📊 Current prices:');
        console.log('  YES price:', ethers.formatEther(yPrice));
        console.log('  NO price:', ethers.formatEther(nPrice));

        // Get share counts
        const yShares = await market.yesShares();
        const nShares = await market.noShares();
        console.log('\n📈 Share counts:');
        console.log('  YES shares:', ethers.formatEther(yShares));
        console.log('  NO shares:', ethers.formatEther(nShares));

        // Get reserve
        const reserve = await market.reserve();
        console.log('\n💰 Reserve:', ethers.formatEther(reserve));

        // Check if market is open
        const marketInfo = await market.marketInfo();
        console.log('\n📋 Market info:');
        console.log('  Status:', marketInfo.status);
        console.log('  End time:', new Date(Number(marketInfo.endTime) * 1000));

    } catch (error) {
        console.error('❌ Error checking contract:', error.message);
    }
}

main().catch(console.error);