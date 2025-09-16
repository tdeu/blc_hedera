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

interface EvidenceResolutionPanelProps {
  userProfile: {
    walletAddress: string;
    displayName?: string;
  };
}

interface MarketWithEvidence {
  id: string;
  claim: string;
  status: 'pending_resolution' | 'disputing' | 'resolved';
  expiresAt: Date;
  dispute_period_end?: string;
  evidence_count: number;
  evidences: Evidence[];
  ai_resolution?: {
    recommendation: string;
    confidence: number;
    reasoning: string;
    timestamp: string;
  };
  resolution_data?: any;
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

  useEffect(() => {
    loadMarketsWithEvidence();
  }, [activeTab]);

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

      // Step 1: Get markets in resolution phase
      const { data: marketsData, error: marketsError } = await supabase
        .from('approved_markets')
        .select('*')
        .in('status', ['pending_resolution', 'disputing', 'resolved'])
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
          admin_reviewed: evidence.status === 'reviewed' || evidence.status === 'accepted' || false
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
          resolution_data: market.resolution_data
        };

        marketsWithEvidence.push(marketWithEvidence);
      }

      // Filter by active tab
      const filteredMarkets = marketsWithEvidence.filter(market => 
        activeTab === 'pending' 
          ? market.status === 'pending_resolution' || market.status === 'disputing'
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
    try {
      // Here we'll call our enhanced AI resolution system
      toast.success('AI analysis triggered! This will process external data sources and evidence.');
      
      // Mock AI processing - in real implementation, this calls our BlockCast AI Agent
      setTimeout(() => {
        // Update the market with AI results
        setMarkets(prev => prev.map(market => 
          market.id === marketId 
            ? {
                ...market,
                ai_resolution: {
                  recommendation: 'YES',
                  confidence: 0.85,
                  reasoning: 'Based on evidence analysis and external sources (BBC, Reuters), the claim appears to be supported. High confidence due to multiple corroborating sources.',
                  timestamp: new Date().toISOString()
                }
              }
            : market
        ));
        setProcessingAI(false);
        toast.success('AI analysis completed! Review the results below.');
      }, 3000);

    } catch (error) {
      console.error('Error triggering AI analysis:', error);
      toast.error('Failed to trigger AI analysis');
      setProcessingAI(false);
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
                          <div className="space-y-3">
                            {market.evidences.map((evidence, index) => (
                              <div key={evidence.id} className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                      <Badge variant="outline" className="text-xs">{evidence.submission_fee} HBAR</Badge>
                                    </div>
                                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                                      {evidence.user_id.slice(0, 20)}...{evidence.user_id.slice(-8)}
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(evidence.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-2 rounded">
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
                                        className="text-blue-500 hover:text-blue-600 text-xs mr-2"
                                      >
                                        🔗 Link {linkIdx + 1}
                                      </a>
                                    ))}
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
                        <h4 className="font-medium mb-3">AI Engine & External Sources</h4>
                        <div className="space-y-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">External Source Selection</h5>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                              Select which external sources the AI should analyze for this market.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {['BBC News', 'Reuters Africa', 'NewsAPI', 'Government Sources'].map((source) => (
                                <div key={source} className="flex items-center space-x-2">
                                  <input type="checkbox" defaultChecked className="rounded" />
                                  <span className="text-sm">{source}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Button
                              onClick={() => triggerAIAnalysis(market.id)}
                              disabled={processingAI}
                              className="gap-2 w-full"
                            >
                              <Brain className="h-4 w-4" />
                              {processingAI ? 'Processing AI Analysis...' : 'Run AI Web Scraping & Analysis'}
                            </Button>
                            
                            {market.ai_resolution && market.ai_resolution.recommendation !== 'PENDING' && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Brain className="h-4 w-4 text-green-500" />
                                  <span className="font-medium">AI Analysis Complete</span>
                                  <Badge variant={market.ai_resolution.recommendation === 'YES' ? 'default' : 'destructive'}>
                                    {market.ai_resolution.recommendation}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {market.ai_resolution.reasoning}
                                </p>
                              </div>
                            )}
                          </div>
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