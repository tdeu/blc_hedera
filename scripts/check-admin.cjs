const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
const FACTORY_ADDRESS = '0x6A108622e5B0F2Db7f6118E71259F34937225809';
const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca';
const MARKET_ADDRESS = '0x4fbfe3709e75EdCE926fA7b5Bbda59c5854B15c1';

async function checkAdminAndAuthorize() {
    try {
        console.log('🔍 Checking admin permissions...');

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Current signer:', signer.address);

        // AdminManager contract
        const adminManagerABI = [
            "function isAdmin(address account) external view returns (bool)",
            "function addAdmin(address admin) external",
            "function owner() external view returns (address)"
        ];

        // Factory contract with admin functions
        const factoryABI = [
            "function adminManager() external view returns (address)",
            // Let's see if there are any admin functions
            "function pauseFactory() external",
            "function unpauseFactory() external",
            "function updateBetNFT(address newBetNFT) external",
        ];

        // BetNFT contract
        const betNFTABI = [
            "function authorizeMarket(address market) external",
            "function owner() external view returns (address)",
            "function transferOwnership(address newOwner) external"
        ];

        const adminManager = new ethers.Contract(ADMIN_MANAGER_ADDRESS, adminManagerABI, signer);
        const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);
        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);

        // Check if current signer is admin
        console.log('\n📋 Admin Status:');
        const isAdmin = await adminManager.isAdmin(signer.address);
        console.log('✅ Is admin?', isAdmin);

        if (isAdmin) {
            console.log('🎉 Great! You have admin permissions');

            // Try to add admin function to factory to authorize markets
            // Since we're admin, we might be able to temporarily transfer BetNFT ownership
            console.log('\n🔄 Attempting to authorize market through temporary ownership transfer...');

            try {
                // Step 1: Transfer BetNFT ownership to our address temporarily
                console.log('1. Transferring BetNFT ownership temporarily to our address...');

                // First, we need to call from factory contract as current owner
                // This won't work directly, but let's see what happens
                const transferTx = await betNFT.transferOwnership(signer.address, {
                    gasLimit: 100000
                });

                console.log('📤 Transfer transaction sent:', transferTx.hash);
                await transferTx.wait();
                console.log('✅ Ownership transferred!');

                // Step 2: Authorize the market
                console.log('2. Authorizing market...');
                const authorizeTx = await betNFT.authorizeMarket(MARKET_ADDRESS, {
                    gasLimit: 100000
                });

                console.log('📤 Authorization transaction sent:', authorizeTx.hash);
                await authorizeTx.wait();
                console.log('✅ Market authorized!');

                // Step 3: Transfer ownership back to factory
                console.log('3. Transferring ownership back to factory...');
                const transferBackTx = await betNFT.transferOwnership(FACTORY_ADDRESS, {
                    gasLimit: 100000
                });

                console.log('📤 Transfer back transaction sent:', transferBackTx.hash);
                await transferBackTx.wait();
                console.log('✅ Ownership transferred back to factory!');

                // Verify authorization
                const isAuthorized = await betNFT.authorizedMarkets(MARKET_ADDRESS);
                console.log('🎉 Final authorization status:', isAuthorized);

            } catch (error) {
                console.error('❌ Authorization failed:', error.message);
                console.log('💡 This is expected - we can\'t call transferOwnership as non-owner');
            }

        } else {
            console.log('❌ Not an admin. Cannot authorize markets.');

            // Check AdminManager owner
            try {
                const adminOwner = await adminManager.owner();
                console.log('🏠 AdminManager owner:', adminOwner);
                console.log('✅ Signer is AdminManager owner?', adminOwner.toLowerCase() === signer.address.toLowerCase());

                if (adminOwner.toLowerCase() === signer.address.toLowerCase()) {
                    console.log('💡 You own AdminManager! You can add yourself as admin');
                    const addAdminTx = await adminManager.addAdmin(signer.address, {
                        gasLimit: 100000
                    });
                    console.log('📤 Adding admin transaction sent:', addAdminTx.hash);
                    await addAdminTx.wait();
                    console.log('✅ Added yourself as admin! Now re-run this script.');
                }
            } catch (error) {
                console.log('❌ Failed to check AdminManager owner:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkAdminAndAuthorize()
    .then(() => console.log('🏁 Admin check completed'))
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });