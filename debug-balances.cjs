async function debugBalances() {
    console.log('🔍 Debugging wallet balances...');

    try {
        // Test direct balance check with ethers
        const { ethers } = await import("ethers");

        // Test with the test wallet we know works
        const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
        const testWallet = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD'; // Your wallet

        console.log('\n📊 Testing wallet:', testWallet);

        // Check HBAR balance
        const hbarBalance = await provider.getBalance(testWallet);
        console.log('💰 HBAR balance (raw):', hbarBalance.toString());
        console.log('💰 HBAR balance (formatted):', ethers.formatEther(hbarBalance));

        // Check CAST balance
        const castTokenAddress = '0xC78Ac73844077917E20530E36ac935c4B56236c2';
        const erc20ABI = [
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ];

        const castToken = new ethers.Contract(castTokenAddress, erc20ABI, provider);
        const castBalance = await castToken.balanceOf(testWallet);
        console.log('🪙 CAST balance (raw):', castBalance.toString());
        console.log('🪙 CAST balance (formatted):', ethers.formatEther(castBalance));

        console.log('\n✅ Direct balance check completed');

        if (hbarBalance > 0 || castBalance > 0) {
            console.log('🎉 Balances look good! The issue might be with MetaMask connection');
        } else {
            console.log('❌ Both balances are zero - this might be the real state');
        }

    } catch (error) {
        console.error('❌ Error checking balances:', error.message);
    }
}

debugBalances().catch(console.error);