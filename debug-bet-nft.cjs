async function main() {
    const { ethers } = await import("ethers");
    const marketAddress = '0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd';

    console.log(`🔍 Checking BetNFT setup for market: ${marketAddress}`);

    // Connect to Hedera testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
    const wallet = new ethers.Wallet(privateKey, provider);

    try {
        // Load market contract
        const fs = await import("fs");
        const marketAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarket.sol/PredictionMarket.json', 'utf8')).abi;
        const market = new ethers.Contract(marketAddress, marketAbi, wallet);

        // Get BetNFT address
        const betNFTAddress = await market.betNFT();
        console.log('📍 BetNFT contract address:', betNFTAddress);

        // Check if BetNFT contract exists
        const betNFTCode = await provider.getCode(betNFTAddress);
        console.log('🏗️  BetNFT contract code length:', betNFTCode.length);
        console.log('✅ BetNFT contract exists:', betNFTCode.length > 2);

        if (betNFTCode.length > 2) {
            // Load BetNFT contract
            const betNFTAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BetNFT.sol/BetNFT.json', 'utf8')).abi;
            const betNFT = new ethers.Contract(betNFTAddress, betNFTAbi, wallet);

            // Check if market is authorized to mint NFTs
            const isAuthorized = await betNFT.authorizedMarkets(marketAddress);
            console.log('🔐 Market is authorized:', isAuthorized);

            if (!isAuthorized) {
                console.log('❌ ISSUE FOUND: Market is not authorized to mint NFTs!');
                console.log('🔧 The market needs to be authorized via authorizeMarket()');

                // Get BetNFT owner
                const owner = await betNFT.owner();
                console.log('👤 BetNFT owner:', owner);
                console.log('👤 Current wallet:', wallet.address);
                console.log('🔑 Can authorize:', owner.toLowerCase() === wallet.address.toLowerCase());
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch(console.error);