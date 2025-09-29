const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// New factory address
const NEW_FACTORY_ADDRESS = '0x239f57D74236cafaE5d122aACDF0975ac765F913';

async function deployNewBetNFT() {
    try {
        console.log('🔧 Deploying new BetNFT contract...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Deploying with address:', signer.address);

        const balance = await provider.getBalance(signer.address);
        console.log('💰 Account balance:', ethers.formatEther(balance), 'HBAR');

        // Load BetNFT contract artifact
        const betNFTArtifact = JSON.parse(
            fs.readFileSync('./artifacts/contracts/BetNFT.sol/BetNFT.json', 'utf8')
        );

        // Deploy new BetNFT
        console.log('\n🎯 Deploying BetNFT...');
        const BetNFTContract = new ethers.ContractFactory(
            betNFTArtifact.abi,
            betNFTArtifact.bytecode,
            signer
        );

        const betNFT = await BetNFTContract.deploy();
        await betNFT.waitForDeployment();
        const betNFTAddress = await betNFT.getAddress();
        console.log('✅ New BetNFT deployed to:', betNFTAddress);

        // Transfer ownership to the new factory
        console.log('\n🔄 Transferring BetNFT ownership to new factory...');
        const tx = await betNFT.transferOwnership(NEW_FACTORY_ADDRESS);
        console.log('📤 Transfer transaction:', tx.hash);
        await tx.wait();
        console.log('✅ BetNFT ownership transferred to factory!');

        // Verify ownership
        const owner = await betNFT.owner();
        console.log('🏠 BetNFT owner is now:', owner);

        // Save deployment info
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            deployer: signer.address,
            newBetNFT: betNFTAddress,
            factory: NEW_FACTORY_ADDRESS,
            note: "New BetNFT deployed and ownership transferred to new factory"
        };

        fs.writeFileSync(
            'new-bet-nft-deployment.json',
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log('\n🎉 New BetNFT deployment completed!');
        console.log('📋 Deployment info saved to: new-bet-nft-deployment.json');
        console.log('\n📝 Next steps:');
        console.log(`1. Update BET_NFT_CONTRACT in constants.ts to: ${betNFTAddress}`);
        console.log('2. Redeploy factory with new BetNFT address');
        console.log('3. Test market creation with new setup');

        return betNFTAddress;

    } catch (error) {
        console.error('❌ BetNFT deployment failed:', error);
        console.error('Error message:', error.message);
        throw error;
    }
}

// Run deployment
deployNewBetNFT()
    .then((address) => {
        console.log('🏁 BetNFT deployment completed successfully!');
        console.log('🎯 New BetNFT address:', address);
    })
    .catch(error => {
        console.error('💥 BetNFT deployment script failed:', error);
        process.exit(1);
    });