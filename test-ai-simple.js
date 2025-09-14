import dotenv from 'dotenv';
dotenv.config();

console.log('🤖 BlockCast AI Agent - Simple Integration Test');
console.log('');

// Check environment variables
console.log('Environment Check:');
console.log('- HEDERA_ACCOUNT_ID:', process.env.HEDERA_ACCOUNT_ID ? 'Set' : 'Missing');
console.log('- HEDERA_PRIVATE_KEY:', process.env.HEDERA_PRIVATE_KEY ? 'Set' : 'Missing');
console.log('- VITE_HEDERA_TESTNET_ACCOUNT_ID:', process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID ? 'Set' : 'Missing');
console.log('- VITE_HEDERA_TESTNET_PRIVATE_KEY:', process.env.VITE_HEDERA_TESTNET_PRIVATE_KEY ? 'Set' : 'Missing');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');
console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing');
console.log('');

// Check for minimum requirements
const hasHederaCredentials = 
  (process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY) ||
  (process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID && process.env.VITE_HEDERA_TESTNET_PRIVATE_KEY);

const hasAICredentials = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

console.log('Requirements Check:');
console.log('- Hedera Credentials:', hasHederaCredentials ? '✅ Available' : '❌ Missing');
console.log('- AI API Key:', hasAICredentials ? '✅ Available' : '❌ Missing');
console.log('');

if (!hasHederaCredentials) {
  console.log('💡 To set up Hedera credentials:');
  console.log('1. Go to https://portal.hedera.com/dashboard');
  console.log('2. Create a testnet account or use existing');
  console.log('3. Add to .env file:');
  console.log('   HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID');
  console.log('   HEDERA_PRIVATE_KEY=0x...YOUR_PRIVATE_KEY');
  console.log('');
}

if (!hasAICredentials) {
  console.log('💡 To set up AI provider:');
  console.log('1. Get API key from OpenAI or Anthropic');
  console.log('2. Add to .env file:');
  console.log('   OPENAI_API_KEY=sk-proj-...YOUR_KEY  # OR');
  console.log('   ANTHROPIC_API_KEY=sk-ant-...YOUR_KEY');
  console.log('');
}

if (hasHederaCredentials && hasAICredentials) {
  console.log('🎉 All requirements met! BlockCast AI Agent is ready for testing.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run full test: npm run test:ai-agent');
  console.log('2. Integrate with BlockCast components');
  console.log('3. Test market resolution workflow');
  console.log('4. Test dispute processing workflow');
} else {
  console.log('⚠️ Some requirements are missing. Please set up the missing credentials above.');
}

// Test basic imports
console.log('Testing basic Node.js imports...');
try {
  console.log('- dotenv:', typeof dotenv);
  console.log('- process.env:', typeof process.env);
  console.log('✅ Basic imports working');
} catch (error) {
  console.log('❌ Import error:', error.message);
}