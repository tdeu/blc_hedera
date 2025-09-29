const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Current Factory address
const FACTORY_ADDRESS = '0xF84bBf0Fc07917a096b6FDc32AF4a4Deb6293435';

async function deployAndSetupBetNFT() {
    try {
        console.log('🚀 Deploying new BetNFT and setting up ownership...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Deployer address:', signer.address);
        console.log('🏭 Factory address:', FACTORY_ADDRESS);

        // Check balance
        const balance = await provider.getBalance(signer.address);
        console.log('💰 Account balance:', ethers.formatEther(balance), 'HBAR');

        // Load BetNFT artifact
        console.log('\n📋 Loading BetNFT contract artifact...');
        const BetNFTArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/BetNFT.sol/BetNFT.json', 'utf8'));

        // Deploy new BetNFT
        console.log('\n🚀 Deploying new BetNFT contract...');
        const BetNFTFactory = new ethers.ContractFactory(BetNFTArtifact.abi, BetNFTArtifact.bytecode, signer);
        const betNFT = await BetNFTFactory.deploy();
        await betNFT.waitForDeployment();
        const betNFTAddress = await betNFT.getAddress();
        console.log('✅ New BetNFT deployed to:', betNFTAddress);

        // Verify initial owner
        const initialOwner = await betNFT.owner();
        console.log('👤 Initial BetNFT owner:', initialOwner);
        console.log('👤 Your address:', signer.address);
        console.log('✅ You are the owner?', initialOwner.toLowerCase() === signer.address.toLowerCase());

        // Transfer ownership to factory
        console.log('\n🔄 Transferring BetNFT ownership to factory...');
        const tx = await betNFT.transferOwnership(FACTORY_ADDRESS);
        console.log('📤 Transfer transaction:', tx.hash);
        await tx.wait();
        console.log('✅ Ownership transfer transaction confirmed');

        // Verify transfer
        const newOwner = await betNFT.owner();
        console.log('🏠 New BetNFT owner:', newOwner);
        console.log('✅ Factory is now owner?', newOwner.toLowerCase() === FACTORY_ADDRESS.toLowerCase());

        // Save the new address info
        const updateInfo = {
            timestamp: new Date().toISOString(),
            oldBetNFT: '0x780078C473B383eFB5F46B831992dce6C1c3b076',
            newBetNFT: betNFTAddress,
            factory: FACTORY_ADDRESS,
            deployer: signer.address,
            transferTxHash: tx.hash
        };

        fs.writeFileSync('new-bet-nft-deployment.json', JSON.stringify(updateInfo, null, 2));
        console.log('📋 Deployment info saved to new-bet-nft-deployment.json');

        console.log('\n🎉 New BetNFT deployed and configured successfully!');
        console.log('📝 Next steps:');
        console.log('1. Update constants.ts with new BetNFT address:', betNFTAddress);
        console.log('2. Redeploy the factory or update its BetNFT reference');
        console.log('3. Test market creation');

        return {
            success: true,
            address: betNFTAddress,
            owner: newOwner
        };

    } catch (error) {
        console.error('❌ Error during deployment:', error);
        return { success: false, error: error.message };
    }
}

// Run the deployment
deployAndSetupBetNFT()
    .then((result) => {
        if (result.success) {
            console.log('\n✅ BetNFT deployment completed successfully!');
            console.log('🆕 New BetNFT address:', result.address);
            console.log('🏭 Owner:', result.owner);
        } else {
            console.log('\n❌ BetNFT deployment failed:', result.error);
        }
        console.log('🏁 Script completed');
    })
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });