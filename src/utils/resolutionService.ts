import { supabase, MarketResolution, ApprovedMarket, APIIntegrationLog } from './supabase';
import { hederaResolutionService } from './hederaResolutionService';

interface APISource {
  name: string;
  baseUrl: string;
  rateLimitPerHour: number;
  reliability: number;
}

interface ResolutionData {
  outcome: 'yes' | 'no';
  confidence: 'high' | 'medium' | 'low';
  source: string;
  apiData: any;
  reasoning?: string;
}

interface ScheduledResolution {
  marketId: string;
  resolveAt: Date;
  sources: string[];
  retryCount: number;
}

export class ResolutionService {
  private scheduledResolutions: Map<string, ScheduledResolution> = new Map();
  private apiSources: Record<string, APISource> = {
    flashscore: {
      name: 'Flashscore',
      baseUrl: 'https://flashscore-api.com',
      rateLimitPerHour: 1000,
      reliability: 0.95
    },
    sportradar: {
      name: 'SportRadar',
      baseUrl: 'https://api.sportradar.com',
      rateLimitPerHour: 500,
      reliability: 0.98
    },
    newsapi: {
      name: 'NewsAPI',
      baseUrl: 'https://newsapi.org/v2',
      rateLimitPerHour: 1000,
      reliability: 0.85
    }
  };

  constructor() {
    // Start the resolution scheduler
    this.startResolutionScheduler();
  }

  // API Integration Methods
  async fetchResolutionFromAPI(marketId: string, apiSource: string): Promise<ResolutionData> {
    const startTime = Date.now();
    let apiData: any = null;
    let success = false;
    let errorMessage: string | undefined;

    try {
      // Get market details to determine what to query
      const market = await this.getMarketById(marketId);
      if (!market) {
        throw new Error(`Market ${marketId} not found`);
      }

      // Route to appropriate API based on market category and source
      switch (apiSource) {
        case 'flashscore':
          apiData = await this.fetchFlashscoreData(market);
          break;
        case 'sportradar':
          apiData = await this.fetchSportRadarData(market);
          break;
        case 'newsapi':
          apiData = await this.fetchNewsAPIData(market);
          break;
        default:
          throw new Error(`Unknown API source: ${apiSource}`);
      }

      success = true;
      const resolution = this.parseAPIResponse(apiData, apiSource, market);
      
      // Log successful API call
      await this.logAPICall(marketId, apiSource, market, apiData, success, undefined, Date.now() - startTime);
      
      return resolution;

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`API fetch failed for ${apiSource}:`, error);
      
      // Log failed API call
      await this.logAPICall(marketId, apiSource, null, null, success, errorMessage, Date.now() - startTime);
      
      throw error;
    }
  }

  private async fetchFlashscoreData(market: ApprovedMarket): Promise<any> {
    // Mock implementation for Flashscore API
    // In real implementation, this would make actual API calls
    if (market.category.toLowerCase() === 'football' || market.category.toLowerCase() === 'sports') {
      // Simulate API response for football match
      return {
        matchId: 'match_123',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 2,
        awayScore: 1,
        status: 'finished',
        startTime: '2024-01-15T15:00:00Z',
        endTime: '2024-01-15T16:50:00Z'
      };
    }
    throw new Error('Market category not supported by Flashscore');
  }

  private async fetchSportRadarData(market: ApprovedMarket): Promise<any> {
    // Mock implementation for SportRadar API
    if (market.category.toLowerCase() === 'football' || market.category.toLowerCase() === 'sports') {
      return {
        sport_event: {
          id: 'sr:match:12345',
          competitors: [
            { name: 'Team A', qualifier: 'home' },
            { name: 'Team B', qualifier: 'away' }
          ]
        },
        sport_event_status: {
          status: 'closed',
          match_status: 'ended',
          home_score: 2,
          away_score: 1
        }
      };
    }
    throw new Error('Market category not supported by SportRadar');
  }

  private async fetchNewsAPIData(market: ApprovedMarket): Promise<any> {
    // Mock implementation for News verification
    if (market.category.toLowerCase() === 'politics' || market.category.toLowerCase() === 'news') {
      return {
        status: 'ok',
        totalResults: 50,
        articles: [
          {
            title: 'Related news article',
            description: 'Article supporting the claim',
            url: 'https://example.com/article1',
            publishedAt: '2024-01-15T10:00:00Z',
            source: { name: 'News Source' }
          }
        ]
      };
    }
    throw new Error('Market category not supported by NewsAPI');
  }

  private parseAPIResponse(apiData: any, source: string, market: ApprovedMarket): ResolutionData {
    // Parse API response based on source and market type
    switch (source) {
      case 'flashscore':
        return this.parseFlashscoreResponse(apiData, market);
      case 'sportradar':
        return this.parseSportRadarResponse(apiData, market);
      case 'newsapi':
        return this.parseNewsAPIResponse(apiData, market);
      default:
        throw new Error(`Unknown source for parsing: ${source}`);
    }
  }

  private parseFlashscoreResponse(data: any, market: ApprovedMarket): ResolutionData {
    if (data.status === 'finished') {
      const homeWin = data.homeScore > data.awayScore;
      const draw = data.homeScore === data.awayScore;
      
      // Determine outcome based on market claim
      let outcome: 'yes' | 'no';
      if (market.claim.toLowerCase().includes('win') && market.claim.toLowerCase().includes(data.homeTeam.toLowerCase())) {
        outcome = homeWin ? 'yes' : 'no';
      } else if (market.claim.toLowerCase().includes('draw')) {
        outcome = draw ? 'yes' : 'no';
      } else {
        // Default interpretation
        outcome = homeWin ? 'yes' : 'no';
      }

      return {
        outcome,
        confidence: 'high',
        source: 'flashscore',
        apiData: data,
        reasoning: `Match ended ${data.homeScore}-${data.awayScore}. ${data.homeTeam} ${homeWin ? 'won' : 'did not win'}.`
      };
    }
    
    throw new Error('Match not finished yet');
  }

  private parseSportRadarResponse(data: any, market: ApprovedMarket): ResolutionData {
    if (data.sport_event_status?.status === 'closed') {
      const homeScore = data.sport_event_status.home_score;
      const awayScore = data.sport_event_status.away_score;
      const homeWin = homeScore > awayScore;

      return {
        outcome: homeWin ? 'yes' : 'no',
        confidence: 'high',
        source: 'sportradar',
        apiData: data,
        reasoning: `Official match result: ${homeScore}-${awayScore}`
      };
    }
    
    throw new Error('Match not finished according to SportRadar');
  }

  private parseNewsAPIResponse(data: any, market: ApprovedMarket): ResolutionData {
    // Simple sentiment analysis based on article count and keywords
    const relevantArticles = data.articles?.length || 0;
    const supportingArticles = data.articles?.filter((article: any) => 
      article.title.toLowerCase().includes('confirm') || 
      article.title.toLowerCase().includes('true') ||
      article.description?.toLowerCase().includes('confirm')
    ).length || 0;

    const supportRatio = relevantArticles > 0 ? supportingArticles / relevantArticles : 0;
    
    let confidence: 'high' | 'medium' | 'low';
    if (relevantArticles >= 10 && (supportRatio > 0.7 || supportRatio < 0.3)) {
      confidence = 'high';
    } else if (relevantArticles >= 5) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      outcome: supportRatio > 0.5 ? 'yes' : 'no',
      confidence,
      source: 'newsapi',
      apiData: data,
      reasoning: `Found ${relevantArticles} relevant articles, ${supportingArticles} supporting the claim (${(supportRatio * 100).toFixed(1)}% support ratio)`
    };
  }

  // Resolution Management
  async initiateResolution(marketId: string, apiSources: string[] = ['flashscore']): Promise<{
    resolutionId: string;
    hcsTopicId?: string;
    transactionId?: string;
  }> {
    try {
      console.log(`Initiating resolution for market ${marketId} with sources: ${apiSources.join(', ')}`);
      
      let resolutionData: ResolutionData | null = null;
      let lastError: Error | null = null;

      // Try each API source until we get a successful resolution
      for (const source of apiSources) {
        try {
          resolutionData = await this.fetchResolutionFromAPI(marketId, source);
          break; // Success, exit loop
        } catch (error) {
          console.warn(`API source ${source} failed for market ${marketId}:`, error);
          lastError = error as Error;
          continue;
        }
      }

      if (!resolutionData) {
        throw lastError || new Error('All API sources failed');
      }

      // Calculate dispute period end (48 hours from now by default)
      const disputePeriodEnd = new Date();
      disputePeriodEnd.setHours(disputePeriodEnd.getHours() + 48);

      // Create resolution record in database
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      const { data: resolution, error } = await supabase
        .from('market_resolutions')
        .insert({
          market_id: marketId,
          outcome: resolutionData.outcome,
          source: resolutionData.source,
          api_data: resolutionData.apiData,
          confidence: resolutionData.confidence,
          dispute_period_end: disputePeriodEnd.toISOString(),
          resolved_by: 'api'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Submit resolution to Hedera Consensus Service
      let hcsTransactionId: string | undefined;
      try {
        hcsTransactionId = await hederaResolutionService.submitResolutionMessage(
          marketId,
          {
            resolution: resolutionData,
            disputePeriodEnd: disputePeriodEnd.toISOString()
          },
          'api'
        );

        // Update resolution record with HCS transaction ID
        await supabase
          .from('market_resolutions')
          .update({
            transaction_id: hcsTransactionId,
            consensus_timestamp: new Date().toISOString()
          })
          .eq('id', resolution.id);

      } catch (hcsError) {
        console.warn('HCS submission failed, continuing without:', hcsError);
      }

      console.log(`Resolution initiated for market ${marketId}: ${resolutionData.outcome} (${resolutionData.confidence} confidence)`);

      return {
        resolutionId: resolution.id,
        hcsTopicId: hederaResolutionService.getTopicIds().resolution,
        transactionId: hcsTransactionId
      };

    } catch (error) {
      console.error('Error initiating resolution:', error);
      throw error;
    }
  }

  async finalizeResolution(marketId: string, adminDecision?: {
    outcome: 'yes' | 'no';
    notes: string;
  }): Promise<{
    finalTransactionId?: string;
    consensusTimestamp: Date;
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      // Get current resolution
      const { data: resolution, error } = await supabase
        .from('market_resolutions')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !resolution) {
        throw new Error(`Resolution not found for market ${marketId}`);
      }

      // Update resolution with final outcome
      const finalOutcome = adminDecision?.outcome || resolution.outcome;
      const resolvedBy = adminDecision ? 'admin' : 'api';

      await supabase
        .from('market_resolutions')
        .update({
          final_outcome: finalOutcome,
          resolved_by: resolvedBy,
          admin_notes: adminDecision?.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', resolution.id);

      // Update market status to resolved
      await supabase
        .from('approved_markets')
        .update({
          status: 'resolved',
          resolution_data: {
            ...resolution,
            final_outcome: finalOutcome,
            resolved_by: resolvedBy
          }
        })
        .eq('id', marketId);

      // Submit final decision to HCS if admin override
      let hcsTransactionId: string | undefined;
      if (adminDecision) {
        try {
          hcsTransactionId = await hederaResolutionService.submitAdminDecision(
            marketId,
            {
              finalOutcome,
              originalOutcome: resolution.outcome,
              adminNotes: adminDecision.notes
            },
            adminDecision.notes
          );
        } catch (hcsError) {
          console.warn('HCS admin decision submission failed:', hcsError);
        }
      }

      const consensusTimestamp = new Date();
      
      console.log(`Resolution finalized for market ${marketId}: ${finalOutcome} (${resolvedBy})`);

      return {
        finalTransactionId: hcsTransactionId,
        consensusTimestamp
      };

    } catch (error) {
      console.error('Error finalizing resolution:', error);
      throw error;
    }
  }

  // Dispute Period Management
  async startDisputePeriod(marketId: string, durationHours: number = 48): Promise<{
    topicId: string;
    disputePeriodEnd: Date;
  }> {
    const disputePeriodEnd = new Date();
    disputePeriodEnd.setHours(disputePeriodEnd.getHours() + durationHours);

    // Update market status to indicate dispute period
    if (supabase) {
      await supabase
        .from('approved_markets')
        .update({
          status: 'pending_resolution',
          dispute_period_end: disputePeriodEnd.toISOString()
        })
        .eq('id', marketId);
    }

    return {
      topicId: hederaResolutionService.getTopicIds().dispute,
      disputePeriodEnd
    };
  }

  async checkDisputePeriodExpired(marketId: string): Promise<boolean> {
    if (!supabase) return false;

    const { data: market } = await supabase
      .from('approved_markets')
      .select('dispute_period_end')
      .eq('id', marketId)
      .single();

    if (!market?.dispute_period_end) return false;

    return new Date() > new Date(market.dispute_period_end);
  }

  // Scheduling
  scheduleResolution(marketId: string, resolveAt: Date, sources: string[] = ['flashscore']): void {
    this.scheduledResolutions.set(marketId, {
      marketId,
      resolveAt,
      sources,
      retryCount: 0
    });
    
    console.log(`Scheduled resolution for market ${marketId} at ${resolveAt.toISOString()}`);
  }

  private startResolutionScheduler(): void {
    setInterval(async () => {
      await this.processScheduledResolutions();
    }, 60000); // Check every minute
  }

  async processScheduledResolutions(): Promise<void> {
    const now = new Date();
    
    for (const [marketId, scheduled] of this.scheduledResolutions.entries()) {
      if (now >= scheduled.resolveAt) {
        try {
          await this.initiateResolution(marketId, scheduled.sources);
          this.scheduledResolutions.delete(marketId);
          console.log(`Processed scheduled resolution for market ${marketId}`);
        } catch (error) {
          console.error(`Scheduled resolution failed for market ${marketId}:`, error);
          
          // Retry logic
          if (scheduled.retryCount < 3) {
            scheduled.retryCount++;
            scheduled.resolveAt = new Date(now.getTime() + 15 * 60 * 1000); // Retry in 15 minutes
            console.log(`Rescheduling resolution for market ${marketId} (retry ${scheduled.retryCount})`);
          } else {
            // Mark for manual resolution after 3 failed attempts
            this.scheduledResolutions.delete(marketId);
            await this.flagForManualResolution(marketId, error instanceof Error ? error.message : 'Unknown error');
          }
        }
      }
    }
  }

  private async flagForManualResolution(marketId: string, reason: string): Promise<void> {
    console.log(`Flagging market ${marketId} for manual resolution: ${reason}`);
    
    if (supabase) {
      await supabase
        .from('approved_markets')
        .update({
          status: 'pending_resolution',
          resolution_data: {
            requiresManualResolution: true,
            reason,
            flaggedAt: new Date().toISOString()
          }
        })
        .eq('id', marketId);
    }
  }

  // Utility Methods
  private async getMarketById(marketId: string): Promise<ApprovedMarket | null> {
    if (!supabase) return null;

    const { data: market, error } = await supabase
      .from('approved_markets')
      .select('*')
      .eq('id', marketId)
      .single();

    return error ? null : market;
  }

  private async logAPICall(
    marketId: string,
    apiSource: string,
    requestData: any,
    responseData: any,
    success: boolean,
    errorMessage?: string,
    responseTimeMs?: number
  ): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('api_integration_logs')
        .insert({
          market_id: marketId,
          api_source: apiSource,
          request_data: requestData,
          response_data: responseData,
          success,
          error_message: errorMessage,
          response_time_ms: responseTimeMs
        });
    } catch (error) {
      console.warn('Failed to log API call:', error);
    }
  }
}

// Export singleton instance
export const resolutionService = new ResolutionService();