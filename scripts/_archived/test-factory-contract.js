async function main() {
  // Use dynamic import for ethers
  const { ethers } = await import("ethers");
  const fs = await import("fs");

  console.log("🧪 Testing PredictionMarketFactory contract...");

  // Contract addresses from deployments-testnet.json (latest)
  const FACTORY_ADDRESS = '0x3b26e2AC3e4414fbdB9AAE8F14af863b775233D1';
  const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
  const TREASURY_ADDRESS = '0x69649cc208138B3A2c529cB301D7Bb591C53a2e2';
  const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
  const BET_NFT_ADDRESS = '0x8e718596977C0BE525c5b1afeA73d9eFdF9bB7ca';

  // Create provider and signer
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  console.log("📋 Testing with account:", signer.address);
  console.log("📋 Account balance:", ethers.formatEther(await provider.getBalance(signer.address)), "HBAR");

  try {
    // Load the Factory ABI
    const factoryArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/PredictionMarketFactory.sol/PredictionMarketFactory.json', 'utf8'));
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryArtifact.abi, signer);

    console.log('\n🏭 Factory Contract Info');
    console.log('Factory address:', FACTORY_ADDRESS);

    // Check if factory is paused
    const isPaused = await factory.isFactoryPaused();
    console.log('Factory paused:', isPaused);

    // Check factory configuration
    const adminManager = await factory.adminManager();
    const treasury = await factory.treasury();
    const castToken = await factory.castToken();
    const collateral = await factory.collateral();
    const betNFT = await factory.betNFT();

    console.log('\n⚙️ Factory Configuration');
    console.log('AdminManager:', adminManager);
    console.log('Treasury:', treasury);
    console.log('CastToken:', castToken);
    console.log('Collateral:', collateral);
    console.log('BetNFT:', betNFT);

    console.log('\n✅ Expected Addresses');
    console.log('AdminManager expected:', ADMIN_MANAGER_ADDRESS);
    console.log('Treasury expected:', TREASURY_ADDRESS);
    console.log('CastToken expected:', CAST_TOKEN_ADDRESS);
    console.log('BetNFT expected:', BET_NFT_ADDRESS);

    // Check if addresses match
    const configValid =
      adminManager.toLowerCase() === ADMIN_MANAGER_ADDRESS.toLowerCase() &&
      treasury.toLowerCase() === TREASURY_ADDRESS.toLowerCase() &&
      castToken.toLowerCase() === CAST_TOKEN_ADDRESS.toLowerCase() &&
      betNFT.toLowerCase() === BET_NFT_ADDRESS.toLowerCase();

    console.log('\n🔍 Configuration Check');
    console.log('Factory configuration valid:', configValid ? '✅ VALID' : '❌ INVALID');

    if (!configValid) {
      console.log('❌ CONFIGURATION MISMATCH - This explains the deployment failures!');
      console.log('\nDetailed mismatch analysis:');
      if (adminManager.toLowerCase() !== ADMIN_MANAGER_ADDRESS.toLowerCase()) {
        console.log('❌ AdminManager mismatch:', adminManager, 'vs', ADMIN_MANAGER_ADDRESS);
      }
      if (treasury.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
        console.log('❌ Treasury mismatch:', treasury, 'vs', TREASURY_ADDRESS);
      }
      if (castToken.toLowerCase() !== CAST_TOKEN_ADDRESS.toLowerCase()) {
        console.log('❌ CastToken mismatch:', castToken, 'vs', CAST_TOKEN_ADDRESS);
      }
      if (betNFT.toLowerCase() !== BET_NFT_ADDRESS.toLowerCase()) {
        console.log('❌ BetNFT mismatch:', betNFT, 'vs', BET_NFT_ADDRESS);
      }
      return;
    }

    // Check if deployer is admin
    const adminArtifact = JSON.parse(fs.readFileSync('./artifacts/contracts/AdminManager.sol/AdminManager.json', 'utf8'));
    const adminContract = new ethers.Contract(adminManager, adminArtifact.abi, signer);

    const isAdmin = await adminContract.isAdmin(signer.address);
    console.log('Deployer is admin:', isAdmin ? '✅ YES' : '❌ NO');

    if (!isAdmin) {
      console.log('❌ Account is not admin - Cannot create markets');
      return;
    }

    // Try to create a test market
    console.log('\n🎯 Testing Market Creation');
    const question = `Test market ${Date.now()}`;
    const endTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

    console.log('Creating market with question:', question);
    console.log('End time:', new Date(endTime * 1000).toISOString());

    // Estimate gas first
    try {
      const gasEstimate = await factory.createMarket.estimateGas(question, endTime);
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.log('Gas estimation failed:', gasError.message);
    }

    const tx = await factory.createMarket(question, endTime, {
      gasLimit: 15000000 // 15M gas limit
    });

    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('Transaction confirmed!');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');

    if (receipt.status === 1) {
      // Find the MarketCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === 'MarketCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = factory.interface.parseLog(event);
        console.log('✅ Market created successfully!');
        console.log('Market ID:', parsed.args.id);
        console.log('Market address:', parsed.args.market);
        console.log('Question:', parsed.args.question);
      }
    } else {
      console.log('❌ Transaction failed');
    }

  } catch (error) {
    console.error('❌ Error testing factory:', error);

    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    if (error.message) {
      console.error('Message:', error.message);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });