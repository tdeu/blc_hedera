async function main() {
    const { ethers } = await import("ethers");
    const marketAddress = '0xeb320186b2B554B0bF8C01B75475584A8f11b362';

    console.log(`🔧 Authorizing market: ${marketAddress}`);

    // Connect to Hedera testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
    const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
    const wallet = new ethers.Wallet(privateKey, provider);

    try {
        // Load market contract to get BetNFT address
        const fs = await import("fs");
        const marketAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarket.sol/PredictionMarket.json', 'utf8')).abi;
        const market = new ethers.Contract(marketAddress, marketAbi, wallet);

        const betNFTAddress = await market.betNFT();
        console.log('📍 BetNFT contract:', betNFTAddress);

        // Load BetNFT contract
        const betNFTAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BetNFT.sol/BetNFT.json', 'utf8')).abi;
        const betNFT = new ethers.Contract(betNFTAddress, betNFTAbi, wallet);

        // Authorize the market
        console.log('🔐 Authorizing market to mint NFTs...');
        const tx = await betNFT.authorizeMarket(marketAddress, { gasLimit: 100000 });
        await tx.wait();

        console.log('✅ Market authorized successfully!');
        console.log('📤 Transaction:', tx.hash);

        // Verify authorization
        const isAuthorized = await betNFT.authorizedMarkets(marketAddress);
        console.log('🔍 Verification - Market is now authorized:', isAuthorized);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch(console.error);