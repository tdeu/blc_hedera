async function testBuyCastAmounts() {
  const { ethers } = await import("ethers");
  console.log('🔍 Testing BuyCAST amounts precision...');

  const buyCastAddress = '0x374722b644d17f1049348E79BD8e6FA112306824';

  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
  const deployer = new ethers.Wallet(privateKey, provider);

  const buyCastABI = [
    "function getInfo() external view returns (address castTokenAddress, uint256 exchangeRate, uint256 minPurchase, uint256 maxPurchase, uint256 contractBalance)",
    "function buyCAST() external payable"
  ];

  const buyCastContract = new ethers.Contract(buyCastAddress, buyCastABI, deployer);

  try {
    const info = await buyCastContract.getInfo();
    const minPurchase = info.minPurchase;

    console.log('📊 Minimum purchase from contract:', ethers.formatEther(minPurchase), 'HBAR');
    console.log('📊 Minimum purchase raw value:', minPurchase.toString());

    // Test different amounts around the minimum
    const testAmounts = [
      ethers.parseEther('0.09'),   // Below minimum
      ethers.parseEther('0.1'),    // Exactly minimum
      ethers.parseEther('0.100000000000000001'),  // Slightly above minimum
      ethers.parseEther('0.11'),   // Above minimum
      ethers.parseEther('1.0'),    // Well above minimum
    ];

    for (const amount of testAmounts) {
      const amountStr = ethers.formatEther(amount);
      console.log(`\n🧪 Testing ${amountStr} HBAR (${amount.toString()} wei):`);

      // Compare with minimum
      console.log(`  - Amount >= minPurchase: ${amount >= minPurchase}`);
      console.log(`  - Amount == minPurchase: ${amount === minPurchase}`);
      console.log(`  - Difference: ${(amount - minPurchase).toString()}`);

      // Try static call
      try {
        await buyCastContract.buyCAST.staticCall({ value: amount });
        console.log('  ✅ Static call succeeded');
      } catch (error) {
        console.log('  ❌ Static call failed:', error.reason || error.message);
      }
    }

    // Try with exact minimum value from contract
    console.log(`\n🎯 Testing with exact minimum value from contract:`);
    const exactMin = minPurchase;
    console.log(`  - Using amount: ${ethers.formatEther(exactMin)} HBAR`);
    console.log(`  - Raw value: ${exactMin.toString()}`);

    try {
      await buyCastContract.buyCAST.staticCall({ value: exactMin });
      console.log('  ✅ Exact minimum works!');

      // Try actual purchase
      console.log('  🔄 Attempting actual purchase with exact minimum...');
      const tx = await buyCastContract.buyCAST({
        value: exactMin,
        gasLimit: 300000
      });

      console.log(`  📤 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log('  ✅ Purchase successful with exact minimum!');
        console.log('  🎉 BuyCAST contract is working correctly!');
      } else {
        console.log('  ❌ Transaction failed');
      }

    } catch (error) {
      console.log('  ❌ Exact minimum failed:', error.reason || error.message);
    }

  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  }
}

// Run the test
testBuyCastAmounts()
  .then(() => {
    console.log('\n✅ Amount testing complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
  });