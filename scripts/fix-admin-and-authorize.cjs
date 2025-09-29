const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Contract addresses from constants.ts
const FACTORY_ADDRESS = '0x6A108622e5B0F2Db7f6118E71259F34937225809';
const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca';
const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
const GOLD_MARKET_ADDRESS = '0x4fbfe3709e75EdCE926fA7b5Bbda59c5854B15c1';
const NEW_MARKET_ADDRESS = '0x28d5feca31A4c4dCa7B2f8C2ccF83F5db01E4978';

async function fixAdminAndAuthorize() {
    try {
        console.log('🔧 Connecting to Hedera Testnet...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Signer address:', signer.address);

        // Contract ABIs
        const adminManagerABI = [
            "function addAdmin(address admin) external",
            "function isAdmin(address account) external view returns (bool)",
            "function owner() external view returns (address)"
        ];

        const betNFTABI = [
            "function owner() external view returns (address)",
            "function authorizeMarket(address market) external",
            "function authorizedMarkets(address) external view returns (bool)"
        ];

        const factoryABI = [
            "function authorizeExistingMarket(address market) external",
            "function authorizeMultipleMarkets(address[] calldata markets) external"
        ];

        // Create contract instances
        const adminManager = new ethers.Contract(ADMIN_MANAGER_ADDRESS, adminManagerABI, signer);
        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);
        const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);

        // 1. Check current admin status
        console.log('\n🔍 Checking admin status...');
        const isCurrentlyAdmin = await adminManager.isAdmin(signer.address);
        const adminOwner = await adminManager.owner();

        console.log('🏠 AdminManager owner:', adminOwner);
        console.log('👤 Your address:', signer.address);
        console.log('✅ Are you an admin?', isCurrentlyAdmin);
        console.log('✅ Are you the AdminManager owner?', adminOwner.toLowerCase() === signer.address.toLowerCase());

        // 2. Add yourself as admin if needed
        if (!isCurrentlyAdmin) {
            if (adminOwner.toLowerCase() === signer.address.toLowerCase()) {
                console.log('🔑 Adding yourself as admin...');
                const tx = await adminManager.addAdmin(signer.address);
                console.log('📤 Add admin transaction:', tx.hash);
                await tx.wait();
                console.log('✅ Successfully added as admin!');
            } else {
                console.log('❌ Cannot add yourself as admin - you are not the AdminManager owner');
                console.log('💡 The AdminManager owner needs to add you as admin first');

                // Try a different approach - direct authorization via BetNFT if possible
                console.log('\n🔄 Trying direct BetNFT authorization...');
                const betNFTOwner = await betNFT.owner();
                console.log('🏠 BetNFT owner:', betNFTOwner);

                if (betNFTOwner.toLowerCase() === signer.address.toLowerCase()) {
                    console.log('🔑 You own BetNFT directly - authorizing markets...');
                    await authorizeDirect(betNFT, [GOLD_MARKET_ADDRESS, NEW_MARKET_ADDRESS]);
                    return;
                } else {
                    console.log('❌ Cannot authorize - need admin privileges or BetNFT ownership');
                    return;
                }
            }
        }

        // 3. Re-check admin status
        const isNowAdmin = await adminManager.isAdmin(signer.address);
        console.log('✅ Admin status after update:', isNowAdmin);

        if (!isNowAdmin) {
            console.log('❌ Still not an admin - cannot proceed with factory authorization');
            return;
        }

        // 4. Authorize markets via factory
        console.log('\n🔐 Authorizing markets via factory...');
        const marketsToAuthorize = [GOLD_MARKET_ADDRESS, NEW_MARKET_ADDRESS];

        try {
            const tx = await factory.authorizeMultipleMarkets(marketsToAuthorize);
            console.log('📤 Factory authorization transaction:', tx.hash);
            await tx.wait();
            console.log('✅ Markets authorized via factory!');
        } catch (error) {
            console.log('❌ Factory authorization failed, trying individual authorization...');
            for (const marketAddress of marketsToAuthorize) {
                try {
                    const tx = await factory.authorizeExistingMarket(marketAddress);
                    console.log(`📤 Authorizing ${marketAddress}:`, tx.hash);
                    await tx.wait();
                    console.log(`✅ Market ${marketAddress} authorized!`);
                } catch (err) {
                    console.error(`❌ Failed to authorize ${marketAddress}:`, err.message);
                }
            }
        }

        // 5. Final verification
        console.log('\n🔍 Final verification...');
        const markets = [
            { name: 'Gold Market', address: GOLD_MARKET_ADDRESS },
            { name: 'New Market (nouveau marché test)', address: NEW_MARKET_ADDRESS }
        ];

        for (const market of markets) {
            const isAuthorized = await betNFT.authorizedMarkets(market.address);
            console.log(`📋 ${market.name}: ${isAuthorized ? '✅ AUTHORIZED' : '❌ STILL NOT AUTHORIZED'}`);
        }

    } catch (error) {
        console.error('❌ Error during admin and authorization fix:', error);
        console.error('Error message:', error.message);
    }
}

async function authorizeDirect(betNFT, marketAddresses) {
    console.log('🔑 Authorizing markets directly via BetNFT...');
    for (const marketAddress of marketAddresses) {
        try {
            const tx = await betNFT.authorizeMarket(marketAddress);
            console.log(`📤 Authorizing ${marketAddress}:`, tx.hash);
            await tx.wait();
            console.log(`✅ Market ${marketAddress} authorized!`);
        } catch (error) {
            console.error(`❌ Failed to authorize ${marketAddress}:`, error.message);
        }
    }
}

// Run the fix
fixAdminAndAuthorize()
    .then(() => console.log('🏁 Script completed'))
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });