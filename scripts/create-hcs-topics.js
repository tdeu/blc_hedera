import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TopicCreateTransaction 
} from '@hashgraph/sdk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function createHCSTopics() {
  console.log('🏗️  Setting up HCS topics for BlockCast...');
  
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
    
    // Create evidence topic
    console.log('\n1. Creating Evidence Topic...');
    const evidenceTopicTx = new TopicCreateTransaction()
      .setTopicMemo('BlockCast Evidence Topic - Community submitted evidence for prediction markets');
    
    const evidenceResponse = await evidenceTopicTx.execute(client);
    const evidenceReceipt = await evidenceResponse.getReceipt(client);
    const evidenceTopic = evidenceReceipt.topicId?.toString();
    console.log('✅ Evidence Topic created:', evidenceTopic);
    
    // Create AI attestations topic
    console.log('\n2. Creating AI Attestations Topic...');
    const attestationTopicTx = new TopicCreateTransaction()
      .setTopicMemo('BlockCast AI Attestations Topic - AI agent attestations and resolutions');
    
    const attestationResponse = await attestationTopicTx.execute(client);
    const attestationReceipt = await attestationResponse.getReceipt(client);
    const attestationTopic = attestationReceipt.topicId?.toString();
    console.log('✅ AI Attestations Topic created:', attestationTopic);
    
    // Create challenges topic
    console.log('\n3. Creating Challenges Topic...');
    const challengeTopicTx = new TopicCreateTransaction()
      .setTopicMemo('BlockCast Challenges Topic - Community challenges to AI resolutions');
    
    const challengeResponse = await challengeTopicTx.execute(client);
    const challengeReceipt = await challengeResponse.getReceipt(client);
    const challengeTopic = challengeReceipt.topicId?.toString();
    console.log('✅ Challenges Topic created:', challengeTopic);
    
    // Output environment variables
    console.log('\n🎉 HCS Topics created successfully!');
    console.log('\n📝 Topic IDs:');
    console.log(`HCS_EVIDENCE_TOPIC=${evidenceTopic}`);
    console.log(`HCS_AI_ATTESTATIONS_TOPIC=${attestationTopic}`);
    console.log(`HCS_CHALLENGES_TOPIC=${challengeTopic}`);
    
    // Update .env file automatically
    const envPath = '.env';
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add HCS topic IDs
      const updates = {
        'HCS_EVIDENCE_TOPIC': evidenceTopic,
        'HCS_AI_ATTESTATIONS_TOPIC': attestationTopic,
        'HCS_CHALLENGES_TOPIC': challengeTopic
      };
      
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file updated automatically');
    }
    
    console.log('\n🏁 HCS setup completed! Your topics are ready for use.');
    
    client.close();
    
  } catch (error) {
    console.error('❌ Failed to setup HCS topics:', error);
    
    if (error.message.includes('insufficient')) {
      console.log('\n💡 Make sure your account has sufficient HBAR balance.');
      console.log('   Get free HBAR at: https://portal.hedera.com');
    }
    
    if (error.message.includes('INVALID_ACCOUNT')) {
      console.log('\n💡 Check your HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env');
    }
    
    process.exit(1);
  }
}

createHCSTopics();