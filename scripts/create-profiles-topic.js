import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TopicCreateTransaction 
} from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function createProfilesTopic() {
  console.log('🏗️  Creating User Profiles HCS topic...');
  
  try {
    // Initialize Hedera client
    const network = process.env.HEDERA_NETWORK || 'testnet';
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    
    if (!accountId || !privateKey) {
      throw new Error('Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env file');
    }
    
    console.log('Using network:', network);
    console.log('Operator account:', accountId);
    
    // Create client
    let client;
    switch (network) {
      case 'testnet':
        client = Client.forTestnet();
        break;
      case 'mainnet':
        client = Client.forMainnet();
        break;
      case 'previewnet':
        client = Client.forPreviewnet();
        break;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
    
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromStringECDSA(privateKey)
    );
    
    // Create user profiles topic
    console.log('\n1. Creating User Profiles Topic...');
    const profilesTopicTx = new TopicCreateTransaction()
      .setTopicMemo('BlockCast User Profiles Topic - User profile data and preferences');
    
    const profilesResponse = await profilesTopicTx.execute(client);
    const profilesReceipt = await profilesResponse.getReceipt(client);
    const profilesTopic = profilesReceipt.topicId?.toString();
    console.log('✅ User Profiles Topic created:', profilesTopic);
    
    console.log('\n🎉 User Profiles Topic created successfully!');
    console.log('\n📝 Add this to your .env file:');
    console.log(`HCS_USER_PROFILES_TOPIC=${profilesTopic}`);
    
    client.close();
    
  } catch (error) {
    console.error('❌ Failed to create profiles topic:', error);
    process.exit(1);
  }
}

createProfilesTopic();