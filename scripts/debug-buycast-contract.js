async function debugBuyCastContract() {
  const { ethers } = await import("ethers");
  console.log('🔍 Debugging BuyCAST contract...');

  const buyCastAddress = '0x39C7E682fadd37D01E211C3C8348fc5e03620f55';
  const castTokenAddress = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

  // Connect to Hedera testnet
  const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');

  // Use private key from environment
  const privateKey = process.env.HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9';
  const deployer = new ethers.Wallet(privateKey, provider);
  console.log('📝 Using deployer:', deployer.address);
  console.log('💰 Deployer balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');

  // Connect to contracts with ABIs
  const buyCastABI = [
    "function getInfo() external view returns (address castTokenAddress, uint256 exchangeRate, uint256 minPurchase, uint256 maxPurchase, uint256 contractBalance)",
    "function buyCAST(uint256 amountHBAR) external payable",
    "function buyCAST() external payable",
    "function getExchangeRate() external pure returns (uint256)",
    "function owner() external view returns (address)"
  ];

  const castTokenABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function owner() external view returns (address)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
    "function MINTER_ROLE() external view returns (bytes32)",
    "function hasRole(bytes32 role, address account) external view returns (bool)",
    "function grantRole(bytes32 role, address account) external",
    "function addMinter(address account) external"
  ];

  const buyCastContract = new ethers.Contract(buyCastAddress, buyCastABI, deployer);
  const castTokenContract = new ethers.Contract(castTokenAddress, castTokenABI, deployer);

  try {
    console.log('\n🏗️ BuyCAST Contract Info:');
    const info = await buyCastContract.getInfo();
    console.log('  - CAST Token Address:', info.castTokenAddress);
    console.log('  - Exchange Rate:', ethers.formatEther(info.exchangeRate), 'CAST per HBAR');
    console.log('  - Min Purchase:', ethers.formatEther(info.minPurchase), 'HBAR');
    console.log('  - Max Purchase:', ethers.formatEther(info.maxPurchase), 'HBAR');
    console.log('  - Contract HBAR Balance:', ethers.formatEther(info.contractBalance), 'HBAR');

    console.log('\n🪙 CAST Token Info:');
    const tokenName = await castTokenContract.name();
    const tokenSymbol = await castTokenContract.symbol();
    const tokenDecimals = await castTokenContract.decimals();
    const tokenOwner = await castTokenContract.owner();

    console.log('  - Name:', tokenName);
    console.log('  - Symbol:', tokenSymbol);
    console.log('  - Decimals:', tokenDecimals);
    console.log('  - Owner:', tokenOwner);

    console.log('\n🔐 Authorization Check:');
    console.log('  - BuyCAST contract address:', buyCastAddress);
    console.log('  - CAST Token owner:', tokenOwner);
    console.log('  - Are they the same?', tokenOwner.toLowerCase() === buyCastAddress.toLowerCase());

    // Check if BuyCAST has minting role (if using AccessControl)
    try {
      // Try to check MINTER_ROLE (if contract uses AccessControl)
      const MINTER_ROLE = await castTokenContract.MINTER_ROLE();
      const hasMinterRole = await castTokenContract.hasRole(MINTER_ROLE, buyCastAddress);
      console.log('  - BuyCAST has MINTER_ROLE?', hasMinterRole);
    } catch (error) {
      console.log('  - MINTER_ROLE check failed (contract may use Ownable only)');
    }

    // Test mint function access
    console.log('\n🧪 Testing Mint Access...');
    try {
      // Try to simulate minting 1 CAST token to deployer
      const testAmount = ethers.parseEther('1');

      // This will revert if BuyCAST doesn't have permission
      await castTokenContract.connect(deployer).mint.staticCall(deployer.address, testAmount);
      console.log('  ✅ Deployer can mint (normal)');
    } catch (error) {
      console.log('  ❌ Deployer cannot mint:', error.message);
    }

    // Check if we need to authorize BuyCAST contract
    console.log('\n🔑 Authorization Status:');
    if (tokenOwner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log('  ✅ Deployer is CAST token owner');

      // Check if we can authorize BuyCAST to mint
      try {
        console.log('  🔄 Attempting to authorize BuyCAST contract to mint...');

        // If using AccessControl, grant MINTER_ROLE
        try {
          const MINTER_ROLE = await castTokenContract.MINTER_ROLE();
          const hasMinterRole = await castTokenContract.hasRole(MINTER_ROLE, buyCastAddress);

          if (!hasMinterRole) {
            console.log('  📝 Granting MINTER_ROLE to BuyCAST contract...');
            const grantTx = await castTokenContract.grantRole(MINTER_ROLE, buyCastAddress);
            await grantTx.wait();
            console.log('  ✅ MINTER_ROLE granted! Transaction:', grantTx.hash);
          } else {
            console.log('  ✅ BuyCAST already has MINTER_ROLE');
          }
        } catch (roleError) {
          console.log('  ℹ️ Contract doesn\'t use AccessControl roles');

          // If using Ownable, transfer ownership or add minter
          try {
            // Check if there's an addMinter function
            await castTokenContract.addMinter(buyCastAddress);
            console.log('  ✅ Added BuyCAST as minter');
          } catch (minterError) {
            console.log('  ⚠️ Cannot add minter. May need to transfer ownership.');
            console.log('  💡 Consider transferring CAST token ownership to BuyCAST contract');
          }
        }

      } catch (authError) {
        console.log('  ❌ Authorization failed:', authError.message);
      }

    } else {
      console.log('  ❌ Deployer is NOT the CAST token owner');
      console.log('  💡 Need to use the actual owner account to authorize BuyCAST');
    }

  } catch (error) {
    console.error('❌ Error debugging contracts:', error.message);
  }

  console.log('\n🧪 Testing BuyCAST Purchase...');
  try {
    // Try a small purchase
    const testAmount = ethers.parseEther('0.1'); // 0.1 HBAR
    console.log('  🔄 Attempting to buy 0.1 CAST with 0.1 HBAR...');

    const tx = await buyCastContract.buyCAST(testAmount, {
      value: testAmount,
      gasLimit: 300000
    });

    console.log('  📤 Transaction sent:', tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log('  ✅ Purchase successful!');

      // Check deployer's CAST balance
      const castBalance = await castTokenContract.balanceOf(deployer.address);
      console.log('  💰 Deployer CAST balance:', ethers.formatEther(castBalance));
    } else {
      console.log('  ❌ Purchase failed - transaction reverted');
    }

  } catch (purchaseError) {
    console.error('  ❌ Purchase test failed:', purchaseError.message);

    if (purchaseError.message.includes('not the owner') || purchaseError.message.includes('AccessControl')) {
      console.log('  💡 This confirms BuyCAST needs authorization to mint CAST tokens');
    }
  }
}

// Run the debug script
debugBuyCastContract()
  .then(() => {
    console.log('✅ Debug complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });