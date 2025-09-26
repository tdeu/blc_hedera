async function testFixedBuyCast() {
  const { ethers } = await import("ethers");
  console.log('🧪 Testing fixed BuyCAST implementation...');

  const buyCastAddress = '0x39C7E682fadd37D01E211C3C8348fc5e03620f55';

  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
  const deployer = new ethers.Wallet(privateKey, provider);

  // Use the simpler ABI with parameterless buyCAST() function
  const buyCastABI = [
    "function buyCAST() external payable", // Use the simpler version
    "function getInfo() external view returns (address castTokenAddress, uint256 exchangeRate, uint256 minPurchase, uint256 maxPurchase, uint256 contractBalance)"
  ];

  const buyCastContract = new ethers.Contract(buyCastAddress, buyCastABI, deployer);

  try {
    console.log('📊 BuyCAST Contract Info:');
    const info = await buyCastContract.getInfo();
    console.log('  - Min Purchase:', ethers.formatEther(info.minPurchase), 'HBAR');
    console.log('  - Max Purchase:', ethers.formatEther(info.maxPurchase), 'HBAR');

    // Test with a reasonable amount (1 HBAR)
    const testAmount = ethers.parseEther('1.0');
    console.log(`\n🔄 Testing purchase of ${ethers.formatEther(testAmount)} HBAR worth of CAST...`);

    // First try static call to simulate
    try {
      await buyCastContract.buyCAST.staticCall({ value: testAmount });
      console.log('✅ Static call succeeded - purchase should work');

      // Try actual purchase
      console.log('🔄 Attempting actual purchase...');
      const tx = await buyCastContract.buyCAST({
        value: testAmount,
        gasLimit: 300000
      });

      console.log(`📤 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log('✅ Purchase successful!');
        console.log('🎉 BuyCAST contract is working with the fixed implementation!');

        // Check gas used
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

        // Check for events
        if (receipt.logs.length > 0) {
          console.log('📝 Transaction events:', receipt.logs.length);
        }

      } else {
        console.log('❌ Transaction failed');
      }

    } catch (error) {
      console.log('❌ Static call failed:', error.reason || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFixedBuyCast()
  .then(() => {
    console.log('\n✅ Fixed BuyCAST test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });