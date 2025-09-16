// Paste this in your browser console to debug evidence submission
// Run this before trying to submit evidence

console.log('🔍 BlockCast Evidence Submission Debug Helper\n');

// Check if wallet service is available
if (typeof window !== 'undefined') {
  console.log('1. Checking wallet connection...');

  // You can access these through the browser console
  window.debugEvidence = {
    async checkWallet() {
      console.log('🔌 Wallet connection check:');

      // Check MetaMask
      if (window.ethereum) {
        console.log('✅ MetaMask installed');

        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          console.log('👤 Connected accounts:', accounts);

          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(accounts[0]);
            console.log('💰 Balance:', ethers.formatEther(balance), 'HBAR');

            const network = await provider.getNetwork();
            console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId);

            // Check if on Hedera testnet (296)
            if (network.chainId === 296n) {
              console.log('✅ Connected to Hedera Testnet');
            } else {
              console.log('⚠️ Not on Hedera Testnet. Current chain:', network.chainId);
            }
          } else {
            console.log('❌ No connected accounts');
          }
        } catch (error) {
          console.error('❌ Error checking wallet:', error);
        }
      } else {
        console.log('❌ MetaMask not found');
      }
    },

    async testEvidenceData() {
      console.log('📝 Testing evidence data validation:');

      const testEvidence = {
        text: "This is a test evidence submission that has more than 20 characters required",
        links: ["https://example.com/evidence1", "https://example.com/evidence2"]
      };

      console.log('📋 Test evidence:', testEvidence);
      console.log('📏 Text length:', testEvidence.text.length, '(min: 20)');
      console.log('🔗 Link count:', testEvidence.links.length);

      if (testEvidence.text.length >= 20) {
        console.log('✅ Evidence text meets minimum length');
      } else {
        console.log('❌ Evidence text too short');
      }
    },

    async checkSupabase() {
      console.log('🗄️ Checking database connection:');

      // This would need to be adapted based on your actual setup
      console.log('ℹ️ Supabase check requires backend validation');
      console.log('💡 Check Network tab for failed requests to Supabase');
    },

    async fullDebug() {
      await this.checkWallet();
      await this.testEvidenceData();
      await this.checkSupabase();

      console.log('\n🎯 Debug complete! Check the output above for issues.');
      console.log('💡 Common issues:');
      console.log('   - Wallet not connected to Hedera Testnet');
      console.log('   - Insufficient HBAR balance');
      console.log('   - Database table not created');
      console.log('   - Environment variables missing');
    }
  };

  console.log('🛠️ Debug tools loaded! Available commands:');
  console.log('   debugEvidence.checkWallet() - Check wallet status');
  console.log('   debugEvidence.testEvidenceData() - Test evidence validation');
  console.log('   debugEvidence.fullDebug() - Run all checks');
  console.log('\n👆 Run debugEvidence.fullDebug() to start debugging');

} else {
  console.log('❌ Browser environment not detected');
}

// Auto-run basic checks
if (typeof window !== 'undefined' && window.ethereum) {
  console.log('\n🚀 Auto-running basic checks...');
  setTimeout(() => {
    window.debugEvidence.fullDebug();
  }, 1000);
}