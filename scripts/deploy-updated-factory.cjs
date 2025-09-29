const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Existing contract addresses
const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
const TREASURY_ADDRESS = '0x69649cc208138B3A2c529cB301D7Bb591C53a2e2';
const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
const BET_NFT_ADDRESS = '0x780078C473B383eFB5F46B831992dce6C1c3b076';

async function deployUpdatedFactory() {
    try {
        console.log('🔧 Deploying updated PredictionMarketFactory...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Deploying with address:', signer.address);

        const balance = await provider.getBalance(signer.address);
        console.log('💰 Account balance:', ethers.formatEther(balance), 'HBAR');

        // Load factory contract artifact
        const factoryArtifact = JSON.parse(
            fs.readFileSync('./artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json', 'utf8')
        );

        // Deploy new factory
        console.log('\n🏭 Deploying PredictionMarketFactory...');
        const FactoryContract = new ethers.ContractFactory(
            factoryArtifact.abi,
            factoryArtifact.bytecode,
            signer
        );

        const factory = await FactoryContract.deploy(
            ADMIN_MANAGER_ADDRESS,
            TREASURY_ADDRESS,
            CAST_TOKEN_ADDRESS, // Use CAST as collateral
            CAST_TOKEN_ADDRESS,
            BET_NFT_ADDRESS,
            {
                gasLimit: 3000000 // Increase gas limit for deployment
            }
        );

        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();
        console.log('✅ New Factory deployed to:', factoryAddress);

        // Check BetNFT ownership
        const betNFTABI = [
            "function owner() external view returns (address)",
            "function transferOwnership(address newOwner) external"
        ];

        const betNFT = new ethers.Contract(BET_NFT_ADDRESS, betNFTABI, signer);
        const currentOwner = await betNFT.owner();
        console.log('\n🏠 Current BetNFT owner:', currentOwner);
        console.log('👤 Your address:', signer.address);

        // Transfer BetNFT ownership to new factory if you own it
        if (currentOwner.toLowerCase() === signer.address.toLowerCase()) {
            console.log('🔄 Transferring BetNFT ownership to new factory...');
            const tx = await betNFT.transferOwnership(factoryAddress);
            console.log('📤 Transfer transaction:', tx.hash);
            await tx.wait();
            console.log('✅ BetNFT ownership transferred to new factory!');
        } else {
            console.log('❌ You are not the BetNFT owner. Current owner needs to transfer ownership to:', factoryAddress);
        }

        // Set up CAST token minting permissions
        const castTokenABI = [
            "function authorizeMinter(address minter) external",
            "function authorizedMinters(address) external view returns (bool)"
        ];

        try {
            const castToken = new ethers.Contract(CAST_TOKEN_ADDRESS, castTokenABI, signer);

            console.log('\n🪙 Setting up CAST token permissions...');
            const isAlreadyAuthorized = await castToken.authorizedMinters(factoryAddress);

            if (!isAlreadyAuthorized) {
                const tx = await castToken.authorizeMinter(factoryAddress);
                console.log('📤 Authorize minter transaction:', tx.hash);
                await tx.wait();
                console.log('✅ Factory authorized to mint CAST tokens!');
            } else {
                console.log('✅ Factory already authorized to mint CAST tokens');
            }
        } catch (error) {
            console.log('⚠️  Could not set CAST minting permissions:', error.message);
        }

        // Save new deployment info
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            deployer: signer.address,
            newFactory: factoryAddress,
            existingContracts: {
                AdminManager: ADMIN_MANAGER_ADDRESS,
                Treasury: TREASURY_ADDRESS,
                CastToken: CAST_TOKEN_ADDRESS,
                BetNFT: BET_NFT_ADDRESS
            },
            note: "Updated factory with automatic market authorization"
        };

        fs.writeFileSync(
            'new-factory-deployment.json',
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log('\n🎉 New factory deployment completed!');
        console.log('📋 Deployment info saved to: new-factory-deployment.json');
        console.log('\n📝 Next steps:');
        console.log(`1. Update FACTORY_CONTRACT in constants.ts to: ${factoryAddress}`);
        console.log('2. Ensure BetNFT ownership is transferred to new factory');
        console.log('3. Test market creation with new factory');

        return factoryAddress;

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        console.error('Error message:', error.message);
        throw error;
    }
}

// Run deployment
deployUpdatedFactory()
    .then((address) => {
        console.log('🏁 Deployment completed successfully!');
        console.log('🏭 New factory address:', address);
    })
    .catch(error => {
        console.error('💥 Deployment script failed:', error);
        process.exit(1);
    });