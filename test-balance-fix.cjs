async function testBalanceFix() {
    console.log('🧪 Testing improved balance fetching...');

    try {
        const { ethers } = await import("ethers");

        // Simulate MetaMask provider with potential issues
        const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
        const testAddress = '0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD';

        // Test balance fetching with retries (simulating the improved logic)
        let maxRetries = 5;
        let delay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Balance attempt ${attempt}/${maxRetries}...`);
                const balance = await provider.getBalance(testAddress);
                console.log('✅ Balance retrieved:', ethers.formatEther(balance), 'HBAR');

                if (balance > 0) {
                    console.log('🎉 SUCCESS: Balance fetching working!');
                    console.log('💡 Your wallet has:', ethers.formatEther(balance), 'HBAR');
                    break;
                }
            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);

                if (attempt < maxRetries) {
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 1.2;
                }
            }
        }

        console.log('\n🔧 Try these steps to fix your balance display:');
        console.log('1. Refresh the page');
        console.log('2. Disconnect and reconnect MetaMask');
        console.log('3. Wait a moment and click the refresh balance button');
        console.log('4. Check browser console for balance fetch logs');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBalanceFix().catch(console.error);