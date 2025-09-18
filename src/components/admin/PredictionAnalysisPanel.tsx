import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  TrendingUp,
  Brain,
  Clock,
  Target,
  Activity,
  Loader2,
  BarChart3,
  Calendar
} from 'lucide-react';
import { BettingMarket } from '../BettingMarkets';
import { approvedMarketsService } from '../../utils/approvedMarketsService';
import { AIAnalysisResult } from '../../services/aiAnalysisService';
import { webScrapingService } from '../../services/webScrapingService';
import { aiAnalysisService } from '../../services/aiAnalysisService';

interface PredictionAnalysisPanelProps {
  userProfile?: {
    walletAddress: string;
    displayName?: string;
  };
}

interface MarketWithAnalysis extends BettingMarket {
  aiAnalysis?: AIAnalysisResult;
  isAnalyzing?: boolean;
}

const PredictionAnalysisPanel: React.FC<PredictionAnalysisPanelProps> = ({ userProfile }) => {
  const [futureMarkets, setFutureMarkets] = useState<MarketWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFutureMarkets();
  }, []);

  const loadFutureMarkets = async () => {
    try {
      setLoading(true);
      const markets = await approvedMarketsService.getApprovedMarkets();
      const now = new Date();
      const activeFutureMarkets = markets.filter(market => {
        const expiresAt = new Date(market.expiresAt);
        return expiresAt > now && market.status === 'active';
      });

      console.log(`📊 Found ${activeFutureMarkets.length} active future markets`);
      setFutureMarkets(activeFutureMarkets);
    } catch (error) {
      console.error('Error loading future markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async (market: MarketWithAnalysis) => {
    try {
      console.log(`🤖 Starting AI analysis for market: ${market.claim}`);

      setFutureMarkets(prev =>
        prev.map(m =>
          m.id === market.id
            ? { ...m, isAnalyzing: true }
            : m
        )
      );

      const sources = webScrapingService.getAvailableSources();
      const sourceIds = sources.map(s => s.id);

      const scrapedContent = await webScrapingService.scrapeMultipleSources(
        sourceIds,
        market.claim
      );

      const analysis = await aiAnalysisService.analyzeContent(
        market.claim,
        scrapedContent
      );

      console.log(`✅ AI analysis complete for market: ${market.id}`, analysis);

      setFutureMarkets(prev =>
        prev.map(m =>
          m.id === market.id
            ? { ...m, aiAnalysis: analysis, isAnalyzing: false }
            : m
        )
      );

    } catch (error) {
      console.error('Error running AI analysis:', error);

      setFutureMarkets(prev =>
        prev.map(m =>
          m.id === market.id
            ? { ...m, isAnalyzing: false }
            : m
        )
      );
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (confidence >= 0.4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'YES':
        return <Badge className="bg-green-100 text-green-800 border-green-300">LIKELY</Badge>;
      case 'NO':
        return <Badge className="bg-red-100 text-red-800 border-red-300">UNLIKELY</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">UNCERTAIN</Badge>;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Prediction Analysis</h2>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading markets...</span>
          </div>
        </div>

        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Prediction Analysis</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">AI INSIGHTS</Badge>
          <Button
            onClick={loadFutureMarkets}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Refresh Markets
          </Button>
        </div>
      </div>

      <div>
        <p className="text-gray-600 dark:text-gray-400">
          AI insights for active future markets ({futureMarkets.length} total)
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Markets</p>
                <p className="text-2xl font-bold">{futureMarkets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Analyzed</p>
                <p className="text-2xl font-bold">
                  {futureMarkets.filter(m => m.aiAnalysis).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Analyzing</p>
                <p className="text-2xl font-bold">
                  {futureMarkets.filter(m => m.isAnalyzing).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {futureMarkets.filter(m => !m.aiAnalysis && !m.isAnalyzing).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Markets List */}
      <div className="grid gap-6">
        {futureMarkets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Future Markets</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All prediction markets have either expired or been resolved.
              </p>
            </CardContent>
          </Card>
        ) : (
          futureMarkets.map((market) => (
            <Card key={market.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{market.claim}</CardTitle>
                    {market.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {market.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeRemaining(market.expiresAt.toISOString())} remaining
                      </Badge>
                      <Badge variant="secondary">{market.category}</Badge>
                      <Badge variant="outline">{market.country}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {market.aiAnalysis && getRecommendationBadge(market.aiAnalysis.recommendation)}

                    <Button
                      onClick={() => runAIAnalysis(market)}
                      disabled={market.isAnalyzing}
                      size="sm"
                      variant={market.aiAnalysis ? "outline" : "default"}
                      className="flex items-center gap-2"
                    >
                      {market.isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          {market.aiAnalysis ? 'Re-analyze' : 'Run AI Analysis'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {market.aiAnalysis && (
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Analysis Results */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        AI Analysis Results
                      </h4>

                      <div className={`p-3 rounded-lg border ${getConfidenceColor(market.aiAnalysis.confidence)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Confidence Score</span>
                          <span className="font-bold">
                            {Math.round(market.aiAnalysis.confidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-current opacity-60"
                            style={{ width: `${market.aiAnalysis.confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h5 className="font-medium mb-2">AI Reasoning</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {market.aiAnalysis.reasoning}
                        </p>
                      </div>
                    </div>

                    {/* Key Factors */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Key Predictive Factors
                      </h4>

                      <div className="space-y-2">
                        {market.aiAnalysis.keyFactors.map((factor, index) => (
                          <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                            • {factor}
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-gray-500 mt-3">
                        Analysis completed: {new Date(market.aiAnalysis.timestamp).toLocaleString()}
                        <br />
                        Processing time: {market.aiAnalysis.processingTimeMs}ms
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PredictionAnalysisPanel;