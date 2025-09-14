import { Context, Plugin } from 'hedera-agent-kit';
import analyzeMultiLangEvidence from './tools/evidence/analyze-multilang-evidence';
import generateAIResolution from './tools/resolution/ai-market-resolution';
import evaluateDisputeQuality from './tools/disputes/evaluate-dispute-quality';
import executeMarketResolution from './tools/resolution/execute-market-resolution';
import calculateDisputeRewards from './tools/disputes/calculate-dispute-rewards';
import processMultiLanguageEvidence from './tools/evidence/process-multilang-evidence';

export const blockcastDisputePlugin: Plugin = {
  name: 'blockcast-dispute-resolution',
  version: '1.0.0',
  description: 'AI-powered dispute resolution for BlockCast truth verification markets with multi-language support and cultural context awareness',
  tools: (context: Context) => {
    return [
      analyzeMultiLangEvidence(context),
      generateAIResolution(context),
      evaluateDisputeQuality(context),
      processMultiLanguageEvidence(context),
      executeMarketResolution(context),
      calculateDisputeRewards(context)
    ];
  },
};

// Tool name constants for easy reference
export const blockcastDisputePluginToolNames = {
  ANALYZE_MULTILANG_EVIDENCE: 'analyze_multilang_evidence',
  GENERATE_AI_RESOLUTION: 'generate_ai_resolution',
  EVALUATE_DISPUTE_QUALITY: 'evaluate_dispute_quality',
  PROCESS_MULTILANG_EVIDENCE: 'process_multilang_evidence',
  EXECUTE_MARKET_RESOLUTION: 'execute_market_resolution',
  CALCULATE_DISPUTE_REWARDS: 'calculate_dispute_rewards',
} as const;

export default { blockcastDisputePlugin, blockcastDisputePluginToolNames };