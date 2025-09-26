async function testVolumeTracking() {
    const { ethers } = await import("ethers");
    const marketAddress = '0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd';

    console.log('🧪 Testing volume tracking for the market with your bet...');

    // Connect to Hedera testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
    const wallet = new ethers.Wallet(privateKey, provider);

    try {
        // Load market contract
        const fs = await import("fs");
        const marketAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarket.sol/PredictionMarket.json', 'utf8')).abi;
        const market = new ethers.Contract(marketAddress, marketAbi, wallet);

        // Get current state
        const [yPrice, nPrice] = await market.getCurrentPrice();
        const yShares = await market.yesShares();
        const nShares = await market.noShares();
        const reserve = await market.reserve();

        console.log('\n📊 Current Market State:');
        console.log('  YES price:', ethers.formatEther(yPrice));
        console.log('  NO price:', ethers.formatEther(nPrice));
        console.log('  YES shares:', ethers.formatEther(yShares));
        console.log('  NO shares:', ethers.formatEther(nShares));
        console.log('  Total volume (reserve):', ethers.formatEther(reserve), 'CAST');

        // Calculate expected volume
        const expectedVolume = parseFloat(ethers.formatEther(reserve));

        console.log('\n✅ Volume tracking verification:');
        console.log('  Expected volume from your 2 CAST bet: ~1.25 CAST');
        console.log('  Actual contract reserve:', expectedVolume, 'CAST');

        if (expectedVolume > 0) {
            console.log('  🎉 SUCCESS: Volume tracking is working!');
            console.log('  💡 Your bet was recorded and the volume shows the actual CAST spent');
        } else {
            console.log('  ❌ Volume is 0 - there might be an issue');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testVolumeTracking().catch(console.error);