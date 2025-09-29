const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Contract addresses from constants.ts
const FACTORY_ADDRESS = '0x6A108622e5B0F2Db7f6118E71259F34937225809';
const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca';
const GOLD_MARKET_ADDRESS = '0x4fbfe3709e75EdCE926fA7b5Bbda59c5854B15c1';
const NEW_MARKET_ADDRESS = '0x28d5feca31A4c4dCa7B2f8C2ccF83F5db01E4978';

async function checkAndFixAuthorization() {
    try {
        console.log('🔧 Connecting to Hedera Testnet...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Signer address:', signer.address);

        // Contract ABIs
        const betNFTABI = [
            "function owner() external view returns (address)",
            "function authorizeMarket(address market) external",
            "function authorizedMarkets(address) external view returns (bool)",
            "function transferOwnership(address newOwner) external"
        ];

        const factoryABI = [
            "function betNFT() external view returns (address)",
            "function authorizeExistingMarket(address market) external",
            "function authorizeMultipleMarkets(address[] calldata markets) external"
        ];

        // Create contract instances
        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);
        const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);

        // 1. Check current BetNFT owner
        console.log('\n🔍 Checking BetNFT ownership...');
        const currentOwner = await betNFT.owner();
        console.log('🏠 Current BetNFT owner:', currentOwner);
        console.log('🏭 Factory address:', FACTORY_ADDRESS);
        console.log('👤 Your address:', signer.address);

        const isFactoryOwner = currentOwner.toLowerCase() === FACTORY_ADDRESS.toLowerCase();
        const isYouOwner = currentOwner.toLowerCase() === signer.address.toLowerCase();

        console.log('✅ Is factory the owner?', isFactoryOwner);
        console.log('✅ Are you the owner?', isYouOwner);

        // 2. Check current market authorization status
        console.log('\n🔍 Checking market authorization status...');
        const markets = [
            { name: 'Gold Market', address: GOLD_MARKET_ADDRESS },
            { name: 'New Market (nouveau marché test)', address: NEW_MARKET_ADDRESS }
        ];

        for (const market of markets) {
            const isAuthorized = await betNFT.authorizedMarkets(market.address);
            console.log(`📋 ${market.name} (${market.address}): ${isAuthorized ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'}`);
        }

        // 3. Fix authorization issues
        console.log('\n🔧 Fixing authorization issues...');

        if (!isFactoryOwner && isYouOwner) {
            console.log('🔄 Transferring BetNFT ownership to factory...');
            const tx = await betNFT.transferOwnership(FACTORY_ADDRESS);
            console.log('📤 Transfer transaction:', tx.hash);
            await tx.wait();
            console.log('✅ Ownership transferred to factory!');
        }

        // 4. Authorize markets that aren't authorized
        const unauthorizedMarkets = [];
        for (const market of markets) {
            const isAuthorized = await betNFT.authorizedMarkets(market.address);
            if (!isAuthorized) {
                unauthorizedMarkets.push(market.address);
            }
        }

        if (unauthorizedMarkets.length > 0) {
            console.log('\n🔐 Authorizing unauthorized markets...');
            console.log('Markets to authorize:', unauthorizedMarkets);

            // Check if we can authorize (either we're the owner or factory is the owner and we can call factory methods)
            const newOwner = await betNFT.owner();
            const canAuthorizeDirectly = newOwner.toLowerCase() === signer.address.toLowerCase();

            if (canAuthorizeDirectly) {
                console.log('🔑 Authorizing markets directly via BetNFT...');
                for (const marketAddress of unauthorizedMarkets) {
                    const tx = await betNFT.authorizeMarket(marketAddress);
                    console.log(`📤 Authorizing ${marketAddress}:`, tx.hash);
                    await tx.wait();
                    console.log(`✅ Market ${marketAddress} authorized!`);
                }
            } else {
                console.log('🏭 Trying to authorize via factory (if factory has admin rights)...');
                try {
                    if (unauthorizedMarkets.length === 1) {
                        const tx = await factory.authorizeExistingMarket(unauthorizedMarkets[0]);
                        console.log('📤 Factory authorization transaction:', tx.hash);
                        await tx.wait();
                        console.log('✅ Market authorized via factory!');
                    } else {
                        const tx = await factory.authorizeMultipleMarkets(unauthorizedMarkets);
                        console.log('📤 Factory batch authorization transaction:', tx.hash);
                        await tx.wait();
                        console.log('✅ Markets authorized via factory!');
                    }
                } catch (error) {
                    console.error('❌ Factory authorization failed:', error.message);
                    console.log('💡 You may need admin privileges to use factory authorization methods');
                }
            }
        }

        // 5. Final verification
        console.log('\n🔍 Final verification...');
        for (const market of markets) {
            const isAuthorized = await betNFT.authorizedMarkets(market.address);
            console.log(`📋 ${market.name}: ${isAuthorized ? '✅ AUTHORIZED' : '❌ STILL NOT AUTHORIZED'}`);
        }

        const finalOwner = await betNFT.owner();
        console.log('\n🏠 Final BetNFT owner:', finalOwner);
        console.log('🎉 Authorization check and fix completed!');

    } catch (error) {
        console.error('❌ Error during authorization fix:', error);
        console.error('Error message:', error.message);

        if (error.message.includes('Ownable')) {
            console.error('💡 Hint: Make sure you have the right permissions (owner or admin)');
        }
    }
}

// Run the authorization fix
checkAndFixAuthorization()
    .then(() => console.log('🏁 Script completed'))
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });