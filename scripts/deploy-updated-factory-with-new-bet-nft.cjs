const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Existing contract addresses (from constants.ts)
const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
const TREASURY_ADDRESS = '0x69649cc208138B3A2c529cB301D7Bb591C53a2e2';
const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
const NEW_BET_NFT_ADDRESS = '0xFf1c74Dfb863913A3DB2871f783966bEc29D3e6a'; // From new deployment

async function deployUpdatedFactory() {
    try {
        console.log('🚀 Deploying new Factory with correct BetNFT address...');

        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('👤 Deployer address:', signer.address);
        console.log('📋 Using existing contracts:');
        console.log('  AdminManager:', ADMIN_MANAGER_ADDRESS);
        console.log('  Treasury:', TREASURY_ADDRESS);
        console.log('  CastToken:', CAST_TOKEN_ADDRESS);
        console.log('  BetNFT (NEW):', NEW_BET_NFT_ADDRESS);

        // Check balance
        const balance = await provider.getBalance(signer.address);
        console.log('💰 Account balance:', ethers.formatEther(balance), 'HBAR');

        // Load Factory artifact
        console.log('\n📋 Loading Factory contract artifact...');
        const FactoryArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json', 'utf8'));

        // Deploy new Factory
        console.log('\n🚀 Deploying new PredictionMarketFactory...');
        const FactoryContractFactory = new ethers.ContractFactory(FactoryArtifact.abi, FactoryArtifact.bytecode, signer);

        const factory = await FactoryContractFactory.deploy(
            ADMIN_MANAGER_ADDRESS,
            TREASURY_ADDRESS,
            CAST_TOKEN_ADDRESS, // collateral token
            CAST_TOKEN_ADDRESS, // cast token
            NEW_BET_NFT_ADDRESS // NEW BetNFT with proper ownership
        );

        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();
        console.log('✅ New Factory deployed to:', factoryAddress);

        // Verify the BetNFT address in the new factory
        const factoryBetNFT = await factory.betNFT();
        console.log('🔍 Factory points to BetNFT:', factoryBetNFT);
        console.log('✅ Correct BetNFT address?', factoryBetNFT.toLowerCase() === NEW_BET_NFT_ADDRESS.toLowerCase());

        // Check if BetNFT is owned by the new factory (it should be owned by the OLD factory still)
        const betNFTABI = ['function owner() view returns (address)', 'function transferOwnership(address) external'];
        const betNFT = new ethers.Contract(NEW_BET_NFT_ADDRESS, betNFTABI, signer);
        const betNFTOwner = await betNFT.owner();
        console.log('🏠 BetNFT current owner:', betNFTOwner);
        console.log('🏭 New factory address:', factoryAddress);

        if (betNFTOwner.toLowerCase() !== factoryAddress.toLowerCase()) {
            console.log('⚠️  BetNFT ownership needs to be transferred to new factory');

            // Check if we can transfer it
            if (betNFTOwner.toLowerCase() === signer.address.toLowerCase()) {
                console.log('🔄 You own BetNFT, transferring to new factory...');
                const transferTx = await betNFT.transferOwnership(factoryAddress);
                await transferTx.wait();
                console.log('✅ BetNFT ownership transferred to new factory');
            } else {
                console.log('❌ Cannot transfer BetNFT ownership - current owner is different');
            }
        } else {
            console.log('✅ BetNFT is already owned by the new factory!');
        }

        // Save the deployment info
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            oldFactory: '0xF84bBf0Fc07917a096b6FDc32AF4a4Deb6293435',
            newFactory: factoryAddress,
            betNFT: NEW_BET_NFT_ADDRESS,
            deployer: signer.address,
            contracts: {
                AdminManager: ADMIN_MANAGER_ADDRESS,
                Treasury: TREASURY_ADDRESS,
                CastToken: CAST_TOKEN_ADDRESS,
                BetNFT: NEW_BET_NFT_ADDRESS,
                PredictionMarketFactory: factoryAddress
            }
        };

        fs.writeFileSync('new-factory-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('📋 Deployment info saved to new-factory-deployment.json');

        console.log('\n🎉 New Factory deployed successfully!');
        console.log('📝 Next steps:');
        console.log('1. Update constants.ts with new Factory address:', factoryAddress);
        console.log('2. Test market creation with new setup');
        console.log('3. Update any scripts that use the old factory address');

        return {
            success: true,
            factoryAddress,
            betNFTAddress: NEW_BET_NFT_ADDRESS
        };

    } catch (error) {
        console.error('❌ Error during deployment:', error);
        return { success: false, error: error.message };
    }
}

// Run the deployment
deployUpdatedFactory()
    .then((result) => {
        if (result.success) {
            console.log('\n✅ Factory deployment completed successfully!');
            console.log('🏭 New Factory address:', result.factoryAddress);
            console.log('🎯 BetNFT address:', result.betNFTAddress);
        } else {
            console.log('\n❌ Factory deployment failed:', result.error);
        }
        console.log('🏁 Script completed');
    })
    .catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });