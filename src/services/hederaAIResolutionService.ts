import { Client, PrivateKey, AccountId } from '@hashgraph/sdk';
import { blockcastDisputePlugin } from '../hedera-agent-plugins/blockcast-dispute-plugin';
import { Context, Tool } from 'hedera-agent-kit';

/**
 * Hedera AI Resolution Service
 *
 * Directly invokes Hedera Agent Kit plugin tools for market resolution.
 * Provides structured, reliable AI analysis using multi-language evidence processing
 * and external data verification on Hedera Consensus Service.
 */

interface EvidenceItem {
  source: string;
  type: string;
  content: string;
  timestamp: Date;
  credibility: number;
  language: string;
  submitter?: string;
}

interface HederaAIResolutionResult {
  recommendation: 'YES' | 'NO' | 'INVALID';
  confidence: number;
  reasoning: string;
  riskFactors: string[];
  evidenceAnalysis?: any;
  aiDecision?: any;
  metadata: {
    usedHederaAgent: boolean;
    toolsInvoked: string[];
    hcsSubmissions: string[];
    timestamp: string;
  };
}

export class HederaAIResolutionService {
  private client: Client;
  private tools: Tool[];
  private context: Context;

  constructor(
    accountId?: string,
    privateKey?: string,
    network: 'testnet' | 'mainnet' | 'previewnet' = 'testnet'
  ) {
    // Initialize Hedera client
    const hederaAccountId = accountId || process.env.HEDERA_ACCOUNT_ID || process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID || import.meta.env?.VITE_HEDERA_TESTNET_ACCOUNT_ID;
    const hederaPrivateKey = privateKey || process.env.HEDERA_PRIVATE_KEY || process.env.VITE_HEDERA_TESTNET_PRIVATE_KEY || import.meta.env?.VITE_HEDERA_TESTNET_PRIVATE_KEY;

    if (!hederaAccountId || !hederaPrivateKey) {
      console.warn('⚠️ Hedera credentials not found. Running in mock mode for testing.');
      console.warn('   Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable real Hedera operations.');
    }

    // Setup client based on network
    if (network === 'testnet') {
      this.client = Client.forTestnet();
    } else if (network === 'mainnet') {
      this.client = Client.forMainnet();
    } else {
      this.client = Client.forPreviewnet();
    }

    // Only set operator if credentials are available
    if (hederaAccountId && hederaPrivateKey) {
      try {
        this.client.setOperator(
          AccountId.fromString(hederaAccountId),
          PrivateKey.fromStringECDSA(hederaPrivateKey)
        );
      } catch (error) {
        console.warn('⚠️ Failed to set Hedera operator, running in mock mode:', error);
      }
    }

    // Initialize context for autonomous mode
    this.context = {
      mode: 'AUTONOMOUS' as any
    };

    // Load BlockCast dispute plugin tools
    this.tools = blockcastDisputePlugin.tools(this.context);

    console.log(`✅ Hedera AI Resolution Service initialized on ${network}`);
    console.log(`📦 Loaded ${this.tools.length} Hedera agent tools`);
  }

  /**
   * Resolve market using Hedera AI agent tools
   */
  async resolveMarket(
    marketId: string,
    evidence: EvidenceItem[],
    options: {
      region?: string;
      marketType?: string;
      complexity?: 'low' | 'medium' | 'high';
      culturalContext?: string;
    } = {}
  ): Promise<HederaAIResolutionResult> {
    const toolsInvoked: string[] = [];
    const hcsSubmissions: string[] = [];

    try {
      console.log(`🧠 Starting Hedera AI resolution for market ${marketId}...`);

      // Step 1: Process multi-language evidence
      console.log(`📚 Step 1: Processing multi-language evidence (${evidence.length} items)...`);
      const processEvidenceTool = this.findTool('process_multilang_evidence');

      const processedEvidence = await processEvidenceTool.execute(
        this.client,
        this.context,
        {
          marketId,
          evidenceSubmissions: evidence.map((e, idx) => ({
            submissionId: `submission-${marketId}-${idx}`,
            submitterAddress: e.submitter || 'unknown',
            language: e.language || 'en',
            content: e.content,
            sources: [e.source || 'unknown'],
            timestamp: e.timestamp.toISOString(),
            ipfsHash: `ipfs-${e.timestamp.getTime()}`,
            metadata: {
              type: e.type,
              credibility: e.credibility
            }
          })),
          targetLanguages: ['en', 'fr', 'sw', 'ar'],
          processingMode: 'REAL_TIME' as any,
          culturalContext: {
            region: options.region || 'general',
            country: options.culturalContext || 'general_african'
          }
        }
      );

      toolsInvoked.push('process_multilang_evidence');
      if (processedEvidence.hcsTransactionId) {
        hcsSubmissions.push(processedEvidence.hcsTransactionId);
      }

      console.log(`✅ Evidence processed across ${processedEvidence.languagesProcessed?.length || 0} languages`);

      // Step 2: Analyze multi-language evidence
      console.log(`🔍 Step 2: Analyzing multi-language evidence...`);
      const analyzeEvidenceTool = this.findTool('analyze_multilang_evidence');

      const evidenceTopics = [
        process.env.HCS_EVIDENCE_TOPIC || '0.0.6701034',
        process.env.HCS_AI_ATTESTATIONS_TOPIC || '0.0.6701057'
      ];

      const evidenceAnalysis = await analyzeEvidenceTool.execute(
        this.client,
        this.context,
        {
          marketId,
          evidenceTopics, // Must be array, not object
          languages: ['en', 'fr', 'sw', 'ar'],
          timeWindowStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          timeWindowEnd: new Date().toISOString(),
          culturalContext: options.culturalContext || options.region || 'general_african_context'
        }
      );

      toolsInvoked.push('analyze_multilang_evidence');
      if (evidenceAnalysis.hcsTransactionId) {
        hcsSubmissions.push(evidenceAnalysis.hcsTransactionId);
      }

      console.log(`✅ Evidence analysis complete: ${evidenceAnalysis.synthesis?.recommendedOutcome || 'pending'} (confidence: ${evidenceAnalysis.synthesis?.confidenceScore || 0})`);

      // Step 3: Generate AI resolution with external data verification
      console.log(`🤖 Step 3: Generating AI resolution with external data verification...`);
      const generateResolutionTool = this.findTool('generate_ai_resolution');

      // Ensure evidence analysis has proper structure with all required fields
      const analysisResults = evidenceAnalysis.analysisResults || evidence.map((e, idx) => ({
        language: e.language || 'en',
        evidenceCount: 1,
        credibilityScore: e.credibility || 0.5,
        sentiment: 'neutral',
        supportingEvidence: [e.content],
        opposingEvidence: []
      }));

      // Build robust synthesis object with all required fields
      // The AI resolution tool expects both top-level fields AND nested synthesis
      const synthesis = {
        recommendedOutcome: evidenceAnalysis.synthesis?.recommendedOutcome || this.inferOutcomeFromEvidence(evidence),
        confidenceScore: evidenceAnalysis.synthesis?.confidenceScore || 0.5,
        analysisResults: analysisResults, // Always an array
        contradictions: evidenceAnalysis.synthesis?.contradictions || evidenceAnalysis.contradictions || [],
        culturalFactors: evidenceAnalysis.synthesis?.culturalFactors || evidenceAnalysis.culturalFactors || [],
        languageCoverage: analysisResults.length,
        // Add nested synthesis for tool compatibility
        synthesis: {
          contradictions: evidenceAnalysis.synthesis?.contradictions || evidenceAnalysis.contradictions || [],
          recommendedOutcome: evidenceAnalysis.synthesis?.recommendedOutcome || this.inferOutcomeFromEvidence(evidence),
          confidenceScore: evidenceAnalysis.synthesis?.confidenceScore || 0.5
        }
      };

      // Ensure analysisResults is definitely an array before passing
      if (!Array.isArray(synthesis.analysisResults)) {
        synthesis.analysisResults = [];
      }

      const aiDecision = await generateResolutionTool.execute(
        this.client,
        this.context,
        {
          marketId,
          evidenceAnalysis: synthesis,
          region: options.region || 'general',
          marketType: options.marketType || 'general',
          marketComplexity: options.complexity || 'medium',
          externalDataSources: [
            'newsapi',
            'government_sources',
            'social_media_sentiment'
          ]
        }
      );

      toolsInvoked.push('generate_ai_resolution');
      if (aiDecision.metadata?.hcsSubmission?.submitted) {
        hcsSubmissions.push(aiDecision.metadata.hcsSubmission.transactionId || 'hcs-submitted');
      }

      console.log(`✅ AI decision generated: ${aiDecision.primaryOutcome} (confidence: ${aiDecision.confidence})`);

      // Step 4: Map to standardized result format
      const recommendation = this.mapToStandardOutcome(aiDecision.primaryOutcome);
      const confidence = aiDecision.confidence || 0.5;
      const reasoning = aiDecision.reasoning || 'AI analysis completed via Hedera agent tools';
      const riskFactors = aiDecision.riskFactors || [];

      const result: HederaAIResolutionResult = {
        recommendation,
        confidence,
        reasoning,
        riskFactors,
        evidenceAnalysis,
        aiDecision,
        metadata: {
          usedHederaAgent: true,
          toolsInvoked,
          hcsSubmissions,
          timestamp: new Date().toISOString()
        }
      };

      console.log(`🎯 Hedera AI resolution complete for ${marketId}:`, {
        recommendation: result.recommendation,
        confidence: result.confidence,
        toolsInvoked: toolsInvoked.length,
        hcsSubmissions: hcsSubmissions.length
      });

      return result;

    } catch (error) {
      console.error(`❌ Hedera AI resolution failed for ${marketId}:`, error);

      // Fallback to basic evidence analysis
      const fallbackRecommendation = this.inferOutcomeFromEvidence(evidence);
      const fallbackConfidence = 0.3;

      return {
        recommendation: fallbackRecommendation,
        confidence: fallbackConfidence,
        reasoning: `Hedera AI agent tools failed. Fallback analysis based on ${evidence.length} evidence items. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        riskFactors: ['HEDERA_AGENT_FAILURE', 'FALLBACK_ANALYSIS'],
        metadata: {
          usedHederaAgent: false,
          toolsInvoked,
          hcsSubmissions,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Evaluate dispute quality using Hedera AI agent
   */
  async evaluateDispute(
    disputeId: string,
    marketId: string,
    disputeData: {
      disputerAddress: string;
      ipfsHash: string;
      language: string;
      bondAmount: number;
      aiResolution: {
        primaryOutcome: string;
        confidence: number;
        reasoning: string;
      };
      marketCloseTime: string;
    }
  ): Promise<any> {
    try {
      console.log(`⚖️ Evaluating dispute ${disputeId} for market ${marketId}...`);

      const evaluateDisputeTool = this.findTool('evaluate_dispute_quality');

      // Ensure AI resolution has proper structure
      const aiResolution = {
        primaryOutcome: disputeData.aiResolution?.primaryOutcome || 'UNKNOWN',
        confidence: disputeData.aiResolution?.confidence || 0.5,
        reasoning: disputeData.aiResolution?.reasoning || 'No reasoning provided',
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      const disputeQuality = await evaluateDisputeTool.execute(
        this.client,
        this.context,
        {
          disputeId,
          marketId,
          disputerAddress: disputeData.disputerAddress,
          disputeEvidence: {
            ipfsHash: disputeData.ipfsHash,
            language: disputeData.language,
            timestamp: new Date().toISOString(),
            description: `Dispute evidence from IPFS ${disputeData.ipfsHash}`,
            files: [],
            sources: []
          },
          originalAIResolution: aiResolution,
          marketCloseTime: disputeData.marketCloseTime,
          bondAmount: disputeData.bondAmount
        }
      );

      console.log(`✅ Dispute quality evaluated: ${disputeQuality.qualityScore || 0} score, ${disputeQuality.recommendedValidity || 'UNCERTAIN'} validity`);

      return disputeQuality;

    } catch (error) {
      console.error(`❌ Dispute evaluation failed for ${disputeId}:`, error);
      return {
        qualityScore: 0.5,
        recommendedValidity: 'UNCERTAIN',
        error: error instanceof Error ? error.message : 'Dispute evaluation failed'
      };
    }
  }

  /**
   * Calculate dispute rewards
   */
  async calculateDisputeRewards(
    marketId: string,
    disputes: Array<{
      disputeId: string;
      disputerAddress: string;
      bondAmount: number;
      validity: 'VALID' | 'INVALID' | 'UNCERTAIN';
    }>,
    finalOutcome: string
  ): Promise<any> {
    try {
      console.log(`💰 Calculating dispute rewards for ${disputes.length} disputes...`);

      const calculateRewardsTool = this.findTool('calculate_dispute_rewards');

      const rewardDistribution = await calculateRewardsTool.execute(
        this.client,
        this.context,
        {
          marketId,
          disputes: disputes.map(d => ({
            disputeId: d.disputeId,
            disputerAddress: d.disputerAddress,
            bondAmount: d.bondAmount,
            disputeValidity: d.validity,
            qualityScore: d.validity === 'VALID' ? 0.9 : d.validity === 'INVALID' ? 0.1 : 0.5
          })),
          finalMarketOutcome: finalOutcome,
          bondTokenId: process.env.DISPUTE_BOND_TOKEN_ID || '0.0.123456'
        }
      );

      console.log(`✅ Reward distribution calculated: ${rewardDistribution.distributions?.length || 0} transactions`);

      return rewardDistribution;

    } catch (error) {
      console.error(`❌ Reward calculation failed for ${marketId}:`, error);
      return {
        distributions: [],
        error: error instanceof Error ? error.message : 'Reward calculation failed'
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: true,
      network: this.client.network.toString(),
      operatorId: this.client.operatorAccountId?.toString(),
      toolsAvailable: this.tools.map(t => ({
        method: t.method,
        name: t.name
      })),
      capabilities: [
        'Multi-language evidence processing',
        'Cross-language evidence analysis',
        'AI-driven market resolution with external data',
        'Real-time dispute quality evaluation',
        'Automated dispute reward calculation',
        'HCS attestation and audit trails'
      ]
    };
  }

  /**
   * Helper: Find tool by method name
   */
  private findTool(methodName: string): Tool {
    const tool = this.tools.find(t => t.method === methodName);
    if (!tool) {
      throw new Error(`Tool not found: ${methodName}. Available tools: ${this.tools.map(t => t.method).join(', ')}`);
    }
    return tool;
  }

  /**
   * Helper: Infer outcome from evidence (fallback)
   */
  private inferOutcomeFromEvidence(evidence: EvidenceItem[]): 'YES' | 'NO' | 'INVALID' {
    const yesEvidence = evidence.filter(e =>
      e.content.toLowerCase().includes('yes') ||
      e.content.toLowerCase().includes('true') ||
      e.content.toLowerCase().includes('confirm')
    ).length;

    const noEvidence = evidence.filter(e =>
      e.content.toLowerCase().includes('no') ||
      e.content.toLowerCase().includes('false') ||
      e.content.toLowerCase().includes('deny')
    ).length;

    if (yesEvidence > noEvidence) return 'YES';
    if (noEvidence > yesEvidence) return 'NO';
    return 'INVALID';
  }

  /**
   * Helper: Map AI outcome to standard format
   */
  private mapToStandardOutcome(outcome: string): 'YES' | 'NO' | 'INVALID' {
    const normalized = outcome.toUpperCase();
    if (normalized === 'YES' || normalized === 'TRUE') return 'YES';
    if (normalized === 'NO' || normalized === 'FALSE') return 'NO';
    return 'INVALID';
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.client) {
      this.client.close();
    }
    console.log('🧹 Hedera AI Resolution Service cleaned up');
  }
}

// Export singleton factory
let hederaAIInstance: HederaAIResolutionService | null = null;

export const getHederaAIResolutionService = (
  accountId?: string,
  privateKey?: string,
  network?: 'testnet' | 'mainnet' | 'previewnet'
): HederaAIResolutionService => {
  if (!hederaAIInstance) {
    hederaAIInstance = new HederaAIResolutionService(accountId, privateKey, network);
  }
  return hederaAIInstance;
};
