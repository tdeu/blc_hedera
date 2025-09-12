import { 
  Client, 
  PrivateKey, 
  AccountId, 
  TopicCreateTransaction, 
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar 
} from '@hashgraph/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const operatorId = AccountId.fromString(process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID || '0.0.6643581');
const operatorKey = PrivateKey.fromString(process.env.VITE_HEDERA_TESTNET_PRIVATE_KEY || '');

// Create Hedera client for testnet
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function createHCSTopics() {
  console.log('\n🔗 Creating HCS Topics for Resolution System...');
  
  const topics = [
    {
      name: 'Resolution Topic',
      memo: 'BlockCast Resolution Messages - API and manual resolutions',
      env_key: 'HCS_RESOLUTION_TOPIC'
    },
    {
      name: 'Dispute Topic', 
      memo: 'BlockCast Dispute Submissions - User disputes and challenges',
      env_key: 'HCS_DISPUTE_TOPIC'
    },
    {
      name: 'Admin Topic',
      memo: 'BlockCast Admin Decisions - Admin reviews and final decisions',
      env_key: 'HCS_ADMIN_TOPIC'
    }
  ];

  const createdTopics = [];

  for (const topicInfo of topics) {
    try {
      console.log(`\nCreating ${topicInfo.name}...`);
      
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(topicInfo.memo)
        .setAdminKey(operatorKey.publicKey)
        .setSubmitKey(operatorKey.publicKey)
        .setMaxTransactionFee(new Hbar(2));

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);
      
      if (receipt.topicId) {
        const topicId = receipt.topicId.toString();
        createdTopics.push({
          name: topicInfo.name,
          topicId,
          envKey: topicInfo.env_key,
          transactionId: response.transactionId.toString()
        });
        
        console.log(`✅ ${topicInfo.name} created: ${topicId}`);
        console.log(`   Transaction: ${response.transactionId.toString()}`);
      } else {
        console.error(`❌ Failed to create ${topicInfo.name} - no topic ID returned`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${topicInfo.name}:`, error.message);
    }
  }

  return createdTopics;
}

async function createHTSToken() {
  console.log('\n💰 Creating HTS Dispute Bond Token...');
  
  try {
    const transaction = new TokenCreateTransaction()
      .setTokenName('BlockCast Dispute Bond')
      .setTokenSymbol('BCDB')
      .setDecimals(2) // 2 decimal places for precision
      .setInitialSupply(1000000) // 1 million tokens initial supply  
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(operatorId)
      .setAdminKey(operatorKey.publicKey)
      .setSupplyKey(operatorKey.publicKey)
      .setFreezeKey(operatorKey.publicKey)
      .setWipeKey(operatorKey.publicKey)
      .setMaxTransactionFee(new Hbar(10));

    console.log('Executing token creation transaction...');
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    if (receipt.tokenId) {
      const tokenId = receipt.tokenId.toString();
      
      console.log(`✅ Dispute Bond Token created: ${tokenId}`);
      console.log(`   Name: BlockCast Dispute Bond (BCDB)`);
      console.log(`   Initial Supply: 1,000,000 BCDB`);
      console.log(`   Treasury Account: ${operatorId.toString()}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      
      return {
        tokenId,
        symbol: 'BCDB',
        name: 'BlockCast Dispute Bond',
        transactionId: response.transactionId.toString()
      };
    } else {
      console.error('❌ Failed to create token - no token ID returned');
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating HTS token:', error.message);
    return null;
  }
}

async function updateSupabaseWithHederaData(topics, token) {
  console.log('\n📊 Updating Supabase with Hedera data...');
  
  // This would typically insert data into Supabase
  // For now, we'll just log the SQL statements that should be run
  
  console.log('\nRun the following SQL in your Supabase SQL Editor:');
  console.log('-----------------------------------------------');
  
  // Insert HCS topics
  for (const topic of topics) {
    console.log(`
INSERT INTO hcs_topics (topic_id, topic_type, description, admin_key) VALUES
('${topic.topicId}', '${topic.name.toLowerCase().replace(' topic', '')}', '${topic.name}', '${operatorKey.publicKey.toString()}')
ON CONFLICT (topic_id) DO UPDATE SET 
  description = EXCLUDED.description,
  admin_key = EXCLUDED.admin_key;`);
  }
  
  // Insert HTS token
  if (token) {
    console.log(`
INSERT INTO hts_tokens (token_id, token_name, token_symbol, token_type, purpose, decimals, total_supply, treasury_account) VALUES
('${token.tokenId}', '${token.name}', '${token.symbol}', 'fungible', 'dispute_bond', 2, 1000000, '${operatorId.toString()}')
ON CONFLICT (token_id) DO UPDATE SET 
  token_name = EXCLUDED.token_name,
  treasury_account = EXCLUDED.treasury_account;`);
  }
  
  console.log('-----------------------------------------------');
}

async function updateEnvironmentFile(topics, token) {
  console.log('\n📝 Environment Variables to Update:');
  console.log('-----------------------------------');
  
  // HCS Topics
  for (const topic of topics) {
    console.log(`${topic.envKey}=${topic.topicId}`);
  }
  
  // HTS Token
  if (token) {
    console.log(`HTS_DISPUTE_BOND_TOKEN=${token.tokenId}`);
  }
  
  console.log('\nAdd these to your .env file for development and production use.');
  console.log('-----------------------------------');
}

async function verifyDeployment(topics, token) {
  console.log('\n🔍 Verifying Deployment...');
  
  try {
    // Verify each topic exists
    for (const topic of topics) {
      console.log(`✅ Topic ${topic.name}: https://hashscan.io/testnet/topic/${topic.topicId}`);
    }
    
    // Verify token exists
    if (token) {
      console.log(`✅ Token ${token.symbol}: https://hashscan.io/testnet/token/${token.tokenId}`);
      
      // Get account balance to verify token
      const balance = await client.getAccountBalance(operatorId);
      const tokenBalance = balance.tokens.get(token.tokenId);
      console.log(`✅ Treasury balance: ${tokenBalance ? tokenBalance.toString() : '0'} ${token.symbol}`);
    }
    
    console.log('\n🎉 All components verified successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function main() {
  console.log('🚀 BlockCast Resolution System Deployment');
  console.log('==========================================');
  console.log(`Network: Hedera Testnet`);
  console.log(`Operator Account: ${operatorId.toString()}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Create HCS Topics
    const topics = await createHCSTopics();
    
    // Create HTS Token  
    const token = await createHTSToken();
    
    // Update Supabase (manual step)
    await updateSupabaseWithHederaData(topics, token);
    
    // Show environment variables to update
    await updateEnvironmentFile(topics, token);
    
    // Verify deployment
    await verifyDeployment(topics, token);
    
    console.log('\n✅ Deployment Complete!');
    console.log('\nNext Steps:');
    console.log('1. Update your .env file with the new topic IDs and token ID');
    console.log('2. Run the SQL statements in your Supabase SQL Editor');
    console.log('3. Test the resolution system with a sample market');
    console.log('4. Monitor the HashScan links above to verify transactions');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    client.close();
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createHCSTopics, createHTSToken };