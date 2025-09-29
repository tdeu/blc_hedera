const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';

// Existing contract addresses (from constants.ts)
const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
const TREASURY_ADDRESS = '0x69649cc208138B3A2c529cB301D7Bb591C53a2e2';
const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
const DISPUTE_MANAGER_ADDRESS = '0xCB8B4E630b3443a34ceDB9B8C58B8cF5675d362b';

async function main() {
    console.log('🚀 Final Complete Deployment - All contracts with correct ownership...\n');

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('👤 Deployer address:', signer.address);
    console.log('📋 Using existing contracts:');
    console.log('  - AdminManager:', ADMIN_MANAGER_ADDRESS);
    console.log('  - Treasury:', TREASURY_ADDRESS);
    console.log('  - CastToken:', CAST_TOKEN_ADDRESS);
    console.log('  - DisputeManager:', DISPUTE_MANAGER_ADDRESS);
    console.log();

    // Load contract artifacts
    const betNFTArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/BetNFT.sol/BetNFT.json', 'utf8'));
    const factoryArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json', 'utf8'));

    // Step 1: Deploy BetNFT
    console.log('📦 Step 1: Deploying BetNFT...');
    const BetNFTFactory = new ethers.ContractFactory(betNFTArtifact.abi, betNFTArtifact.bytecode, signer);
    const betNFT = await BetNFTFactory.deploy();
    await betNFT.waitForDeployment();
    const betNFTAddress = await betNFT.getAddress();
    console.log('✅ BetNFT deployed at:', betNFTAddress);
    console.log('👤 BetNFT owner:', await betNFT.owner());
    console.log();

    // Step 2: Deploy Factory
    console.log('📦 Step 2: Deploying Factory...');
    const FactoryFactory = new ethers.ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, signer);
    const factory = await FactoryFactory.deploy(
        ADMIN_MANAGER_ADDRESS,
        TREASURY_ADDRESS,
        CAST_TOKEN_ADDRESS,  // collateral token
        CAST_TOKEN_ADDRESS,  // castToken
        betNFTAddress
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log('✅ Factory deployed at:', factoryAddress);
    console.log();

    // Step 3: Transfer BetNFT ownership to Factory
    console.log('📦 Step 3: Transferring BetNFT ownership to Factory...');
    const tx = await betNFT.transferOwnership(factoryAddress);
    console.log('📤 Transfer transaction:', tx.hash);
    await tx.wait();
    console.log('✅ Ownership transferred!');
    const newOwner = await betNFT.owner();
    console.log('👤 New BetNFT owner:', newOwner);
    console.log('✅ Ownership verified:', newOwner.toLowerCase() === factoryAddress.toLowerCase());
    console.log();

    // Step 4: Verify BetNFT address in Factory
    console.log('📦 Step 4: Verifying Factory configuration...');
    const factoryBetNFT = await factory.betNFT();
    console.log('🔍 Factory points to BetNFT:', factoryBetNFT);
    console.log('✅ Configuration verified:', factoryBetNFT.toLowerCase() === betNFTAddress.toLowerCase());
    console.log();

    // Save deployment info
    const deploymentInfo = {
        timestamp: new Date().toISOString(),
        network: 'hedera-testnet',
        deployer: signer.address,
        contracts: {
            BetNFT: betNFTAddress,
            Factory: factoryAddress,
            AdminManager: ADMIN_MANAGER_ADDRESS,
            Treasury: TREASURY_ADDRESS,
            DisputeManager: DISPUTE_MANAGER_ADDRESS
        },
        verification: {
            betNFTOwner: newOwner,
            factoryBetNFT: factoryBetNFT,
            ownershipCorrect: newOwner.toLowerCase() === factoryAddress.toLowerCase(),
            configCorrect: factoryBetNFT.toLowerCase() === betNFTAddress.toLowerCase()
        }
    };

    fs.writeFileSync('final-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to final-deployment.json');
    console.log();
    console.log('=' .repeat(80));
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('=' .repeat(80));
    console.log();
    console.log('📋 Update your constants.ts with these addresses:');
    console.log(`  FACTORY_CONTRACT: '${factoryAddress}',`);
    console.log(`  BET_NFT_CONTRACT: '${betNFTAddress}',`);
    console.log();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });