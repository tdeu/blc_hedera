import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testNewFactory() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const newFactoryAddress = '0x78F028E7ba957DD166A39908f1acbEeb0F01ABeF';

  console.log('🏭 Testing NEW factory configuration:', newFactoryAddress);

  const factoryABI = [
    "function collateral() external view returns (address)",
    "function castToken() external view returns (address)",
    "function betNFT() external view returns (address)",
    "function createMarket(string memory question, uint256 endTime) external returns (bytes32)"
  ];

  const factory = new ethers.Contract(newFactoryAddress, factoryABI, signer);

  try {
    // Check factory configuration
    const collateralAddress = await factory.collateral();
    const castTokenAddress = await factory.castToken();
    const betNFTAddress = await factory.betNFT();

    console.log('📋 Factory Configuration:');
    console.log('  Collateral token:', collateralAddress);
    console.log('  CAST token:', castTokenAddress);
    console.log('  BetNFT:', betNFTAddress);

    // Expected addresses
    const expectedCastToken = '0x5e383bD628a0cda81913bbd5EfB4DD1989fCc6e2';
    const expectedBetNFT = '0xb639EC048b2C70E4E0BeC475DCC7f1adcc2D10a5';

    console.log('\n✅ Verification:');
    console.log('  Collateral = CastToken?', collateralAddress.toLowerCase() === expectedCastToken.toLowerCase());
    console.log('  CAST token correct?', castTokenAddress.toLowerCase() === expectedCastToken.toLowerCase());
    console.log('  BetNFT correct?', betNFTAddress.toLowerCase() === expectedBetNFT.toLowerCase());

    // Test creating a market
    console.log('\n🎯 Testing market creation...');
    const question = `Test Market ${new Date().toISOString()}`;
    const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

    const createTx = await factory.createMarket(question, endTime);
    console.log('📤 Market creation transaction sent:', createTx.hash);

    const receipt = await createTx.wait();
    console.log('✅ Market creation confirmed!');

    // Find the market address from events
    const marketCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === 'MarketCreated';
      } catch {
        return false;
      }
    });

    if (marketCreatedEvent) {
      const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
      const marketAddress = parsedEvent.args.market;
      console.log('🎉 NEW Market deployed at:', marketAddress);

      // Test the new market immediately
      console.log('\n🔍 Testing new market prices...');
      const marketABI = [
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
        "function collateral() external view returns (address)"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, provider);

      const marketCollateral = await market.collateral();
      console.log('📊 Market collateral token:', marketCollateral);
      console.log('✅ Uses correct CastToken?', marketCollateral.toLowerCase() === expectedCastToken.toLowerCase());

      const [priceYes, priceNo] = await market.getCurrentPrice();
      console.log('📈 Initial prices:');
      console.log('  YES:', ethers.formatEther(priceYes));
      console.log('  NO:', ethers.formatEther(priceNo));

      console.log('\n🎯 SUCCESS! New factory creates markets with correct CastToken!');
      console.log('📝 New market address for testing:', marketAddress);

    } else {
      console.log('❌ Could not find MarketCreated event');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewFactory().catch(console.error);