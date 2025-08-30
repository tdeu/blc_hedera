import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TopicCreateTransaction,
  Hbar
} from '@hashgraph/sdk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function createTopicsSimple() {
  console.log('🔧 Simple HCS Topic Creation...');
  
  try {
    const client = Client.forTestnet();
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromStringECDSA(privateKey)
    );
    
    // Set max transaction fee to avoid timeout issues
    client.setDefaultMaxTransactionFee(new Hbar(2));
    
    console.log('Creating topics one by one with delays...\n');
    
    // Topic 1: Evidence
    console.log('1️⃣ Creating Evidence Topic...');
    const topic1 = await new TopicCreateTransaction()
      .setTopicMemo('BlockCast Evidence')
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);
    
    const receipt1 = await topic1.getReceipt(client);
    const evidenceTopic = receipt1.topicId.toString();
    console.log('✅ Evidence Topic:', evidenceTopic);
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Topic 2: AI Attestations  
    console.log('2️⃣ Creating AI Attestations Topic...');
    const topic2 = await new TopicCreateTransaction()
      .setTopicMemo('BlockCast AI Attestations')
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);
      
    const receipt2 = await topic2.getReceipt(client);
    const attestationTopic = receipt2.topicId.toString();
    console.log('✅ AI Attestations Topic:', attestationTopic);
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Topic 3: Challenges
    console.log('3️⃣ Creating Challenges Topic...');
    const topic3 = await new TopicCreateTransaction()
      .setTopicMemo('BlockCast Challenges')
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);
      
    const receipt3 = await topic3.getReceipt(client);
    const challengeTopic = receipt3.topicId.toString();
    console.log('✅ Challenges Topic:', challengeTopic);
    
    // Update .env file
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
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
    
    console.log('\n🎉 All HCS Topics Created Successfully!');
    console.log(`Evidence Topic: ${evidenceTopic}`);
    console.log(`AI Attestations Topic: ${attestationTopic}`);
    console.log(`Challenges Topic: ${challengeTopic}`);
    console.log('\n✅ .env file updated automatically');
    console.log('\n🚀 Your BlockCast integration is now 100% complete!');
    
    client.close();
    
  } catch (error) {
    console.error('❌ Error creating topics:', error.message);
    
    if (error.message.includes('INSUFFICIENT')) {
      console.log('\n💡 Your account needs more HBAR. Get free testnet HBAR at portal.hedera.com');
    }
    
    process.exit(1);
  }
}

createTopicsSimple();