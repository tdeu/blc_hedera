import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function quickTestBet() {
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, provider);

  const marketAddress = '0xdbe5D793Be98990B3A328e38c7D85256994e81aC';
  const castTokenAddress = '0x5e383bD628a0cda81913bbd5EfB4DD1989fCc6e2';

  console.log('🎯 Quick bet test on market:', marketAddress);

  const marketABI = [
    "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
    "function buyYes(uint256 shares) external",
    "function getPriceYes(uint256 sharesToBuy) external view returns (uint256)",
    "function yesShares() external view returns (uint256)",
    "function noShares() external view returns (uint256)",
    "function reserve() external view returns (uint256)"
  ];

  const castTokenABI = [
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];

  const market = new ethers.Contract(marketAddress, marketABI, signer);
  const castToken = new ethers.Contract(castTokenAddress, castTokenABI, signer);

  try {
    // Check current state
    console.log('\n📊 BEFORE BET:');
    const [priceYes, priceNo] = await market.getCurrentPrice();
    const yesShares = await market.yesShares();
    const noShares = await market.noShares();
    const reserve = await market.reserve();

    console.log('  YES price:', ethers.formatEther(priceYes));
    console.log('  NO price:', ethers.formatEther(priceNo));
    console.log('  YES shares:', ethers.formatEther(yesShares));
    console.log('  NO shares:', ethers.formatEther(noShares));
    console.log('  Reserve:', ethers.formatEther(reserve));

    // Check allowance
    const allowance = await castToken.allowance(signer.address, marketAddress);
    console.log('  Allowance:', ethers.formatEther(allowance));

    if (allowance < ethers.parseEther('10')) {
      console.log('🔄 Approving more tokens...');
      const approveTx = await castToken.approve(marketAddress, ethers.parseEther('1000'));
      await approveTx.wait();
      console.log('✅ Approved');
    }

    // Place a small bet
    const sharesToBuy = ethers.parseEther('1'); // 1 share
    const cost = await market.getPriceYes(sharesToBuy);
    console.log('\n💸 Cost for 1 YES share:', ethers.formatEther(cost));

    console.log('🎯 Placing bet...');
    const betTx = await market.buyYes(sharesToBuy, { gasLimit: 500000 });
    console.log('📤 Transaction sent:', betTx.hash);

    const receipt = await betTx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('   Status:', receipt.status);
    console.log('   Gas used:', receipt.gasUsed.toString());

    // Check state after bet
    console.log('\n📊 AFTER BET:');
    const [newPriceYes, newPriceNo] = await market.getCurrentPrice();
    const newYesShares = await market.yesShares();
    const newNoShares = await market.noShares();
    const newReserve = await market.reserve();

    console.log('  YES price:', ethers.formatEther(newPriceYes));
    console.log('  NO price:', ethers.formatEther(newPriceNo));
    console.log('  YES shares:', ethers.formatEther(newYesShares));
    console.log('  NO shares:', ethers.formatEther(newNoShares));
    console.log('  Reserve:', ethers.formatEther(newReserve));

    // Calculate odds
    const yesPriceEth = parseFloat(ethers.formatEther(newPriceYes));
    const noPriceEth = parseFloat(ethers.formatEther(newPriceNo));
    const yesOdds = yesPriceEth > 0 ? 1 / yesPriceEth : 2.0;
    const noOdds = noPriceEth > 0 ? 1 / noPriceEth : 2.0;

    console.log('\n🎯 NEW ODDS:');
    console.log(`  True ${yesOdds.toFixed(2)}x`);
    console.log(`  False ${noOdds.toFixed(2)}x`);

    if (yesOdds !== 2.0 || noOdds !== 2.0) {
      console.log('\n🎉 SUCCESS! Odds changed - betting works!');
      console.log('🔄 Now refresh your UI to see the changes');
    } else {
      console.log('\n❌ Odds still 2.00x - something is wrong');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Reason:', error.reason);
  }
}

quickTestBet().catch(console.error);