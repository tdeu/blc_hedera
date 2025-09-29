const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca'; // From constants.ts
const MARKET_ADDRESS = '0x4fbfe3709e75EdCE926fA7b5Bbda59c5854B15c1'; // Gold market

async function authorizeMarket() {
    try {
        console.log('🔧 Connecting to Hedera Testnet...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Signer address:', signer.address);

        // BetNFT contract ABI
        const betNFTABI = [
            "function authorizeMarket(address market) external",
            "function owner() external view returns (address)",
            "function authorizedMarkets(address) external view returns (bool)"
        ];

        // Create contract instance
        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);

        // Check ownership
        console.log('🔍 Checking contract owner...');
        const owner = await betNFT.owner();
        console.log('🏠 Contract owner:', owner);
        console.log('👤 Current signer:', signer.address);
        console.log('✅ Is owner?', owner.toLowerCase() === signer.address.toLowerCase());

        // Check current authorization status
        console.log('🔍 Checking current authorization status...');
        const isCurrentlyAuthorized = await betNFT.authorizedMarkets(MARKET_ADDRESS);
        console.log('📋 Current authorization status:', isCurrentlyAuthorized);

        if (isCurrentlyAuthorized) {
            console.log('✅ Market is already authorized!');
            return;
        }

        // Authorize the market
        console.log('🔐 Authorizing market:', MARKET_ADDRESS);
        const tx = await betNFT.authorizeMarket(MARKET_ADDRESS, {
            gasLimit: 100000
        });

        console.log('📤 Authorization transaction sent:', tx.hash);
        console.log('⏳ Waiting for confirmation...');

        const receipt = await tx.wait();

        console.log('✅ Transaction confirmed!');
        console.log('📊 Gas used:', receipt.gasUsed?.toString());

        // Verify authorization
        const isNowAuthorized = await betNFT.authorizedMarkets(MARKET_ADDRESS);
        console.log('🎉 Final authorization status:', isNowAuthorized);

    } catch (error) {
        console.error('❌ Error authorizing market:', error);
        console.error('Error message:', error.message);

        if (error.message.includes('Ownable')) {
            console.error('💡 Hint: Make sure the signer is the BetNFT contract owner');
        }
    }
}

// Run the authorization
authorizeMarket()
    .then(() => console.log('🏁 Script completed'))
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });