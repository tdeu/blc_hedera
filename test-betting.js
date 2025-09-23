import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testBetting() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  // Our deployed market contract
  const marketAddress = '0xD752e8E83165fa3993eA5897276ffe4109a21af3';
  const castTokenAddress = '0x5e383bD628a0cda81913bbd5EfB4DD1989fCc6e2';

  console.log('🎯 Testing betting on market:', marketAddress);
  console.log('👤 Using account:', signer.address);

  // Contract ABIs
  const marketABI = [
    "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
    "function buyYes(uint256 shares) external",
    "function buyNo(uint256 shares) external",
    "function getPriceYes(uint256 sharesToBuy) external view returns (uint256)",
    "function getPriceNo(uint256 sharesToBuy) external view returns (uint256)",
    "function yesShares() external view returns (uint256)",
    "function noShares() external view returns (uint256)",
    "function reserve() external view returns (uint256)",
    "function yesBalance(address) external view returns (uint256)",
    "function noBalance(address) external view returns (uint256)"
  ];

  const castTokenABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function mint(address to, uint256 amount) external"
  ];

  const market = new ethers.Contract(marketAddress, marketABI, signer);
  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  try {
    // Step 1: Check initial state
    console.log('\n📊 INITIAL STATE:');
    const initialPrices = await market.getCurrentPrice();
    const initialYesShares = await market.yesShares();
    const initialNoShares = await market.noShares();
    const initialReserve = await market.reserve();

    console.log('📈 Initial YES price:', ethers.formatEther(initialPrices.priceYes));
    console.log('📉 Initial NO price:', ethers.formatEther(initialPrices.priceNo));
    console.log('🟢 YES shares:', ethers.formatEther(initialYesShares));
    console.log('🔴 NO shares:', ethers.formatEther(initialNoShares));
    console.log('💰 Reserve:', ethers.formatEther(initialReserve));

    // Step 2: Check CAST token balance and mint if needed
    const balance = await castToken.balanceOf(signer.address);
    console.log('💳 CAST token balance:', ethers.formatEther(balance));

    if (balance < ethers.parseEther('100')) {
      console.log('🔄 Minting CAST tokens...');
      const mintTx = await castToken.mint(signer.address, ethers.parseEther('1000'));
      await mintTx.wait();
      console.log('✅ Minted 1000 CAST tokens');
    }

    // Step 3: Approve CAST tokens for betting
    const sharesToBuy = ethers.parseEther('10'); // 10 shares
    const betCost = await market.getPriceYes(sharesToBuy);
    console.log('💸 Cost for 10 YES shares:', ethers.formatEther(betCost));

    const allowance = await castToken.allowance(signer.address, marketAddress);
    if (allowance < betCost) {
      console.log('🔄 Approving CAST tokens...');
      const approveTx = await castToken.approve(marketAddress, ethers.parseEther('1000'));
      await approveTx.wait();
      console.log('✅ Approved CAST tokens');
    }

    // Step 4: Place a YES bet
    console.log('\n🎯 PLACING BET: 10 YES shares');
    const betTx = await market.buyYes(sharesToBuy, { gasLimit: 500000 });
    console.log('⏳ Transaction sent:', betTx.hash);
    await betTx.wait();
    console.log('✅ Bet confirmed!');

    // Step 5: Check state after bet
    console.log('\n📊 STATE AFTER BET:');
    const newPrices = await market.getCurrentPrice();
    const newYesShares = await market.yesShares();
    const newNoShares = await market.noShares();
    const newReserve = await market.reserve();
    const userYesBalance = await market.yesBalance(signer.address);

    console.log('📈 NEW YES price:', ethers.formatEther(newPrices.priceYes));
    console.log('📉 NEW NO price:', ethers.formatEther(newPrices.priceNo));
    console.log('🟢 NEW YES shares:', ethers.formatEther(newYesShares));
    console.log('🔴 NEW NO shares:', ethers.formatEther(newNoShares));
    console.log('💰 NEW Reserve:', ethers.formatEther(newReserve));
    console.log('👤 User YES shares:', ethers.formatEther(userYesBalance));

    // Calculate changes
    const priceChange = parseFloat(ethers.formatEther(newPrices.priceYes)) - parseFloat(ethers.formatEther(initialPrices.priceYes));
    const volumeTraded = parseFloat(ethers.formatEther(newReserve)) - parseFloat(ethers.formatEther(initialReserve));

    console.log('\n📊 CHANGES:');
    console.log('💹 YES price change:', priceChange > 0 ? `+${priceChange.toFixed(4)}` : priceChange.toFixed(4));
    console.log('📈 Volume traded:', volumeTraded.toFixed(4), 'CAST');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBetting().catch(console.error);