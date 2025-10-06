import { testHederaAIIntegration } from './testHederaAIIntegration.js';

// Simple runner
testHederaAIIntegration()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
