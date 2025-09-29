const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca';
const FACTORY_ADDRESS = '0x6A108622e5B0F2Db7f6118E71259F34937225809';

async function checkOwnership() {
    try {
        console.log('🔍 Checking contract ownership and admin functions...');

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Current signer:', signer.address);

        // BetNFT contract
        const betNFTABI = [
            "function owner() external view returns (address)",
            "function transferOwnership(address newOwner) external"
        ];

        // Factory contract
        const factoryABI = [
            "function owner() external view returns (address)",
            "function transferOwnership(address newOwner) external"
        ];

        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);
        const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);

        // Check BetNFT ownership
        console.log('\n📋 BetNFT Contract:');
        try {
            const betNFTOwner = await betNFT.owner();
            console.log('🏠 BetNFT owner:', betNFTOwner);
            console.log('🏭 Factory address:', FACTORY_ADDRESS);
            console.log('✅ Factory owns BetNFT?', betNFTOwner.toLowerCase() === FACTORY_ADDRESS.toLowerCase());
        } catch (error) {
            console.log('❌ BetNFT owner() failed:', error.message);
        }

        // Check Factory ownership
        console.log('\n📋 Factory Contract:');
        try {
            const factoryOwner = await factory.owner();
            console.log('🏠 Factory owner:', factoryOwner);
            console.log('👤 Current signer:', signer.address);
            console.log('✅ Signer owns Factory?', factoryOwner.toLowerCase() === signer.address.toLowerCase());
        } catch (error) {
            console.log('❌ Factory owner() failed:', error.message);
        }

        // Check if we can transfer ownership temporarily
        console.log('\n💡 Potential solutions:');
        console.log('1. If signer owns factory: Transfer BetNFT ownership temporarily');
        console.log('2. Add manual authorization function to factory');
        console.log('3. Redeploy contracts with proper setup');

    } catch (error) {
        console.error('❌ Error checking ownership:', error);
    }
}

checkOwnership()
    .then(() => console.log('🏁 Ownership check completed'))
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });