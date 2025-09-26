async function debugBuyCastDetailed() {
  const { ethers } = await import("ethers");
  console.log('🔍 Detailed BuyCAST contract debugging...');

  const buyCastAddress = '0x39C7E682fadd37D01E211C3C8348fc5e03620f55';
  const castTokenAddress = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

  // Connect to Hedera testnet
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log('📝 Using deployer:', deployer.address);

  // Connect to contracts
  const buyCastABI = [
    "function getInfo() external view returns (address castTokenAddress, uint256 exchangeRate, uint256 minPurchase, uint256 maxPurchase, uint256 contractBalance)",
    "function getCastAmount(uint256 hbarAmount) external pure returns (uint256)",
    "function buyCAST() external payable",  // The simpler version without parameter
    "function owner() external view returns (address)"
  ];

  const castTokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function authorizedMinters(address) external view returns (bool)",
    "function totalSupply() external view returns (uint256)",
    "function MAX_SUPPLY() external view returns (uint256)"
  ];

  const buyCastContract = new ethers.Contract(buyCastAddress, buyCastABI, deployer);
  const castTokenContract = new ethers.Contract(castTokenAddress, castTokenABI, deployer);

  try {
    console.log('\n🏗️ Contract Info:');
    const info = await buyCastContract.getInfo();
    console.log('  - CAST Token Address:', info.castTokenAddress);
    console.log('  - Exchange Rate:', ethers.formatEther(info.exchangeRate), 'CAST per HBAR');
    console.log('  - Min Purchase:', ethers.formatEther(info.minPurchase), 'HBAR');
    console.log('  - Max Purchase:', ethers.formatEther(info.maxPurchase), 'HBAR');
    console.log('  - Contract HBAR Balance:', ethers.formatEther(info.contractBalance), 'HBAR');

    // Test different amounts
    const testAmounts = [
      ethers.parseEther('0.1'),  // 0.1 HBAR - minimum
      ethers.parseEther('1'),    // 1 HBAR
      ethers.parseEther('10')    // 10 HBAR
    ];

    for (const amount of testAmounts) {
      const amountStr = ethers.formatEther(amount);
      console.log(`\n🧪 Testing ${amountStr} HBAR purchase:`);

      try {
        // Check calculated CAST amount
        const expectedCast = await buyCastContract.getCastAmount(amount);
        console.log(`  - Expected CAST: ${ethers.formatEther(expectedCast)}`);

        // Check constraints
        if (amount < info.minPurchase) {
          console.log('  ⚠️ Below minimum purchase amount');
          continue;
        }
        if (amount > info.maxPurchase) {
          console.log('  ⚠️ Above maximum purchase amount');
          continue;
        }

        // Check token supply constraints
        const currentSupply = await castTokenContract.totalSupply();
        const maxSupply = await castTokenContract.MAX_SUPPLY();
        console.log(`  - Current CAST supply: ${ethers.formatEther(currentSupply)}`);
        console.log(`  - Max CAST supply: ${ethers.formatEther(maxSupply)}`);

        if (currentSupply + expectedCast > maxSupply) {
          console.log('  ⚠️ Would exceed max supply');
          continue;
        }

        // Check authorization
        const isAuthorized = await castTokenContract.authorizedMinters(buyCastAddress);
        console.log(`  - BuyCAST authorized: ${isAuthorized}`);

        if (!isAuthorized) {
          console.log('  ❌ BuyCAST not authorized to mint');
          continue;
        }

        // Try static call first (simulation)
        console.log('  🔄 Simulating purchase...');
        try {
          await buyCastContract.buyCAST.staticCall({ value: amount });
          console.log('  ✅ Static call succeeded - purchase should work');

          // Try actual purchase
          console.log('  🔄 Attempting actual purchase...');
          const tx = await buyCastContract.buyCAST({
            value: amount,
            gasLimit: 300000
          });

          console.log(`  📤 Transaction sent: ${tx.hash}`);
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            console.log('  ✅ Purchase successful!');

            // Check events
            if (receipt.logs.length > 0) {
              console.log('  📝 Events:', receipt.logs.length);
            }

            // Check balance increase
            const newBalance = await castTokenContract.balanceOf(deployer.address);
            console.log(`  💰 New CAST balance: ${ethers.formatEther(newBalance)}`);

          } else {
            console.log('  ❌ Transaction failed');
          }

        } catch (staticError) {
          console.log('  ❌ Static call failed:', staticError.reason || staticError.message);

          if (staticError.reason) {
            console.log('  🎯 Exact error:', staticError.reason);
          }

          // Try to decode error
          if (staticError.data) {
            console.log('  📊 Error data:', staticError.data);
          }
        }

        break; // Only test one successful amount

      } catch (error) {
        console.log('  ❌ Test failed:', error.message);
      }
    }

    // Check the BuyCAST contract owner
    console.log('\n👤 Contract Owner Info:');
    try {
      const buyCastOwner = await buyCastContract.owner();
      console.log('  - BuyCAST owner:', buyCastOwner);
      console.log('  - Is deployer the owner?', buyCastOwner.toLowerCase() === deployer.address.toLowerCase());
    } catch (error) {
      console.log('  - Could not get BuyCAST owner:', error.message);
    }

  } catch (error) {
    console.error('❌ Debugging failed:', error.message);
  }
}

// Run the detailed debugging
debugBuyCastDetailed()
  .then(() => {
    console.log('\n✅ Detailed debugging complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debugging failed:', error);
    process.exit(1);
  });