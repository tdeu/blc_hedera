async function authorizeBuyCastMinter() {
  const { ethers } = await import("ethers");
  console.log('🔐 Authorizing BuyCAST contract to mint CAST tokens...');

  const buyCastAddress = '0x39C7E682fadd37D01E211C3C8348fc5e03620f55';
  const castTokenAddress = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

  // Connect to Hedera testnet
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

  // Use private key from environment
  const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log('📝 Using deployer (CAST token owner):', deployer.address);
  console.log('💰 Deployer balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'HBAR');

  // Connect to CAST token contract
  const castTokenABI = [
    "function owner() external view returns (address)",
    "function authorizedMinters(address) external view returns (bool)",
    "function authorizeMinter(address minter) external",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)"
  ];

  const castTokenContract = new ethers.Contract(castTokenAddress, castTokenABI, deployer);

  try {
    // Verify we're the owner
    const tokenOwner = await castTokenContract.owner();
    console.log('🔍 CAST token owner:', tokenOwner);
    console.log('🔍 Deployer is owner?', tokenOwner.toLowerCase() === deployer.address.toLowerCase());

    if (tokenOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error('Deployer is not the CAST token owner. Cannot authorize minter.');
    }

    // Check if BuyCAST is already authorized
    const isAlreadyAuthorized = await castTokenContract.authorizedMinters(buyCastAddress);
    console.log('🔍 BuyCAST already authorized?', isAlreadyAuthorized);

    if (isAlreadyAuthorized) {
      console.log('✅ BuyCAST contract is already authorized to mint CAST tokens!');
      return;
    }

    // Authorize BuyCAST contract to mint
    console.log('📝 Authorizing BuyCAST contract to mint CAST tokens...');
    console.log('   BuyCAST Address:', buyCastAddress);
    console.log('   CAST Token Address:', castTokenAddress);

    const tx = await castTokenContract.authorizeMinter(buyCastAddress, {
      gasLimit: 100000
    });

    console.log('📤 Authorization transaction sent:', tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log('✅ BuyCAST contract successfully authorized to mint CAST tokens!');

      // Verify authorization
      const nowAuthorized = await castTokenContract.authorizedMinters(buyCastAddress);
      console.log('🔍 Verification - BuyCAST is now authorized:', nowAuthorized);

      if (nowAuthorized) {
        console.log('🎉 SUCCESS: BuyCAST contract can now mint CAST tokens when users purchase!');
      } else {
        console.log('❌ WARNING: Authorization may not have worked properly');
      }
    } else {
      console.log('❌ Authorization transaction failed');
    }

  } catch (error) {
    console.error('❌ Authorization failed:', error.message);

    if (error.message.includes('Only owner')) {
      console.log('💡 Make sure you are using the correct private key for the CAST token owner');
    }

    throw error;
  }
}

// Test the BuyCAST purchase after authorization
async function testBuyCastPurchase() {
  const { ethers } = await import("ethers");
  console.log('\n🧪 Testing BuyCAST purchase after authorization...');

  const buyCastAddress = '0x39C7E682fadd37D01E211C3C8348fc5e03620f55';
  const castTokenAddress = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

  // Connect to Hedera testnet
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
  const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
  const deployer = new ethers.Wallet(privateKey, provider);

  // Connect to contracts
  const buyCastABI = [
    "function buyCAST(uint256 amountHBAR) external payable",
    "function buyCAST() external payable"
  ];

  const castTokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)"
  ];

  const buyCastContract = new ethers.Contract(buyCastAddress, buyCastABI, deployer);
  const castTokenContract = new ethers.Contract(castTokenAddress, castTokenABI, deployer);

  try {
    // Check initial CAST balance
    const initialBalance = await castTokenContract.balanceOf(deployer.address);
    console.log('💰 Initial CAST balance:', ethers.formatEther(initialBalance));

    // Try a small purchase (0.1 HBAR)
    const testAmount = ethers.parseEther('0.1');
    console.log('🔄 Attempting to buy 0.1 CAST with 0.1 HBAR...');

    const tx = await buyCastContract.buyCAST(testAmount, {
      value: testAmount,
      gasLimit: 300000
    });

    console.log('📤 Purchase transaction sent:', tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log('✅ Purchase successful!');

      // Check new balance
      const newBalance = await castTokenContract.balanceOf(deployer.address);
      console.log('💰 New CAST balance:', ethers.formatEther(newBalance));

      const gained = newBalance - initialBalance;
      console.log('📈 CAST gained:', ethers.formatEther(gained));

      if (gained > 0) {
        console.log('🎉 SUCCESS: BuyCAST contract is working properly!');
      } else {
        console.log('⚠️ WARNING: No CAST tokens were gained');
      }

    } else {
      console.log('❌ Purchase transaction failed');
    }

  } catch (error) {
    console.error('❌ Test purchase failed:', error.message);
    console.log('💡 The authorization may not have worked, or there may be another issue');
  }
}

// Main execution
authorizeBuyCastMinter()
  .then(() => testBuyCastPurchase())
  .then(() => {
    console.log('\n✅ Authorization and testing complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });