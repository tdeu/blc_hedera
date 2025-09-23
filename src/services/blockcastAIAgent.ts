import { HederaLangchainToolkit, AgentMode, Context } from 'hedera-agent-kit';
import { coreConsensusPlugin, coreTokenPlugin, coreAccountPlugin, coreQueriesPlugin } from 'hedera-agent-kit';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { BufferMemory } from 'langchain/memory';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { blockcastDisputePlugin } from '../hedera-agent-plugins/blockcast-dispute-plugin';
import { resolutionService } from '../utils/resolutionService';
import { adminService } from '../utils/adminService';
import { hederaResolutionService } from '../utils/hederaResolutionService';
import { AI_RESOLUTION } from '../config/constants';

// AI Agent Configuration interface
interface BlockCastAIConfig {
  aiProvider?: 'openai' | 'anthropic' | 'auto';
  model?: string;
  mode?: AgentMode;
  hederaAccountId?: string;
  hederaPrivateKey?: string;
  customPrompts?: {
    system?: string;
    marketResolution?: string;
    disputeAnalysis?: string;
  };
}

// Market resolution request interface
interface MarketResolutionRequest {
  marketId: string;
  region?: string;
  languages?: string[];
  evidenceTopics?: string[];
  culturalContext?: string;
  marketType?: string;
  complexity?: 'low' | 'medium' | 'high';
  timeWindowStart?: string;
  timeWindowEnd?: string;
}

// Dispute processing request interface
interface DisputeProcessingRequest {
  disputeId: string;
  marketId: string;
  disputerAddress: string;
  ipfsHash: string;
  language: string;
  aiResolution: {
    primaryOutcome: string;
    confidence: number;
    reasoning: string;
  };
  marketCloseTime: string;
  bondAmount: number;
}

// Admin recommendation request interface
interface AdminRecommendationRequest {
  marketId: string;
  aiResolution: any;
  disputes: any[];
  evidenceAnalysis: any;
  culturalContext?: string;
}

class BlockCastAIAgent {
  private client: Client;
  private agentExecutor: AgentExecutor | null = null;
  private config: BlockCastAIConfig;
  private isInitialized = false;

  constructor(config: BlockCastAIConfig = {}) {
    this.config = {
      aiProvider: 'auto',
      model: undefined,
      mode: AgentMode.AUTONOMOUS,
      ...config
    };

    // Initialize Hedera client
    const accountId = this.config.hederaAccountId || process.env.HEDERA_ACCOUNT_ID || process.env.VITE_HEDERA_TESTNET_ACCOUNT_ID;
    const privateKey = this.config.hederaPrivateKey || process.env.HEDERA_PRIVATE_KEY || process.env.VITE_HEDERA_TESTNET_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      throw new Error('Hedera credentials not found. Please set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables.');
    }

    this.client = Client.forTestnet().setOperator(
      accountId,
      PrivateKey.fromStringECDSA(privateKey)
    );
  }

  /**
   * Initialize the AI Agent with LangChain and Hedera toolkit
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('BlockCast AI Agent already initialized');
      return;
    }

    try {
      console.log('Initializing BlockCast AI Agent...');

      // 1. Initialize AI model
      const llm = this.createLLM();

      // 2. Setup Hedera Agent Toolkit with BlockCast plugin
      const hederaAgentToolkit = new HederaLangchainToolkit({
        client: this.client,
        configuration: {
          context: { mode: this.config.mode },
          plugins: [
            coreConsensusPlugin,    // HCS operations
            coreTokenPlugin,        // HTS operations  
            coreQueriesPlugin,      // Hedera queries
            coreAccountPlugin,      // Account operations
            blockcastDisputePlugin  // Our custom BlockCast plugin
          ]
        }
      });

      // 3. Create specialized AI agent with BlockCast prompts
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', this.getSystemPrompt()],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}']
      ]);

      // 4. Create agent and executor
      const agent = createToolCallingAgent({
        llm,
        tools: hederaAgentToolkit.getTools(),
        prompt
      });

      // 5. Setup memory for conversation context
      const memory = new BufferMemory({
        memoryKey: 'chat_history',
        inputKey: 'input',
        outputKey: 'output',
        returnMessages: true,
      });

      this.agentExecutor = new AgentExecutor({
        agent,
        tools: hederaAgentToolkit.getTools(),
        memory,
        returnIntermediateSteps: false,
        maxIterations: 10,
        verbose: process.env.NODE_ENV === 'development'
      });

      this.isInitialized = true;
      console.log('BlockCast AI Agent initialized successfully');

    } catch (error) {
      console.error('Failed to initialize BlockCast AI Agent:', error);
      throw new Error(`AI Agent initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create appropriate LLM based on configuration and available API keys
   */
  private createLLM() {
    if (this.config.aiProvider === 'openai' || (this.config.aiProvider === 'auto' && process.env.OPENAI_API_KEY)) {
      return new ChatOpenAI({ 
        model: this.config.model || 'gpt-4o-mini',
        temperature: 0.1 // Low temperature for consistent, factual responses
      });
    }
    
    if (this.config.aiProvider === 'anthropic' || (this.config.aiProvider === 'auto' && process.env.ANTHROPIC_API_KEY)) {
      return new ChatAnthropic({ 
        model: this.config.model || 'claude-3-haiku-20240307',
        temperature: 0.1
      });
    }

    throw new Error('No AI provider configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variables.');
  }

  /**
   * Get system prompt for BlockCast AI Agent
   */
  private getSystemPrompt(): string {
    return this.config.customPrompts?.system || `
You are BlockCast AI, an expert in African truth verification and dispute resolution for prediction markets.

Your core capabilities include:
- Analyzing evidence in multiple African languages (English, French, Swahili, Arabic)
- Understanding cultural and regional context across Africa
- Evaluating dispute quality with sophisticated multi-dimensional analysis
- Executing blockchain operations on Hedera (HCS, HTS, smart contracts)
- Making fair, transparent decisions with explainable reasoning

Key principles:
- ACCURACY: Always prioritize truth and factual accuracy
- TRANSPARENCY: Provide clear reasoning for all decisions  
- FAIRNESS: Consider all evidence equally, regardless of source language
- CULTURAL SENSITIVITY: Understand African regional and cultural contexts
- BLOCKCHAIN INTEGRITY: Ensure all operations are properly recorded on Hedera

When analyzing markets:
1. Process evidence across all relevant African languages
2. Consider regional political, cultural, and social contexts
3. Cross-reference with authoritative sources (government, established media)
4. Weight evidence based on source credibility and temporal relevance
5. Identify contradictions and areas requiring human judgment
6. Generate confidence scores with detailed reasoning
7. Submit all decisions to HCS for audit transparency

For disputes:
1. Evaluate evidence quality across multiple dimensions
2. Consider disputer reputation and historical accuracy
3. Check temporal relevance (evidence must predate market closure)
4. Assess contradiction strength against original AI resolution
5. Recommend appropriate rewards or slashing actions
6. Flag culturally sensitive content for human review

Always maintain the highest standards of truth verification while respecting the diverse cultures and languages of Africa.
`;
  }

  /**
   * Process comprehensive market resolution with multi-language analysis
   */
  async resolveMarket(request: MarketResolutionRequest): Promise<any> {
    await this.ensureInitialized();

    const input = `
Market ${request.marketId} has expired and requires comprehensive resolution analysis.

Please perform the following workflow:

1. **Multi-Language Evidence Analysis**:
   - Analyze evidence from HCS topics: ${request.evidenceTopics?.join(', ') || 'default evidence topics'}
   - Process evidence in languages: ${request.languages?.join(', ') || 'English, French, Swahili, Arabic'}
   - Apply cultural context for: ${request.culturalContext || request.region || 'general African context'}
   - Time window: ${request.timeWindowStart || 'market start'} to ${request.timeWindowEnd || 'market close'}

2. **AI Resolution Generation**:
   - Cross-reference with external data sources for ${request.region || 'African region'}
   - Consider market type: ${request.marketType || 'general'}
   - Apply complexity level: ${request.complexity || 'medium'}
   - Generate explainable reasoning and confidence scoring

3. **Resolution Decision**:
   - If confidence >90% and complexity is low: Execute autonomous resolution
   - If confidence 70-90%: Prepare detailed analysis for admin review
   - If confidence <70% or cultural sensitivity detected: Flag for extended review
   - If disputes are present: Include dispute analysis in recommendation

4. **Blockchain Recording**:
   - Submit AI decision to HCS AI Attestations topic for transparency
   - Update market status in database if resolution is executed
   - Provide complete audit trail

Market Details:
- Market ID: ${request.marketId}
- Region: ${request.region || 'Not specified'}
- Languages: ${request.languages?.join(', ') || 'English, French, Swahili, Arabic'}
- Type: ${request.marketType || 'General'}
- Complexity: ${request.complexity || 'Medium'}

Please provide comprehensive analysis with recommendations.
`;

    try {
      console.log(`Processing market resolution for ${request.marketId}...`);
      const response = await this.agentExecutor!.invoke({ input });
      
      console.log(`Market resolution completed for ${request.marketId}`);
      return {
        success: true,
        marketId: request.marketId,
        aiResponse: response.output || response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Market resolution failed for ${request.marketId}:`, error);
      return {
        success: false,
        marketId: request.marketId,
        error: error instanceof Error ? error.message : 'Market resolution failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process real-time dispute quality assessment
   */
  async processDispute(request: DisputeProcessingRequest): Promise<any> {
    await this.ensureInitialized();

    const input = `
A new dispute has been submitted for market ${request.marketId} and requires immediate quality assessment.

Please perform the following analysis:

1. **Evidence Quality Evaluation**:
   - Fetch dispute evidence from IPFS: ${request.ipfsHash}
   - Evaluate source credibility and authenticity for ${request.language} language content
   - Check temporal relevance against market close time: ${request.marketCloseTime}
   - Assess evidence strength and document quality

2. **Contradiction Analysis**:
   - Compare against original AI resolution:
     * Outcome: ${request.aiResolution.primaryOutcome}
     * Confidence: ${request.aiResolution.confidence}
     * Reasoning: ${request.aiResolution.reasoning}
   - Evaluate strength of contradiction and evidence quality

3. **Disputer Assessment**:
   - Analyze reputation of disputer: ${request.disputerAddress}
   - Consider bond amount: ${request.bondAmount} CAST tokens
   - Review historical dispute performance

4. **Real-time Recommendation**:
   - Generate quality score (0-1) with detailed breakdown
   - Recommend validity: LIKELY_VALID | UNCERTAIN | LIKELY_INVALID  
   - Set admin priority: HIGH | MEDIUM | LOW
   - Suggest bond action: RETURN_WITH_REWARD | RETURN_ONLY | SLASH

5. **HCS Recording**:
   - Submit quality analysis to HCS disputes topic
   - Update real-time confidence scoring if dispute is high quality
   - Flag for immediate admin attention if quality >0.85

Dispute Details:
- Dispute ID: ${request.disputeId}
- Market: ${request.marketId}
- Disputer: ${request.disputerAddress}
- Bond: ${request.bondAmount} CAST
- Language: ${request.language}
- Evidence: ${request.ipfsHash}

Please provide immediate quality assessment and recommendations.
`;

    try {
      console.log(`Processing dispute quality assessment for ${request.disputeId}...`);
      const response = await this.agentExecutor!.invoke({ input });
      
      console.log(`Dispute assessment completed for ${request.disputeId}`);
      return {
        success: true,
        disputeId: request.disputeId,
        marketId: request.marketId,
        aiResponse: response.output || response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Dispute processing failed for ${request.disputeId}:`, error);
      return {
        success: false,
        disputeId: request.disputeId,
        marketId: request.marketId,
        error: error instanceof Error ? error.message : 'Dispute processing failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate comprehensive admin recommendations
   */
  async generateAdminRecommendations(request: AdminRecommendationRequest): Promise<any> {
    await this.ensureInitialized();

    const input = `
Generate comprehensive admin recommendations for market ${request.marketId} resolution.

Please analyze the complete situation and provide admin guidance:

1. **Evidence Review**:
   - Review all HCS evidence submissions and multi-language analysis
   - Evaluate AI resolution confidence and cultural considerations
   - Assess any regional or cultural factors requiring human judgment

2. **Dispute Analysis**:
   - Analyze all ${request.disputes.length} disputes submitted
   - Evaluate each dispute's validity and evidence strength  
   - Calculate potential reward/slashing distributions
   - Identify high-quality disputes that may change the outcome

3. **Cultural Context Assessment**:
   - Consider regional context: ${request.culturalContext || 'Not specified'}
   - Identify any cultural nuances that AI may have missed
   - Flag sensitive content requiring local expertise
   - Recommend if additional regional consultation is needed

4. **Financial Impact Analysis**:
   - Calculate gas costs for resolution execution
   - Estimate total rewards to be distributed
   - Project impact on protocol treasury
   - Assess economic incentives alignment

5. **Final Recommendations**:
   - Primary recommendation: CONFIRM_AI | OVERRIDE_TO_YES | OVERRIDE_TO_NO | REQUEST_MORE_TIME
   - Provide clear justification for recommendation
   - List any conditions or considerations for admin decision
   - Estimate confidence level in recommendation (0-100%)

6. **Execution Planning**:
   - If override recommended, provide detailed reasoning
   - Generate reward distribution plan for all disputes
   - Identify any risks or edge cases to consider
   - Provide transaction sequence for resolution execution

Current Situation:
- Market: ${request.marketId}
- AI Resolution: ${JSON.stringify(request.aiResolution, null, 2)}
- Disputes Count: ${request.disputes.length}
- Evidence Analysis: Available
- Cultural Context: ${request.culturalContext || 'Standard African context'}

Please provide comprehensive analysis for admin decision-making.
`;

    try {
      console.log(`Generating admin recommendations for market ${request.marketId}...`);
      const response = await this.agentExecutor!.invoke({ input });
      
      console.log(`Admin recommendations generated for ${request.marketId}`);
      return {
        success: true,
        marketId: request.marketId,
        recommendations: response.output || response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Admin recommendation generation failed for ${request.marketId}:`, error);
      return {
        success: false,
        marketId: request.marketId,
        error: error instanceof Error ? error.message : 'Admin recommendation generation failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute autonomous market resolution (high-confidence cases)
   */
  async executeAutonomousResolution(marketId: string, outcome: 'YES' | 'NO' | 'INVALID', confidence: number, disputes: any[] = [], adminAddress?: string): Promise<any> {
    await this.ensureInitialized();

    // Validate confidence threshold
    if (confidence < AI_RESOLUTION.AUTO_EXECUTE_THRESHOLD) {
      throw new Error(`Autonomous resolution requires confidence >${AI_RESOLUTION.AUTO_EXECUTE_THRESHOLD * 100}%`);
    }

    const executionStartTime = Date.now();
    console.log(`🤖 Starting autonomous resolution for market ${marketId} with ${(confidence * 100).toFixed(1)}% confidence...`);

    try {
      // Step 1: Validate market status and permissions
      console.log('📋 Validating market status and AI permissions...');
      const market = await this.getMarketForResolution(marketId);
      if (!market) {
        throw new Error(`Market ${marketId} not found or not eligible for resolution`);
      }

      // Step 2: Record AI decision to HCS for transparency
      console.log('📝 Recording AI decision to HCS...');
      const hcsTransactionId = await this.recordAIDecisionToHCS(marketId, outcome, confidence, disputes);

      // Step 3: Execute smart contract resolution
      console.log('⚡ Executing smart contract resolution...');
      let resolutionResult;

      if (adminAddress) {
        // Use admin-driven resolution with AI recommendation
        resolutionResult = await resolutionService.finalResolveMarket(
          marketId,
          outcome.toLowerCase() as 'yes' | 'no',
          Math.round(confidence * 100), // Convert to percentage
          adminAddress
        );
      } else {
        // Direct AI resolution (if contracts support it)
        resolutionResult = await this.executeContractResolution(marketId, outcome, confidence);
      }

      // Step 4: Update database status
      console.log('💾 Updating market status in database...');
      await this.updateMarketStatus(marketId, 'resolved', {
        outcome: outcome.toLowerCase(),
        confidence: confidence,
        resolvedBy: 'ai_autonomous',
        aiTransactionId: resolutionResult.transactionId,
        hcsTransactionId,
        executionTime: Date.now() - executionStartTime
      });

      // Step 5: Process disputes if any
      if (disputes.length > 0) {
        console.log(`⚖️ Processing ${disputes.length} disputes...`);
        await this.processDisputeResolutions(disputes, outcome, confidence);
      }

      // Step 6: Generate comprehensive audit log
      const auditLog = {
        marketId,
        outcome,
        confidence,
        disputesProcessed: disputes.length,
        executionTimeMs: Date.now() - executionStartTime,
        transactions: {
          hcs: hcsTransactionId,
          resolution: resolutionResult.transactionId
        },
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Autonomous resolution completed for market ${marketId} in ${Date.now() - executionStartTime}ms`);

      return {
        success: true,
        marketId,
        outcome,
        confidence,
        disputesProcessed: disputes.length,
        transactions: auditLog.transactions,
        executionDetails: auditLog,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Autonomous resolution failed for ${marketId}:`, error);

      // Record failure to HCS for transparency
      try {
        await hederaResolutionService.submitAIError(marketId, {
          error: error instanceof Error ? error.message : 'Unknown error',
          attempted: 'autonomous_resolution',
          confidence,
          timestamp: new Date().toISOString()
        });
      } catch (hcsError) {
        console.warn('Failed to record error to HCS:', hcsError);
      }

      return {
        success: false,
        marketId,
        outcome,
        confidence,
        error: error instanceof Error ? error.message : 'Autonomous resolution failed',
        executionTimeMs: Date.now() - executionStartTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute AI recommendation workflow (for lower confidence decisions)
   */
  async executeAIRecommendation(marketId: string, outcome: 'YES' | 'NO' | 'INVALID', confidence: number, reasoning: string, adminAddress: string): Promise<any> {
    await this.ensureInitialized();

    console.log(`💡 Generating AI recommendation for market ${marketId} with ${(confidence * 100).toFixed(1)}% confidence...`);

    try {
      // Record AI recommendation to HCS
      const hcsTransactionId = await hederaResolutionService.submitAIRecommendation(marketId, {
        recommendedOutcome: outcome,
        confidence,
        reasoning,
        requiresHumanReview: confidence < AI_RESOLUTION.HIGH_CONFIDENCE_THRESHOLD,
        timestamp: new Date().toISOString()
      });

      // Store recommendation in database for admin review
      await adminService.flagForReview(marketId, {
        aiRecommendation: outcome.toLowerCase(),
        confidence,
        reasoning,
        hcsTransactionId,
        flaggedAt: new Date().toISOString(),
        reviewPriority: this.calculateReviewPriority(confidence),
        adminAddress
      });

      console.log(`📋 AI recommendation stored for admin review: ${marketId}`);

      return {
        success: true,
        marketId,
        recommendedOutcome: outcome,
        confidence,
        reasoning,
        hcsTransactionId,
        status: 'pending_admin_review',
        reviewPriority: this.calculateReviewPriority(confidence),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`AI recommendation failed for ${marketId}:`, error);
      return {
        success: false,
        marketId,
        error: error instanceof Error ? error.message : 'AI recommendation failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ==================
  // Helper Methods
  // ==================

  private async getMarketForResolution(marketId: string): Promise<any> {
    // This would integrate with your market service
    // For now, return a mock market
    return {
      id: marketId,
      status: 'active',
      endTime: new Date(Date.now() - 60000), // Ended 1 minute ago
      canResolve: true
    };
  }

  private async recordAIDecisionToHCS(marketId: string, outcome: string, confidence: number, disputes: any[]): Promise<string> {
    return await hederaResolutionService.submitAIRecommendation(marketId, {
      aiDecision: outcome,
      confidence,
      disputeCount: disputes.length,
      executionType: 'autonomous',
      timestamp: new Date().toISOString()
    });
  }

  private async executeContractResolution(marketId: string, outcome: string, confidence: number): Promise<{ transactionId: string }> {
    // This would integrate with your contract service
    // For now, simulate contract execution
    console.log(`📝 Simulating contract resolution: ${marketId} -> ${outcome} (${confidence})`);

    return {
      transactionId: `ai-tx-${marketId}-${Date.now()}`
    };
  }

  private async updateMarketStatus(marketId: string, status: string, data: any): Promise<void> {
    // This would update the market in your database
    console.log(`💾 Updating market ${marketId} status to ${status}:`, data);
  }

  private async processDisputeResolutions(disputes: any[], outcome: string, confidence: number): Promise<void> {
    for (const dispute of disputes) {
      try {
        // Determine if dispute was valid based on AI outcome
        const disputeValid = this.evaluateDisputeValidity(dispute, outcome);

        console.log(`⚖️ Processing dispute ${dispute.id}: ${disputeValid ? 'VALID' : 'INVALID'}`);

        // This would integrate with dispute resolution service
        // await disputeBondService.refundDisputeBond(dispute.bondId, disputeValid ? 'full_refund' : 'slashed');

      } catch (error) {
        console.warn(`Failed to process dispute ${dispute.id}:`, error);
      }
    }
  }

  private evaluateDisputeValidity(dispute: any, finalOutcome: string): boolean {
    // Simple logic: if dispute outcome matches final outcome, dispute was valid
    return dispute.proposedOutcome?.toLowerCase() === finalOutcome.toLowerCase();
  }

  private calculateReviewPriority(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (confidence < AI_RESOLUTION.MEDIUM_CONFIDENCE_THRESHOLD) {
      return 'HIGH';
    } else if (confidence < AI_RESOLUTION.HIGH_CONFIDENCE_THRESHOLD) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Get agent status and health information
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      config: {
        aiProvider: this.config.aiProvider,
        model: this.config.model,
        mode: this.config.mode
      },
      hederaClient: {
        network: this.client.network.toString(),
        operatorId: this.client.operatorAccountId?.toString(),
      },
      capabilities: [
        'Multi-language evidence analysis (English, French, Swahili, Arabic)',
        'Cultural context understanding for African markets',
        'Real-time dispute quality assessment',
        'Autonomous high-confidence resolution execution',
        'Comprehensive admin recommendation generation',
        'Blockchain operations on Hedera (HCS, HTS, Smart Contracts)'
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Ensure agent is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.client) {
      this.client.close();
    }
    this.isInitialized = false;
    console.log('BlockCast AI Agent cleaned up');
  }
}

// Export singleton instance
let blockcastAIInstance: BlockCastAIAgent | null = null;

export const getBlockCastAIAgent = (config?: BlockCastAIConfig): BlockCastAIAgent => {
  if (!blockcastAIInstance) {
    blockcastAIInstance = new BlockCastAIAgent(config);
  }
  return blockcastAIInstance;
};

export { BlockCastAIAgent };
export type { BlockCastAIConfig, MarketResolutionRequest, DisputeProcessingRequest, AdminRecommendationRequest };