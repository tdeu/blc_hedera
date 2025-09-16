import dotenv from 'dotenv';
import { MarketMonitorService } from './src/services/marketMonitorService.js';

dotenv.config();

async function testAIIntegration() {
  console.log('🧪 Testing AI Integration...');
  
  try {
    // Create market monitor service
    const monitor = new MarketMonitorService();
    
    // Test one monitoring cycle
    console.log('📊 Running one monitoring cycle...');
    const status = await monitor.runOnce();
    
    console.log('✅ Monitoring cycle completed');
    console.log('📈 Status:', status);
    
    // Check if we have any markets in the queue
    if (status.queueSize > 0) {
      console.log(`🎯 Found ${status.queueSize} markets in resolution queue`);
      console.log(`⏳ Pending: ${status.pendingJobs}`);
      console.log(`🔄 Processing: ${status.processingJobs}`);
      console.log(`✅ Completed: ${status.completedJobs}`);
      console.log(`❌ Failed: ${status.failedJobs}`);
    } else {
      console.log('📭 No markets currently in resolution queue');
      console.log('💡 Try forcing a market to expire with the force-resolve script');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testAIIntegration().catch(err => {
  console.error('💥 Integration test failed:', err);
  process.exit(1);
});