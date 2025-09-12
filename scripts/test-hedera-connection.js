import { 
  Client, 
  PrivateKey, 
  AccountId,
  AccountInfoQuery,
  Hbar
} from '@hashgraph/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const operatorId = AccountId.fromString(process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID || '0.0.6643581');
const operatorKey = PrivateKey.fromString(process.env.VITE_HEDERA_TESTNET_PRIVATE_KEY || '');

// Create Hedera client for testnet
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function testConnection() {
  console.log('🧪 Testing Hedera Testnet Connection');
  console.log('=====================================');
  console.log(`Account ID: ${operatorId.toString()}`);
  console.log(`Network: Testnet`);
  
  try {
    console.log('\n1. Testing account info query...');
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(operatorId)
      .execute(client);
    
    console.log(`✅ Account exists: ${accountInfo.accountId.toString()}`);
    
    console.log('\n2. Testing account balance...');
    const balance = await client.getAccountBalance(operatorId);
    console.log(`✅ HBAR Balance: ${balance.hbars.toString()}`);
    
    if (balance.tokens && balance.tokens.size > 0) {
      console.log(`✅ Token Associations: ${balance.tokens.size}`);
      for (const [tokenId, tokenBalance] of balance.tokens.entries()) {
        console.log(`   - ${tokenId.toString()}: ${tokenBalance.toString()}`);
      }
    } else {
      console.log('ℹ️  No token associations found');
    }
    
    console.log('\n✅ Connection test successful!');
    console.log('Ready to deploy resolution system components.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('Please check your .env file configuration.');
  } finally {
    client.close();
  }
}

testConnection().catch(console.error);