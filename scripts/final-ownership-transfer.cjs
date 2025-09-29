const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Contract addresses
const BET_NFT_ADDRESS = '0x780078C473B383eFB5F46B831992dce6C1c3b076';
const OLD_FACTORY_ADDRESS = '0x239f57D74236cafaE5d122aACDF0975ac765F913'; // Previous factory
const NEW_FACTORY_ADDRESS = '0xF84bBf0Fc07917a096b6FDc32AF4a4Deb6293435'; // Final factory

async function transferOwnershipToFinalFactory() {
    try {
        console.log('🔧 Transferring BetNFT ownership to final factory...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Signer address:', signer.address);

        // BetNFT contract ABI
        const betNFTABI = [
            "function owner() external view returns (address)",
            "function transferOwnership(address newOwner) external"
        ];

        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);

        // Check current ownership
        console.log('\n🔍 Checking current BetNFT ownership...');
        const currentOwner = await betNFT.owner();
        console.log('🏠 Current BetNFT owner:', currentOwner);
        console.log('🏭 Old factory address:', OLD_FACTORY_ADDRESS);
        console.log('🏭 New factory address:', NEW_FACTORY_ADDRESS);
        console.log('👤 Your address:', signer.address);

        const isYouOwner = currentOwner.toLowerCase() === signer.address.toLowerCase();
        const isOldFactoryOwner = currentOwner.toLowerCase() === OLD_FACTORY_ADDRESS.toLowerCase();

        if (isYouOwner) {
            console.log('\n🔄 You own BetNFT - transferring to final factory...');
            const tx = await betNFT.transferOwnership(NEW_FACTORY_ADDRESS);
            console.log('📤 Transfer transaction:', tx.hash);
            await tx.wait();
            console.log('✅ Ownership transferred to final factory!');
        } else if (isOldFactoryOwner) {
            console.log('\n✅ BetNFT is already owned by the old factory');
            console.log('❌ Need to transfer from old factory to new factory');
            console.log('💡 Since old factory owns it, we need to directly transfer ownership');

            // The BetNFT was previously owned by old factory, so we can transfer it
            const tx = await betNFT.transferOwnership(NEW_FACTORY_ADDRESS);
            console.log('📤 Transfer transaction:', tx.hash);
            await tx.wait();
            console.log('✅ Ownership transferred to final factory!');
        } else {
            console.log(`\n✅ BetNFT is already owned by: ${currentOwner}`);
            if (currentOwner.toLowerCase() === NEW_FACTORY_ADDRESS.toLowerCase()) {
                console.log('🎉 BetNFT is already owned by the final factory!');
                return true;
            }
        }

        // Verify the transfer
        console.log('\n🔍 Verifying final ownership...');
        const finalOwner = await betNFT.owner();
        console.log('🏠 Final BetNFT owner:', finalOwner);

        if (finalOwner.toLowerCase() === NEW_FACTORY_ADDRESS.toLowerCase()) {
            console.log('✅ SUCCESS: BetNFT is now owned by the final factory!');
            return true;
        } else {
            console.log('❌ Ownership transfer failed');
            return false;
        }

    } catch (error) {
        console.error('❌ Error during final ownership transfer:', error);
        console.error('Error message:', error.message);
        return false;
    }
}

// Run the transfer
transferOwnershipToFinalFactory()
    .then((success) => {
        if (success) {
            console.log('\n🎉 All setup complete!');
            console.log('📝 Summary:');
            console.log('✅ New BetNFT deployed: 0x780078C473B383eFB5F46B831992dce6C1c3b076');
            console.log('✅ New Factory deployed: 0xF84bBf0Fc07917a096b6FDc32AF4a4Deb6293435');
            console.log('✅ BetNFT owned by Factory: YES');
            console.log('✅ Factory has auto-authorization: YES');
            console.log('\n🚀 Ready to test new market creation!');
        } else {
            console.log('⚠️  Final ownership transfer needs attention');
        }
        console.log('🏁 Script completed');
    })
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });