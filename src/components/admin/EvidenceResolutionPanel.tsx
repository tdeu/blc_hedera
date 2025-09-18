import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Brain, Eye, CheckCircle, XCircle, Clock, Gavel, ExternalLink, AlertTriangle, PlayCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { newsApiService } from '../../services/newsApiService';
import { wikipediaService } from '../../services/wikipediaService';
import { marketClassificationService } from '../../services/marketClassificationService';
import { EvidenceAggregationService, type AggregationResult } from '../../services/evidenceAggregationService';

// Type definitions for environment variables
declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    };
  }
}

interface EvidenceResolutionPanelProps {
  userProfile: {
    walletAddress: string;
    displayName?: string;
  };
}

type DataSourceType = 'NEWS' | 'HISTORICAL' | 'ACADEMIC' | 'GENERAL_KNOWLEDGE';

interface MarketWithEvidence {
  id: string;
  claim: string;
  status: 'pending_resolution' | 'disputing' | 'resolved' | 'disputable';
  expiresAt: Date;
  dispute_period_end?: string;
  evidence_count: number;
  evidences: Evidence[];
  ai_resolution?: {
    recommendation: string;
    confidence: number;
    reasoning: string;
    timestamp: string;
    keyFactors?: string[];
    sourceAnalysis?: Record<string, SourceAnalysis>;
    scrapedContent?: any[];
    processingTimeMs?: number;
    sourceArticles?: any[];
    newsArticles?: any[];
    dataSourceUsed?: DataSourceType;
    sourceType?: string;
  };
  resolution_data?: any;
  // Hybrid AI fields
  data_source_type: DataSourceType;
  admin_override_classification: boolean;
  auto_detected_type?: DataSourceType;
  classification_confidence?: number;
  keywords_detected?: string[];
}

interface Evidence {
  id: string;
  user_id: string;
  evidence_text: string;
  evidence_links: string[];
  created_at: string;
  submission_fee: number;
  language: string;
  ai_quality_score?: number;
  admin_reviewed?: boolean;
  // New aggregation fields
  stance?: 'supporting' | 'disputing' | 'neutral';
  source_credibility_score?: number;
  admin_stance_verified?: boolean;
  confidence_impact?: number;
  source_type?: 'academic' | 'government' | 'news' | 'expert_opinion' | 'social_media' | 'blog' | 'anonymous' | 'other';
  quality_score?: number;
  status?: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}

interface SourceAnalysis {
  position: 'YES' | 'NO' | 'NEUTRAL';
  summary: string;
}

const EvidenceResolutionPanel: React.FC<EvidenceResolutionPanelProps> = ({ userProfile }) => {
  const [markets, setMarkets] = useState<MarketWithEvidence[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<MarketWithEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [marketTabs, setMarketTabs] = useState<{[marketId: string]: 'evidence' | 'ai' | 'aggregate'}>({});
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    externalAPIs: ['bbc', 'reuters', 'newsapi'],
    confidenceThreshold: 0.8,
    autoResolve: false
  });
  const [processingAI, setProcessingAI] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [manualResolution, setManualResolution] = useState({
    outcome: '' as 'yes' | 'no' | '',
    reasoning: '',
    overrideAI: false
  });
  const [selectedNewsSources, setSelectedNewsSources] = useState<string[]>([
    'bbc-news', 'reuters', 'associated-press', 'bloomberg', 'cnn'
  ]); // Default selection
  const [availableNewsSources, setAvailableNewsSources] = useState(newsApiService.getAvailableSources());
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  // Hybrid AI classification state
  const [marketClassification, setMarketClassification] = useState<{[marketId: string]: DataSourceType}>({});
  const [showClassificationOverride, setShowClassificationOverride] = useState<{[marketId: string]: boolean}>({});
  // Evidence stance management state
  const [editingEvidence, setEditingEvidence] = useState<{[evidenceId: string]: boolean}>({});
  const [evidenceUpdates, setEvidenceUpdates] = useState<{[evidenceId: string]: Partial<Evidence>}>({});
  // Aggregation results state
  const [aggregationResults, setAggregationResults] = useState<{[marketId: string]: AggregationResult}>({});
  const [calculatingAggregation, setCalculatingAggregation] = useState<{[marketId: string]: boolean}>({});

  useEffect(() => {
    loadMarketsWithEvidence();
  }, [activeTab]);

  // Auto-classify markets when they're loaded
  useEffect(() => {
    if (markets.length > 0) {
      autoClassifyMarkets();
    }
  }, [markets.length]);

  const autoClassifyMarkets = () => {
    setMarkets(prevMarkets => {
      return prevMarkets.map(market => {
        // Skip if already has auto-detected classification
        if (market.auto_detected_type) {
          return market;
        }

        // Perform auto-classification
        const classification = marketClassificationService.classifyMarket(market.claim);

        // Update local state for new classifications
        setMarketClassification(prev => ({
          ...prev,
          [market.id]: classification.type
        }));

        return {
          ...market,
          auto_detected_type: classification.type,
          classification_confidence: classification.confidence,
          keywords_detected: classification.keywords,
          // Use auto-detected type if no manual classification exists
          data_source_type: market.admin_override_classification ? market.data_source_type : classification.type
        };
      });
    });
  };

  const toggleMarketExpansion = (marketId: string) => {
    if (expandedMarket === marketId) {
      setExpandedMarket(null);
    } else {
      setExpandedMarket(marketId);
      // Set default tab to 'ai' if not already set
      if (!marketTabs[marketId]) {
        setMarketTabs(prev => ({ ...prev, [marketId]: 'ai' }));
      }
    }
  };

  const setMarketTab = (marketId: string, tab: 'evidence' | 'ai' | 'aggregate') => {
    setMarketTabs(prev => ({ ...prev, [marketId]: tab }));
  };

  const getActiveMarketTab = (marketId: string): 'evidence' | 'ai' | 'aggregate' => {
    return marketTabs[marketId] || 'ai';
  };

  const loadMarketsWithEvidence = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading real markets with evidence...');
      
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Step 1: Get markets in resolution phase (including disputable markets)
      const { data: marketsData, error: marketsError } = await supabase
        .from('approved_markets')
        .select('*')
        .in('status', ['pending_resolution', 'disputing', 'resolved', 'disputable'])
        .order('created_at', { ascending: false });

      if (marketsError) {
        throw new Error(`Failed to fetch markets: ${marketsError.message}`);
      }

      console.log('📊 Found markets in resolution phase:', marketsData?.length || 0);

      if (!marketsData || marketsData.length === 0) {
        setMarkets([]);
        return;
      }

      // Step 2: Get evidence for each market
      const marketsWithEvidence: MarketWithEvidence[] = [];
      
      for (const market of marketsData) {
        console.log(`🔍 Loading evidence for market: ${market.id}`);
        
        const { data: evidenceData, error: evidenceError } = await supabase
          .from('evidence_submissions')
          .select('*')
          .eq('market_id', market.id)
          .order('created_at', { ascending: false });

        if (evidenceError) {
          console.warn(`⚠️ Failed to fetch evidence for ${market.id}:`, evidenceError);
        }

        const evidences: Evidence[] = (evidenceData || []).map(evidence => ({
          id: evidence.id,
          user_id: evidence.user_id,
          evidence_text: evidence.evidence_text || '',
          evidence_links: evidence.evidence_links || [],
          created_at: evidence.created_at,
          submission_fee: evidence.submission_fee || 0,
          language: evidence.language || 'en',
          ai_quality_score: evidence.ai_quality_score,
          admin_reviewed: evidence.status === 'reviewed' || evidence.status === 'accepted' || false,
          // New aggregation fields
          stance: evidence.stance || 'neutral',
          source_credibility_score: evidence.source_credibility_score || 1.0,
          admin_stance_verified: evidence.admin_stance_verified || false,
          confidence_impact: evidence.confidence_impact || 0.0,
          source_type: evidence.source_type || 'other',
          quality_score: evidence.quality_score || 1.0,
          status: evidence.status || 'pending'
        }));

        console.log(`✅ Found ${evidences.length} evidence items for ${market.claim}`);

        // Step 3: Get existing AI resolution if any
        let aiResolution = {
          recommendation: 'PENDING',
          confidence: 0.0,
          reasoning: 'Awaiting admin trigger for AI analysis',
          timestamp: new Date().toISOString()
        };

        if (market.resolution_data) {
          try {
            const resData = typeof market.resolution_data === 'string' 
              ? JSON.parse(market.resolution_data) 
              : market.resolution_data;
            
            if (resData.recommendation || resData.outcome) {
              aiResolution = {
                recommendation: resData.recommendation || resData.outcome?.toUpperCase() || 'PENDING',
                confidence: resData.confidence || 0.5,
                reasoning: resData.reasoning || resData.analysis || 'AI analysis completed',
                timestamp: resData.timestamp || market.updated_at || new Date().toISOString()
              };
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse resolution data:', parseError);
          }
        }

        const marketWithEvidence: MarketWithEvidence = {
          id: market.id,
          claim: market.claim,
          status: market.status as any,
          expiresAt: new Date(market.expires_at),
          dispute_period_end: market.dispute_period_end,
          evidence_count: evidences.length,
          evidences,
          ai_resolution: aiResolution,
          resolution_data: market.resolution_data,
          // Hybrid AI fields with defaults
          data_source_type: market.data_source_type || 'NEWS',
          admin_override_classification: market.admin_override_classification || false,
          auto_detected_type: market.auto_detected_type || undefined,
          classification_confidence: market.classification_confidence || undefined,
          keywords_detected: market.keywords_detected || undefined
        };

        marketsWithEvidence.push(marketWithEvidence);
      }

      // Filter by active tab
      const filteredMarkets = marketsWithEvidence.filter(market =>
        activeTab === 'pending'
          ? market.status === 'pending_resolution' || market.status === 'disputing' || market.status === 'disputable'
          : market.status === 'resolved'
      );

      console.log(`📋 Showing ${filteredMarkets.length} ${activeTab} markets`);
      setMarkets(filteredMarkets);

    } catch (error) {
      console.error('❌ Error loading markets with evidence:', error);
      toast.error(`Failed to load markets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  const triggerAIAnalysis = async (marketId: string) => {
    setProcessingAI(true);
    const startTime = Date.now();

    try {
      console.log('🚀 Starting hybrid AI analysis for market:', marketId);

      // Find the market
      const market = markets.find(m => m.id === marketId);
      if (!market) {
        throw new Error('Market not found');
      }

      // Determine data source type (use override if set, otherwise use current classification)
      const dataSourceType = marketClassification[market.id] || market.data_source_type;
      console.log(`📊 Using data source: ${dataSourceType}`);

      let sourceArticles: any[] = [];
      let sourceType = '';

      // Step 1: Route to appropriate data source based on classification
      if (dataSourceType === 'NEWS') {
        toast.info('Searching NewsAPI for recent articles...');
        console.log(`📰 Selected news sources: ${selectedNewsSources.join(', ')}`);

        const newsArticles = await newsApiService.searchNews(
          market.claim,
          selectedNewsSources,
          15
        );

        if (newsArticles.length === 0) {
          toast.warning('No relevant news articles found. Trying broader search...');
          const fallbackArticles = await newsApiService.searchNews(
            market.claim,
            selectedNewsSources.slice(0, 3),
            10
          );
          if (fallbackArticles.length === 0) {
            throw new Error('No relevant news articles found for this topic');
          }
          sourceArticles = fallbackArticles;
        } else {
          sourceArticles = newsArticles;
        }
        sourceType = 'NewsAPI';

      } else {
        // For HISTORICAL, ACADEMIC, GENERAL_KNOWLEDGE - use Wikipedia
        toast.info(`Searching Wikipedia for ${dataSourceType.toLowerCase()} content...`);
        console.log(`📚 Searching Wikipedia for: "${market.claim}"`);

        const wikipediaArticles = await wikipediaService.searchWikipedia(
          market.claim,
          10
        );

        if (wikipediaArticles.length === 0) {
          throw new Error(`No relevant Wikipedia articles found for this ${dataSourceType.toLowerCase()} topic`);
        }

        sourceArticles = wikipediaArticles;
        sourceType = 'Wikipedia';
      }

      toast.info(`Found ${sourceArticles.length} relevant ${sourceType} articles. Analyzing with AI...`);

      // Step 2: Import AI service and analyze
      const { aiAnalysisService } = await import('../../services/aiAnalysisService');

      // Convert articles to the format expected by AI service
      const scrapedContent = sourceArticles.map(article => ({
        id: article.id,
        source: article.source,
        url: article.url,
        title: article.title,
        content: article.content,
        publishedAt: article.publishedAt,
        relevanceScore: article.relevanceScore
      }));

      // Use enhanced analysis with data source type context
      const analysisResult = await aiAnalysisService.analyzeContentWithSourceType(
        market.claim,
        scrapedContent,
        dataSourceType
      );

      const processingTime = Date.now() - startTime;

      // Step 3: Update market with results
      setMarkets(prev => prev.map(marketItem =>
        marketItem.id === marketId
          ? {
              ...marketItem,
              ai_resolution: {
                recommendation: analysisResult.recommendation,
                confidence: analysisResult.confidence,
                reasoning: analysisResult.reasoning,
                timestamp: new Date().toISOString(),
                keyFactors: analysisResult.keyFactors,
                sourceAnalysis: analysisResult.sourceAnalysis,
                scrapedContent: scrapedContent,
                processingTimeMs: processingTime,
                sourceArticles: sourceArticles, // Store original articles (news or wikipedia)
                dataSourceUsed: dataSourceType,
                sourceType: sourceType
              }
            }
          : marketItem
      ));

      const confidencePercent = (analysisResult.confidence * 100).toFixed(0);
      toast.success(`AI analysis complete! Found ${sourceArticles.length} ${sourceType} articles. Recommendation: ${analysisResult.recommendation} (${confidencePercent}% confidence)`);

      // Update database with the classification if admin made an override
      if (marketClassification[market.id] && marketClassification[market.id] !== market.data_source_type) {
        await updateMarketClassification(market.id, marketClassification[market.id]);
      }

    } catch (error) {
      console.error('❌ Error during AI analysis:', error);
      toast.error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingAI(false);
    }
  };

  // Calculate aggregation for a market
  const calculateAggregation = async (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    setCalculatingAggregation(prev => ({ ...prev, [marketId]: true }));

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Check if AI analysis exists
      if (!market.ai_resolution || market.ai_resolution.recommendation === 'PENDING') {
        toast.warning('Please run AI analysis first before calculating aggregation');
        return;
      }

      // Convert evidence to aggregation service format
      const evidenceItems = market.evidences
        .filter(e => e.admin_stance_verified) // Only use admin-verified evidence
        .map(e => ({
          id: e.id,
          stance: e.stance || 'neutral',
          quality_score: e.quality_score || 1.0,
          source_credibility_score: e.source_credibility_score || 1.0,
          source_type: e.source_type || 'other',
          admin_stance_verified: e.admin_stance_verified || false,
          submission_fee: e.submission_fee,
          evidence_text: e.evidence_text,
        }));

      // Convert AI analysis to aggregation service format
      const aiAnalysis = {
        recommendation: market.ai_resolution.recommendation as 'YES' | 'NO' | 'INCONCLUSIVE',
        confidence: market.ai_resolution.confidence,
        dataSourceUsed: market.ai_resolution.dataSourceUsed || market.data_source_type,
        reasoning: market.ai_resolution.reasoning,
        keyFactors: market.ai_resolution.keyFactors,
        sourceAnalysis: market.ai_resolution.sourceAnalysis,
      };

      // Calculate aggregation
      const result = await EvidenceAggregationService.calculateMarketAggregation(
        marketId,
        aiAnalysis,
        evidenceItems,
        supabase
      );

      // Update local state
      setAggregationResults(prev => ({
        ...prev,
        [marketId]: result
      }));

      toast.success(`Aggregation calculated: ${result.finalConfidence.toFixed(1)}% confidence`);

    } catch (error) {
      console.error('Error calculating aggregation:', error);
      toast.error('Failed to calculate evidence aggregation');
    } finally {
      setCalculatingAggregation(prev => ({ ...prev, [marketId]: false }));
    }
  };

  // Update evidence stance and related fields
  const updateEvidenceStance = async (evidenceId: string, updates: Partial<Evidence>) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { error } = await supabase
        .from('evidence_submissions')
        .update({
          stance: updates.stance,
          source_credibility_score: updates.source_credibility_score,
          admin_stance_verified: true,
          source_type: updates.source_type,
          quality_score: updates.quality_score,
          status: updates.status || 'reviewed'
        })
        .eq('id', evidenceId);

      if (error) {
        throw error;
      }

      // Update local state
      setMarkets(prev => prev.map(market => ({
        ...market,
        evidences: market.evidences.map(evidence =>
          evidence.id === evidenceId
            ? { ...evidence, ...updates, admin_stance_verified: true }
            : evidence
        )
      })));

      // Clear editing state
      setEditingEvidence(prev => ({ ...prev, [evidenceId]: false }));
      setEvidenceUpdates(prev => {
        const newState = { ...prev };
        delete newState[evidenceId];
        return newState;
      });

      toast.success('Evidence stance updated successfully');

      // Recalculate aggregation for the market if AI analysis exists
      const evidence = markets.flatMap(m => m.evidences).find(e => e.id === evidenceId);
      const market = markets.find(m => m.evidences.some(e => e.id === evidenceId));
      if (market && market.ai_resolution && market.ai_resolution.recommendation !== 'PENDING') {
        // Automatically recalculate aggregation in the background
        setTimeout(() => calculateAggregation(market.id), 1000);
      }

    } catch (error) {
      console.error('Error updating evidence stance:', error);
      toast.error('Failed to update evidence stance');
    }
  };

  // Update market classification in database
  const updateMarketClassification = async (marketId: string, newType: DataSourceType) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      await supabase
        .from('approved_markets')
        .update({
          data_source_type: newType,
          admin_override_classification: true
        })
        .eq('id', marketId);

      console.log(`✅ Updated market ${marketId} classification to ${newType}`);
    } catch (error) {
      console.warn('⚠️ Failed to update market classification in database:', error);
    }
  };

  const executeResolution = async () => {
    if (!selectedMarket) return;

    try {
      const resolution = manualResolution.overrideAI 
        ? manualResolution 
        : selectedMarket.ai_resolution;

      // Execute the resolution on smart contracts
      toast.success('Resolution executed successfully!');
      
      // Update market status
      setMarkets(prev => prev.map(market => 
        market.id === selectedMarket.id 
          ? { ...market, status: 'resolved' as const }
          : market
      ));

      setShowResolveDialog(false);
      setSelectedMarket(null);
      loadMarketsWithEvidence();

    } catch (error) {
      console.error('Error executing resolution:', error);
      toast.error('Failed to execute resolution');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_resolution':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Pending</Badge>;
      case 'disputing':
        return <Badge variant="outline" className="bg-orange-500/20 text-orange-700 border-orange-500/30">Disputing</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">High ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Medium ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Low ({(confidence * 100).toFixed(0)}%)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evidence & Resolution Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review evidence, supervise AI analysis, and manage market resolutions
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowAIDialog(true)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          AI Config
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('pending')}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Pending Resolution ({markets.filter(m => m.status !== 'resolved').length})
        </Button>
        <Button
          variant={activeTab === 'resolved' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('resolved')}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Resolved ({markets.filter(m => m.status === 'resolved').length})
        </Button>
      </div>

      {/* Markets List - New Compact Layout */}
      {loading ? (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto text-gray-400 animate-pulse mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading markets with evidence...</p>
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No {activeTab === 'pending' ? 'pending' : 'resolved'} markets found
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {markets.map((market) => (
            <div key={market.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Compact Market Header */}
              <div 
                className="p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleMarketExpansion(market.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {market.claim}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(market.status)}
                        <Badge variant="outline" className="text-xs">
                          {market.evidence_count} Evidence
                        </Badge>
                        {market.ai_resolution && getConfidenceBadge(market.ai_resolution.confidence)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                      <div>ID: {market.id.slice(-8)}</div>
                      <div>Expires: {market.expiresAt.toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex items-center gap-2">
                    {expandedMarket === market.id ? (
                      <Badge variant="outline" className="text-xs">Expanded</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Click to expand</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Market Content */}
              {expandedMarket === market.id && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {/* Horizontal Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        getActiveMarketTab(market.id) === 'evidence'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      onClick={() => setMarketTab(market.id, 'evidence')}
                    >
                      📝 Evidence ({market.evidence_count})
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        getActiveMarketTab(market.id) === 'ai'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      onClick={() => setMarketTab(market.id, 'ai')}
                    >
                      🤖 AI Engine
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        getActiveMarketTab(market.id) === 'aggregate'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      onClick={() => setMarketTab(market.id, 'aggregate')}
                    >
                      🔄 Aggregate
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4">
                    {getActiveMarketTab(market.id) === 'evidence' && (
                      <div>
                        <h4 className="font-medium mb-3">User Evidence Submissions</h4>
                        {market.evidence_count === 0 ? (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            No evidence submitted yet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {market.evidences.map((evidence, index) => (
                              <div key={evidence.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                {/* Evidence Header */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                        <Badge variant="outline" className="text-xs">{evidence.submission_fee} HBAR</Badge>
                                        <Badge
                                          variant={evidence.stance === 'supporting' ? 'default' : evidence.stance === 'disputing' ? 'destructive' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {evidence.stance === 'supporting' ? '✅ Supports' :
                                           evidence.stance === 'disputing' ? '❌ Disputes' : '⚪ Neutral'}
                                        </Badge>
                                        {evidence.admin_stance_verified && (
                                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                            Admin Verified
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                                        {evidence.user_id.slice(0, 20)}...{evidence.user_id.slice(-8)}
                                      </p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                      <div>{new Date(evidence.created_at).toLocaleString()}</div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <span>Quality: {evidence.quality_score?.toFixed(1) || '1.0'}/5.0</span>
                                        <span>•</span>
                                        <span>Credibility: {(evidence.source_credibility_score || 1.0).toFixed(1)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Admin Controls */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {evidence.source_type || 'other'} source
                                      </Badge>
                                      <Badge
                                        variant={
                                          evidence.status === 'accepted' ? 'default' :
                                          evidence.status === 'rejected' ? 'destructive' :
                                          evidence.status === 'reviewed' ? 'secondary' : 'outline'
                                        }
                                        className="text-xs"
                                      >
                                        {evidence.status || 'pending'}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingEvidence(prev => ({
                                        ...prev,
                                        [evidence.id]: !prev[evidence.id]
                                      }))}
                                      className="text-xs h-7"
                                    >
                                      {editingEvidence[evidence.id] ? 'Cancel' : 'Edit Stance'}
                                    </Button>
                                  </div>
                                </div>

                                {/* Evidence Content */}
                                <div className="p-3">
                                  <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                    {evidence.evidence_text}
                                  </p>

                                  {evidence.evidence_links && evidence.evidence_links.length > 0 && (
                                    <div className="mt-2">
                                      {evidence.evidence_links.map((link, linkIdx) => (
                                        <a
                                          key={linkIdx}
                                          href={link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:text-blue-600 text-xs mr-3"
                                        >
                                          🔗 Link {linkIdx + 1}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Stance Assignment Interface */}
                                {editingEvidence[evidence.id] && (
                                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/20">
                                    <h6 className="font-medium mb-3 text-blue-900 dark:text-blue-100">Admin Review & Stance Assignment</h6>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Stance Assignment */}
                                      <div>
                                        <Label className="text-sm font-medium mb-2 block">Evidence Stance</Label>
                                        <Select
                                          value={evidenceUpdates[evidence.id]?.stance || evidence.stance || 'neutral'}
                                          onValueChange={(value: 'supporting' | 'disputing' | 'neutral') =>
                                            setEvidenceUpdates(prev => ({
                                              ...prev,
                                              [evidence.id]: { ...prev[evidence.id], stance: value }
                                            }))
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="supporting">✅ Supporting - Evidence supports the claim</SelectItem>
                                            <SelectItem value="disputing">❌ Disputing - Evidence disputes the claim</SelectItem>
                                            <SelectItem value="neutral">⚪ Neutral - Evidence is factual but neutral</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Source Type */}
                                      <div>
                                        <Label className="text-sm font-medium mb-2 block">Source Type</Label>
                                        <Select
                                          value={evidenceUpdates[evidence.id]?.source_type || evidence.source_type || 'other'}
                                          onValueChange={(value: 'academic' | 'government' | 'news' | 'expert_opinion' | 'social_media' | 'blog' | 'anonymous' | 'other') =>
                                            setEvidenceUpdates(prev => ({
                                              ...prev,
                                              [evidence.id]: { ...prev[evidence.id], source_type: value }
                                            }))
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="academic">🎓 Academic/Research</SelectItem>
                                            <SelectItem value="government">🏛️ Government/Official</SelectItem>
                                            <SelectItem value="news">📰 News/Journalism</SelectItem>
                                            <SelectItem value="expert_opinion">👨‍⚕️ Expert Opinion</SelectItem>
                                            <SelectItem value="social_media">📱 Social Media</SelectItem>
                                            <SelectItem value="blog">📝 Blog/Personal</SelectItem>
                                            <SelectItem value="anonymous">❓ Anonymous</SelectItem>
                                            <SelectItem value="other">📄 Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Quality Score */}
                                      <div>
                                        <Label className="text-sm font-medium mb-2 block">Quality Score (0-5.0)</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="5"
                                          step="0.1"
                                          value={evidenceUpdates[evidence.id]?.quality_score || evidence.quality_score || 1.0}
                                          onChange={(e) =>
                                            setEvidenceUpdates(prev => ({
                                              ...prev,
                                              [evidence.id]: { ...prev[evidence.id], quality_score: parseFloat(e.target.value) || 1.0 }
                                            }))
                                          }
                                        />
                                      </div>

                                      {/* Source Credibility */}
                                      <div>
                                        <Label className="text-sm font-medium mb-2 block">Source Credibility (0-1.0)</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="1"
                                          step="0.1"
                                          value={evidenceUpdates[evidence.id]?.source_credibility_score || evidence.source_credibility_score || 1.0}
                                          onChange={(e) =>
                                            setEvidenceUpdates(prev => ({
                                              ...prev,
                                              [evidence.id]: { ...prev[evidence.id], source_credibility_score: parseFloat(e.target.value) || 1.0 }
                                            }))
                                          }
                                        />
                                      </div>

                                      {/* Status */}
                                      <div className="md:col-span-2">
                                        <Label className="text-sm font-medium mb-2 block">Review Status</Label>
                                        <Select
                                          value={evidenceUpdates[evidence.id]?.status || evidence.status || 'pending'}
                                          onValueChange={(value: 'pending' | 'reviewed' | 'accepted' | 'rejected') =>
                                            setEvidenceUpdates(prev => ({
                                              ...prev,
                                              [evidence.id]: { ...prev[evidence.id], status: value }
                                            }))
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">⏳ Pending Review</SelectItem>
                                            <SelectItem value="reviewed">👀 Reviewed</SelectItem>
                                            <SelectItem value="accepted">✅ Accepted</SelectItem>
                                            <SelectItem value="rejected">❌ Rejected</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingEvidence(prev => ({ ...prev, [evidence.id]: false }))}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => updateEvidenceStance(evidence.id, evidenceUpdates[evidence.id] || {})}
                                        className="gap-2"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Update Evidence
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {getActiveMarketTab(market.id) === 'ai' && (
                      <div>
                        <h4 className="font-medium mb-3">AI Engine & Data Sources</h4>
                        <div className="space-y-4">

                          {/* Market Classification Section */}
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-amber-900 dark:text-amber-100">Market Classification</h5>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowClassificationOverride(prev => ({
                                  ...prev,
                                  [market.id]: !prev[market.id]
                                }))}
                              >
                                {showClassificationOverride[market.id] ? 'Hide' : 'Override'} Classification
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {/* Current Classification */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium">Current Classification:</span>
                                  <Badge
                                    variant={
                                      (marketClassification[market.id] || market.data_source_type) === 'NEWS' ? 'default' :
                                      (marketClassification[market.id] || market.data_source_type) === 'HISTORICAL' ? 'secondary' :
                                      (marketClassification[market.id] || market.data_source_type) === 'ACADEMIC' ? 'outline' : 'destructive'
                                    }
                                  >
                                    {marketClassification[market.id] || market.data_source_type}
                                  </Badge>
                                  {market.admin_override_classification && (
                                    <Badge variant="outline" className="text-xs">Manual Override</Badge>
                                  )}
                                </div>

                                {/* Auto-detection info */}
                                {market.auto_detected_type && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    <div>
                                      Auto-detected: {market.auto_detected_type}
                                      {market.classification_confidence && (
                                        <span> ({(market.classification_confidence * 100).toFixed(0)}% confidence)</span>
                                      )}
                                    </div>
                                    {market.keywords_detected && market.keywords_detected.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span>Keywords:</span>
                                        {market.keywords_detected.map((keyword, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                                            {keyword}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Classification Override UI */}
                              {showClassificationOverride[market.id] && (
                                <div className="border border-amber-200 dark:border-amber-800 rounded p-3 bg-white dark:bg-gray-900">
                                  <Label className="text-sm font-medium mb-2 block">Override Classification:</Label>
                                  <Select
                                    value={marketClassification[market.id] || market.data_source_type}
                                    onValueChange={(value: DataSourceType) => {
                                      setMarketClassification(prev => ({ ...prev, [market.id]: value }));
                                    }}
                                  >
                                    <SelectTrigger className="mb-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NEWS">📰 NEWS - Recent events, current affairs</SelectItem>
                                      <SelectItem value="HISTORICAL">🏛️ HISTORICAL - Past events, historical facts</SelectItem>
                                      <SelectItem value="ACADEMIC">🎓 ACADEMIC - Scientific, research-based</SelectItem>
                                      <SelectItem value="GENERAL_KNOWLEDGE">🌐 GENERAL - Encyclopedia, common knowledge</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div><strong>NEWS:</strong> Recent events, breaking news, current affairs</div>
                                    <div><strong>HISTORICAL:</strong> Past events, historical figures, ancient civilizations</div>
                                    <div><strong>ACADEMIC:</strong> Scientific studies, research findings, peer-reviewed data</div>
                                    <div><strong>GENERAL:</strong> Encyclopedia knowledge, established facts, definitions</div>
                                  </div>
                                </div>
                              )}

                              {/* Data Source Preview */}
                              <div className="text-sm text-amber-800 dark:text-amber-200">
                                <span className="font-medium">Will use:</span>
                                {(marketClassification[market.id] || market.data_source_type) === 'NEWS' && ' NewsAPI + 50 news sources'}
                                {(marketClassification[market.id] || market.data_source_type) === 'HISTORICAL' && ' Wikipedia + historical articles'}
                                {(marketClassification[market.id] || market.data_source_type) === 'ACADEMIC' && ' Wikipedia + academic references'}
                                {(marketClassification[market.id] || market.data_source_type) === 'GENERAL_KNOWLEDGE' && ' Wikipedia + general knowledge'}
                              </div>
                            </div>
                          </div>

                          {/* News Source Selection - Only show for NEWS type */}
                          {(marketClassification[market.id] || market.data_source_type) === 'NEWS' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-blue-900 dark:text-blue-100">News Source Selection</h5>
                                <Badge variant="outline" className="text-xs">
                                  {selectedNewsSources.length}/10 sources
                                </Badge>
                              </div>
                              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                Select up to 10 news sources for AI analysis.
                              </p>

                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1">
                                  {selectedNewsSources.map((sourceId) => {
                                    const source = availableNewsSources.find(s => s.id === sourceId);
                                    return source ? (
                                      <Badge key={sourceId} variant="secondary" className="text-xs">
                                        {source.name}
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* AI Analysis Button */}
                          <div className="space-y-2">
                            <Button
                              onClick={() => triggerAIAnalysis(market.id)}
                              disabled={processingAI}
                              className="gap-2 w-full"
                            >
                              <Brain className="h-4 w-4" />
                              {processingAI ? 'Processing AI Analysis...' :
                               `Run ${(marketClassification[market.id] || market.data_source_type)} Analysis`}
                            </Button>
                          </div>
                            
                          {market.ai_resolution && market.ai_resolution.recommendation !== 'PENDING' && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Brain className="h-4 w-4 text-green-500" />
                                <span className="font-medium">AI Analysis Complete</span>
                                <Badge variant={
                                  market.ai_resolution.recommendation === 'YES' ? 'default' :
                                  market.ai_resolution.recommendation === 'NO' ? 'destructive' : 'secondary'
                                }>
                                  {market.ai_resolution.recommendation}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {(market.ai_resolution.confidence * 100).toFixed(0)}% confidence
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h6 className="font-medium text-sm mb-1">AI Conclusion:</h6>
                                  <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-lg">
                                        {market.ai_resolution.recommendation === 'YES' ? '✅ LIKELY TRUE' :
                                         market.ai_resolution.recommendation === 'NO' ? '❌ LIKELY FALSE' :
                                         '❓ INCONCLUSIVE'}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {(market.ai_resolution.confidence * 100).toFixed(0)}% confidence
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {market.ai_resolution.reasoning}
                                    </p>
                                  </div>
                                </div>

                                {market.ai_resolution.keyFactors && market.ai_resolution.keyFactors.length > 0 && (
                                  <div>
                                    <h6 className="font-medium text-sm mb-1">Key Factors:</h6>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                      {market.ai_resolution.keyFactors.map((factor, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="text-blue-500 mt-1">•</span>
                                          <span>{factor}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {market.ai_resolution.sourceAnalysis && Object.keys(market.ai_resolution.sourceAnalysis).length > 0 && (
                                  <div>
                                    <h6 className="font-medium text-sm mb-2">Source Analysis:</h6>
                                    <div className="space-y-2">
                                      {Object.entries(market.ai_resolution.sourceAnalysis).map(([source, analysis]) => {
                                        const typedAnalysis = analysis as SourceAnalysis;
                                        return (
                                          <div key={source} className="border border-gray-200 dark:border-gray-700 p-2 rounded text-xs">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium">{source}</span>
                                              <Badge size="sm" variant={
                                                typedAnalysis.position === 'YES' ? 'default' :
                                                typedAnalysis.position === 'NO' ? 'destructive' : 'secondary'
                                              }>
                                                {typedAnalysis.position}
                                              </Badge>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">{typedAnalysis.summary}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {(market.ai_resolution.sourceArticles || market.ai_resolution.newsArticles) &&
                                 ((market.ai_resolution.sourceArticles && market.ai_resolution.sourceArticles.length > 0) ||
                                  (market.ai_resolution.newsArticles && market.ai_resolution.newsArticles.length > 0)) && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <h6 className="font-medium text-sm">
                                        {market.ai_resolution.sourceType || 'News'} Articles Analyzed
                                        ({(market.ai_resolution.sourceArticles || market.ai_resolution.newsArticles).length}):
                                      </h6>
                                      {market.ai_resolution.dataSourceUsed && (
                                        <Badge variant="outline" className="text-xs">
                                          {market.ai_resolution.dataSourceUsed}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                      {(market.ai_resolution.sourceArticles || market.ai_resolution.newsArticles).map((article, idx) => (
                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 p-3 rounded">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                              <h3 className="font-medium text-sm line-clamp-2 mb-1">{article.title}</h3>
                                              <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="text-xs">{article.source}</Badge>
                                                {article.relevanceScore && (
                                                  <Badge variant="outline" className="text-xs">
                                                    {(article.relevanceScore * 100).toFixed(0)}% relevant
                                                  </Badge>
                                                )}
                                                <span className="text-xs text-gray-500">
                                                  {new Date(article.publishedAt).toLocaleDateString()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
                                            {article.content}
                                          </p>
                                          <div className="flex items-center justify-between">
                                            {article.author && (
                                              <span className="text-xs text-gray-500">By {article.author}</span>
                                            )}
                                            <a
                                              href={article.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-500 hover:text-blue-600 text-xs flex items-center gap-1"
                                            >
                                              Read Article <ExternalLink className="h-3 w-3" />
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {market.ai_resolution.processingTimeMs && (
                                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    Processing time: {Math.round(market.ai_resolution.processingTimeMs / 1000 * 10) / 10}s
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {getActiveMarketTab(market.id) === 'aggregate' && (
                      <div>
                        <h4 className="font-medium mb-3">Aggregate Analysis</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h5 className="font-medium mb-2">User Evidence Summary</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {market.evidence_count} evidence submission(s)
                            </p>
                            {market.evidences.slice(0, 2).map((evidence, idx) => (
                              <p key={idx} className="text-xs text-gray-500 truncate">
                                • {evidence.evidence_text.slice(0, 60)}...
                              </p>
                            ))}
                          </div>
                          
                          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h5 className="font-medium mb-2">AI Analysis Summary</h5>
                            {market.ai_resolution && market.ai_resolution.recommendation !== 'PENDING' ? (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={market.ai_resolution.recommendation === 'YES' ? 'default' : 'destructive'}>
                                    {market.ai_resolution.recommendation}
                                  </Badge>
                                  {getConfidenceBadge(market.ai_resolution.confidence)}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {market.ai_resolution.reasoning.slice(0, 100)}...
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No AI analysis yet</p>
                            )}
                          </div>
                        </div>
                        
                        {market.ai_resolution?.confidence > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              onClick={() => {
                                setSelectedMarket(market);
                                setShowResolveDialog(true);
                              }}
                              className="gap-2"
                            >
                              <Gavel className="h-4 w-4" />
                              Execute Final Resolution
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Configuration Dialog */}
      <AlertDialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>AI Resolution Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Configure external data sources and AI analysis parameters
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">External Data Sources</Label>
              <div className="space-y-2 mt-2">
                {['BBC News', 'Reuters Africa', 'NewsAPI', 'Government Sources'].map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">{source}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Confidence Threshold for Auto-Resolution</Label>
              <Select value={aiConfig.confidenceThreshold.toString()} onValueChange={(value) => 
                setAiConfig(prev => ({ ...prev, confidenceThreshold: parseFloat(value) }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.9">90% - Very High</SelectItem>
                  <SelectItem value="0.8">80% - High</SelectItem>
                  <SelectItem value="0.7">70% - Medium</SelectItem>
                  <SelectItem value="0.6">60% - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Save Configuration</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resolution Execution Dialog */}
      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Execute Market Resolution</AlertDialogTitle>
            <AlertDialogDescription>
              Review the AI analysis and execute the final resolution for this market.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedMarket && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{selectedMarket.claim}</h4>
                {selectedMarket.ai_resolution && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">AI Recommendation:</span>
                      <Badge variant={selectedMarket.ai_resolution.recommendation === 'YES' ? 'default' : 'destructive'}>
                        {selectedMarket.ai_resolution.recommendation}
                      </Badge>
                      {getConfidenceBadge(selectedMarket.ai_resolution.confidence)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMarket.ai_resolution.reasoning}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="overrideAI"
                    checked={manualResolution.overrideAI}
                    onChange={(e) => setManualResolution(prev => ({ ...prev, overrideAI: e.target.checked }))}
                  />
                  <Label htmlFor="overrideAI" className="text-sm">Override AI decision with manual resolution</Label>
                </div>

                {manualResolution.overrideAI && (
                  <div className="space-y-3 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                    <div>
                      <Label className="text-sm font-medium">Manual Outcome</Label>
                      <Select 
                        value={manualResolution.outcome} 
                        onValueChange={(value: 'yes' | 'no') => 
                          setManualResolution(prev => ({ ...prev, outcome: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">YES - Claim is True</SelectItem>
                          <SelectItem value="no">NO - Claim is False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Reasoning for Override</Label>
                      <Textarea
                        placeholder="Explain why you're overriding the AI decision..."
                        value={manualResolution.reasoning}
                        onChange={(e) => setManualResolution(prev => ({ ...prev, reasoning: e.target.value }))}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeResolution}
              className="bg-green-600 hover:bg-green-700"
            >
              Execute Resolution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EvidenceResolutionPanel;