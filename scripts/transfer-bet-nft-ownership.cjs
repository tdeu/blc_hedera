const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Contract addresses (latest deployment)
const BET_NFT_ADDRESS = '0x780078C473B383eFB5F46B831992dce6C1c3b076';
const FACTORY_ADDRESS = '0xF84bBf0Fc07917a096b6FDc32AF4a4Deb6293435';

async function transferBetNFTOwnership() {
    try {
        console.log('🔧 Transferring BetNFT ownership to new factory...');

        // Setup provider and signers
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Signer address:', signer.address);

        // BetNFT contract ABI
        const betNFTABI = [
            "function owner() external view returns (address)",
            "function transferOwnership(address newOwner) external"
        ];

        // Create contract instances
        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);

        // Check current ownership
        console.log('\n🔍 Checking current BetNFT ownership...');
        const currentOwner = await betNFT.owner();
        console.log('🏠 Current BetNFT owner:', currentOwner);
        console.log('🏭 Target factory address:', FACTORY_ADDRESS);
        console.log('👤 Your address:', signer.address);

        const isFactoryOwner = currentOwner.toLowerCase() === FACTORY_ADDRESS.toLowerCase();
        const isYouOwner = currentOwner.toLowerCase() === signer.address.toLowerCase();

        console.log('✅ Is factory already the owner?', isFactoryOwner);
        console.log('✅ Are you the owner?', isYouOwner);

        if (isFactoryOwner) {
            console.log('\n✅ Factory is already the owner of BetNFT! No transfer needed.');
            return true;
        } else if (isYouOwner) {
            console.log('\n🔄 You own BetNFT - transferring to factory...');
            const tx = await betNFT.transferOwnership(FACTORY_ADDRESS);
            console.log('📤 Transfer transaction:', tx.hash);
            await tx.wait();
            console.log('✅ Ownership transferred to factory!');
        } else {
            console.log('\n❌ BetNFT is owned by someone else. Attempting transfer anyway...');
            try {
                const tx = await betNFT.transferOwnership(FACTORY_ADDRESS);
                console.log('📤 Transfer transaction:', tx.hash);
                await tx.wait();
                console.log('✅ Ownership transferred to factory!');
            } catch (error) {
                console.log('❌ Transfer failed:', error.message);
                console.log('\n🔧 Alternative approach needed...');
                return false;
            }
        }

        // Verify the transfer
        console.log('\n🔍 Verifying ownership transfer...');
        const newOwner = await betNFT.owner();
        console.log('🏠 New BetNFT owner:', newOwner);

        if (newOwner.toLowerCase() === FACTORY_ADDRESS.toLowerCase()) {
            console.log('✅ Ownership successfully transferred to factory!');
            return true;
        } else {
            console.log('❌ Ownership transfer failed or incomplete');
            return false;
        }

    } catch (error) {
        console.error('❌ Error during ownership transfer:', error);
        console.error('Error message:', error.message);
        return false;
    }
}

// Run the transfer
transferBetNFTOwnership()
    .then((success) => {
        if (success) {
            console.log('🎉 BetNFT ownership transfer completed successfully!');
        } else {
            console.log('⚠️  BetNFT ownership transfer needs manual intervention');
            console.log('📝 Next steps:');
            console.log(`1. The current BetNFT owner needs to call transferOwnership(${FACTORY_ADDRESS})`);
            console.log('2. Or deploy a new BetNFT contract and update addresses');
        }
        console.log('🏁 Script completed');
    })
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });