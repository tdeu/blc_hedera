import { HCSService } from '../src/utils/hcsService.js';
import { initializeHederaConfig } from '../src/utils/hederaConfig.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function setupHCSTopics() {
  console.log('🏗️  Setting up HCS topics for BlockCast...');
  
  try {
    const config = initializeHederaConfig();
    const hcsService = new HCSService(config);
    
    console.log('Using network:', config.network);
    console.log('Operator account:', config.operatorAccountId);
    
    // Create evidence topic
    console.log('\n1. Creating Evidence Topic...');
    const evidenceTopic = await hcsService.createTopic(
      'BlockCast Evidence Topic - Community submitted evidence for prediction markets'
    );
    console.log('✅ Evidence Topic created:', evidenceTopic);
    
    // Create AI attestations topic
    console.log('\n2. Creating AI Attestations Topic...');
    const attestationTopic = await hcsService.createTopic(
      'BlockCast AI Attestations Topic - AI agent attestations and resolutions'
    );
    console.log('✅ AI Attestations Topic created:', attestationTopic);
    
    // Create challenges topic
    console.log('\n3. Creating Challenges Topic...');
    const challengeTopic = await hcsService.createTopic(
      'BlockCast Challenges Topic - Community challenges to AI resolutions'
    );
    console.log('✅ Challenges Topic created:', challengeTopic);
    
    // Create user profiles topic
    console.log('\n4. Creating User Profiles Topic...');
    const profilesTopic = await hcsService.createTopic(
      'BlockCast User Profiles Topic - User profile data and preferences'
    );
    console.log('✅ User Profiles Topic created:', profilesTopic);
    
    // Output environment variables
    console.log('\n🎉 HCS Topics created successfully!');
    console.log('\n📝 Add these to your .env file:');
    console.log(`HCS_EVIDENCE_TOPIC=${evidenceTopic}`);
    console.log(`HCS_AI_ATTESTATIONS_TOPIC=${attestationTopic}`);
    console.log(`HCS_CHALLENGES_TOPIC=${challengeTopic}`);
    console.log(`HCS_USER_PROFILES_TOPIC=${profilesTopic}`);
    
    // Update .env file automatically
    const envPath = '.env';
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add HCS topic IDs
      const updates = {
        'HCS_EVIDENCE_TOPIC': evidenceTopic,
        'HCS_AI_ATTESTATIONS_TOPIC': attestationTopic,
        'HCS_CHALLENGES_TOPIC': challengeTopic,
        'HCS_USER_PROFILES_TOPIC': profilesTopic
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
    
    // Test topics by sending a test message
    console.log('\n🧪 Testing topics...');
    
    const testEvidence = {
      type: 'evidence',
      marketId: 'test-market',
      evidenceId: 'test-evidence-' + Date.now(),
      ipfsHash: 'QmTest' + Math.random().toString(36).substr(2, 9),
      submitter: config.operatorAccountId,
      timestamp: Date.now(),
      metadata: {
        title: 'HCS Setup Test Evidence',
        evidenceType: 'text',
        tags: ['test', 'setup']
      }
    };
    
    await hcsService.submitEvidence(testEvidence);
    console.log('✅ Test evidence submitted successfully');
    
    console.log('\n🏁 HCS setup completed! Your topics are ready for use.');
    
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

// Run the setup
setupHCSTopics();