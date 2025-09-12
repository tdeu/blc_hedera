import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  TrendingUp, TrendingDown, Users, Clock, Target, Star, MessageCircle, 
  ArrowLeft, Share2, Heart, Bookmark, Zap, Globe, Shield, 
  ThumbsUp, ThumbsDown, Send, Filter, Eye, AlertCircle,
  CheckCircle2, Clock3, FileText, Scale
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from './LanguageContext';
import { BettingMarket } from './BettingMarkets';
import { generateMockComments, getMarketRules, formatTimeAgo, MarketComment, MarketRule } from '../utils/marketData';
import { debugClickHandler, validateButtonState, logCastingOperation } from '../utils/testHelpers';
import ResolutionStatus from './ResolutionStatus';
import DisputeModal, { DisputeFormData } from './DisputeModal';
import { MarketResolution } from '../utils/supabase';
import { disputeService } from '../utils/disputeService';
import { resolutionService } from '../utils/resolutionService';

interface MarketPageProps {
  market: BettingMarket;
  onPlaceBet: (marketId: string, position: 'yes' | 'no', amount: number) => void;
  userBalance: number;
  onBack: () => void;
}

const quickCastAmounts = [0.01, 0.05, 0.1, 0.5, 1.0];

export default function MarketPage({ market, onPlaceBet, userBalance, onBack }: MarketPageProps) {
  const { t, language } = useLanguage();
  const [castPosition, setCastPosition] = useState<'yes' | 'no'>('yes');
  const [castAmount, setCastAmount] = useState<string>('');
  const [profitCalculation, setProfitCalculation] = useState<{ amount: number; potential: number; profit: number } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState<'yes' | 'no' | 'neutral'>('neutral');
  const [comments] = useState<MarketComment[]>(generateMockComments(market.id));
  const [rules] = useState<MarketRule[]>(getMarketRules(market.id));
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'rules' | 'analysis'>('overview');
  
  // Resolution and dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [resolution, setResolution] = useState<MarketResolution | null>(null);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState(1000); // Mock balance for now

  // Helper function to get translated text
  const getTranslatedText = (text: string, translations?: { en: string; fr: string; sw: string }) => {
    if (!translations) return text;
    return translations[language] || translations.en || text;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return `$${formatNumber(amount)}`;
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return t('expired');
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleQuickCast = (position: 'yes' | 'no', amount: number) => {
    if (amount > userBalance) {
      toast.error(t('insufficientBalance') || 'Insufficient balance');
      return;
    }
    
    onPlaceBet(market.id, position, amount);
    
    // Success feedback
    toast.success(`Truth position cast: ${position.toUpperCase()} with ${amount} HBAR`);
  };

  const calculateProfit = (amount: number, position: 'yes' | 'no') => {
    const odds = position === 'yes' ? market.yesOdds : market.noOdds;
    const potentialReturn = amount * odds;
    const profit = potentialReturn - amount;
    return { amount, potential: potentialReturn, profit };
  };

  const handleAmountChange = (value: string) => {
    setCastAmount(value);
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount > 0) {
      setProfitCalculation(calculateProfit(amount, castPosition));
    } else {
      setProfitCalculation(null);
    }
  };

  const handlePositionChange = (position: 'yes' | 'no') => {
    setCastPosition(position);
    const amount = parseFloat(castAmount);
    if (!isNaN(amount) && amount > 0) {
      setProfitCalculation(calculateProfit(amount, position));
    }
  };

  const handleCustomCast = () => {
    const amount = parseFloat(castAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > userBalance) {
      toast.error(t('insufficientBalance') || 'Insufficient balance');
      return;
    }
    
    onPlaceBet(market.id, castPosition, amount);
    setCastAmount('');
    setProfitCalculation(null);
    
    toast.success(`Custom truth position cast: ${castPosition.toUpperCase()} with ${amount} HBAR`);
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    // Mock comment submission
    toast.success('Comment posted successfully!');
    setNewComment('');
    setCommentPosition('neutral');
  };

  // Resolution and dispute handlers
  const handleDisputeClick = () => {
    setShowDisputeModal(true);
  };

  const handleDisputeSubmit = async (disputeData: DisputeFormData) => {
    setIsSubmittingDispute(true);
    try {
      await disputeService.submitDispute(
        market.id,
        'current-user-id', // This would come from wallet context
        disputeData
      );
      toast.success('Dispute submitted successfully');
      setShowDisputeModal(false);
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      toast.error('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Mock resolution data based on market status
  const getResolutionData = (): MarketResolution | undefined => {
    if (!market.resolution_data) return undefined;
    
    return {
      id: `resolution-${market.id}`,
      market_id: market.id,
      outcome: market.resolution_data.outcome,
      source: market.resolution_data.source || 'api',
      api_data: null,
      confidence: market.resolution_data.confidence,
      timestamp: market.resolution_data.timestamp || new Date().toISOString(),
      dispute_period_end: market.dispute_period_end || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      final_outcome: market.resolution_data.final_outcome,
      resolved_by: market.resolution_data.resolved_by,
      admin_notes: market.resolution_data.admin_notes,
      hcs_topic_id: market.resolution_data.hcs_topic_id,
      hts_token_id: 'mock-token-id',
      contract_id: market.resolution_data.hcs_topic_id,
      transaction_id: market.resolution_data.transaction_id,
      consensus_timestamp: market.resolution_data.consensus_timestamp,
      created_at: market.resolution_data.timestamp || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const handleLikeComment = (commentId: string) => {
    const newLikedComments = new Set(likedComments);
    if (likedComments.has(commentId)) {
      newLikedComments.delete(commentId);
    } else {
      newLikedComments.add(commentId);
    }
    setLikedComments(newLikedComments);
  };

  const getRuleIcon = (category: string) => {
    switch (category) {
      case 'resolution': return CheckCircle2;
      case 'timing': return Clock3;
      case 'eligibility': return FileText;
      case 'verification': return Shield;
      default: return AlertCircle;
    }
  };

  const getRuleColor = (category: string) => {
    switch (category) {
      case 'resolution': return 'text-green-500';
      case 'timing': return 'text-blue-500';
      case 'eligibility': return 'text-yellow-500';
      case 'verification': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('backToMarkets')}
        </Button>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className={`gap-1 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            {formatNumber(Math.floor(Math.random() * 500) + 100)}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`gap-1 ${isBookmarked ? 'text-primary' : ''}`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />
            {t('share')}
          </Button>
        </div>
      </div>

      {/* Market Header Card */}
      <Card className="overflow-hidden">
        {market.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={market.imageUrl} 
              alt={getTranslatedText(market.claim, market.claimTranslations)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            
            {market.trending && (
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {t('trending')}
                </Badge>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4">
              <Badge variant="outline" className="text-xs mb-2 bg-background/80">
                {market.category}
              </Badge>
              <h1 className="text-xl font-bold text-white mb-2">
                {getTranslatedText(market.claim, market.claimTranslations)}
              </h1>
            </div>
          </div>
        )}

        <CardContent className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Market Info */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-muted-foreground">
                {getTranslatedText(market.description, market.descriptionTranslations)}
              </p>
              
              {/* Location & Source */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{market.country || market.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>{market.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{t('expiresIn')} {getTimeRemaining(market.expiresAt)}</span>
                </div>
              </div>

              {/* Pool Distribution */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('truthVerificationPool')}</span>
                  <span className="text-sm font-bold">{formatCurrency(market.totalPool)}</span>
                </div>
                <Progress 
                  value={(market.yesPool / market.totalPool) * 100} 
                  className="h-3"
                />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary">{t('truthYes')}</span>
                    <span className="font-medium">{formatCurrency(market.yesPool)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">{t('truthNo')}</span>
                    <span className="font-medium">{formatCurrency(market.noPool)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Odds & Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-sm text-muted-foreground mb-1">{t('truthYes')}</div>
                  <div className="text-2xl font-bold text-primary">{market.yesOdds.toFixed(2)}x</div>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                  <div className="text-sm text-muted-foreground mb-1">{t('truthNo')}</div>
                  <div className="text-2xl font-bold text-secondary">{market.noOdds.toFixed(2)}x</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{formatNumber(market.totalCasters)} {t('verifiers')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(Math.floor(Math.random() * 10000) + 5000)} {t('views')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length} {t('comments')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>{formatNumber(Math.floor(Math.random() * 500) + 100)} {t('likes')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
        {[
          { id: 'overview', label: t('overview'), icon: Target },
          { id: 'comments', label: t('comments'), icon: MessageCircle, count: comments.length },
          { id: 'rules', label: t('rules'), icon: Scale },
          { id: 'analysis', label: t('aiAnalysis'), icon: Zap }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t('marketOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{t('marketDescription')}</h3>
                  <p className="text-muted-foreground">
                    {getTranslatedText(market.description, market.descriptionTranslations)}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">{t('verificationMethodology')}</h3>
                  <p className="text-muted-foreground">
                    This market uses AI-powered truth verification combined with community consensus. 
                    Our system analyzes multiple credible sources, cross-references data, and incorporates 
                    expert analysis to determine the most accurate outcome.
                  </p>
                </div>
                
                <Separator />

                {/* Resolution Status - Show if market has resolution data or is not active */}
                {(market.status !== 'active' || market.resolution_data) && (
                  <>
                    <ResolutionStatus
                      market={market}
                      resolution={getResolutionData()}
                      onDispute={handleDisputeClick}
                      hcsTopicId={market.resolution_data?.hcs_topic_id}
                      transactionId={market.resolution_data?.transaction_id}
                      consensusTimestamp={market.resolution_data?.consensus_timestamp ? new Date(market.resolution_data.consensus_timestamp) : undefined}
                      disputeCount={market.dispute_count || 0}
                      canDispute={market.status === 'pending_resolution' && !!market.dispute_period_end && new Date() < new Date(market.dispute_period_end)}
                    />
                    <Separator />
                  </>
                )}
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">{t('marketStatus')}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={market.status === 'active' ? 'default' : 'secondary'}>
                      {market.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {t('expiresIn')} {getTimeRemaining(market.expiresAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t('communityDiscussion')} ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Comment */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label>{t('shareYourThoughts')}</Label>
                  <Textarea
                    placeholder={t('writeCommentPlaceholder')}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-20"
                  />
                  <div className="flex items-center justify-between">
                    <Select value={commentPosition} onValueChange={(value: any) => setCommentPosition(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">{t('neutral')}</SelectItem>
                        <SelectItem value="yes">{t('truthYes')}</SelectItem>
                        <SelectItem value="no">{t('truthNo')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleCommentSubmit} className="gap-2">
                      <Send className="h-4 w-4" />
                      {t('postComment')}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-4 bg-card/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{comment.username}</span>
                          {comment.isVerified && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                          {comment.position && (
                            <Badge 
                              variant={comment.position === 'yes' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {comment.position === 'yes' ? t('truthYes') : t('truthNo')}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm">{comment.comment}</p>
                        
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikeComment(comment.id)}
                            className={`gap-1 h-8 ${likedComments.has(comment.id) ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 h-8 text-muted-foreground">
                            <MessageCircle className="h-3 w-3" />
                            {t('reply')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {t('marketRules')} & {t('conditions')}
                </CardTitle>
                <CardDescription>
                  {t('marketRulesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rules.map((rule) => {
                  const Icon = getRuleIcon(rule.category);
                  return (
                    <div key={rule.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${getRuleColor(rule.category)}`} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{rule.title}</h4>
                            <Badge variant="outline" className="text-xs capitalize">
                              {rule.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* AI Analysis Tab */}
          {activeTab === 'analysis' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {t('aiAnalysis')} & {t('insights')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">{t('aiConfidenceScore')}</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={72} className="flex-1" />
                    <span className="font-bold">72%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('aiConfidenceExplanation')}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">{t('keyFactors')}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      Historical production trends show consistent 15% annual growth
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      Increased investment from streaming platforms
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      Economic uncertainties may impact funding
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      Quality vs quantity balance remains a challenge
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{t('dataSources')}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Nigerian Film Corporation official statistics</p>
                    <p>• Nollywood Producers Association reports</p>
                    <p>• International film industry databases</p>
                    <p>• Streaming platform content reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Casting Interface */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('castYourPosition')}
              </CardTitle>
              <CardDescription>
                {t('currentBalance')}: {userBalance.toFixed(3)} HBAR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Cast Buttons */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('quickCastTruth')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickCastAmounts.slice(0, 4).map((amount) => (
                    <Button
                      key={`yes-${amount}`}
                      variant="outline"
                      size="sm"
                      className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickCast('yes', amount);
                      }}
                      disabled={amount > userBalance}
                    >
                      <span className="text-primary font-semibold">TRUE</span>
                      <span className="ml-2">{amount} HBAR</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('quickCastFalse')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickCastAmounts.slice(0, 4).map((amount) => (
                    <Button
                      key={`no-${amount}`}
                      variant="outline"
                      size="sm"
                      className="bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickCast('no', amount);
                      }}
                      disabled={amount > userBalance}
                    >
                      <span className="text-secondary font-semibold">FALSE</span>
                      <span className="ml-2">{amount} HBAR</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Cast */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('customAmount')}</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={castPosition} onValueChange={(value: any) => handlePositionChange(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{t('truth')}</SelectItem>
                        <SelectItem value="no">{t('false')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={castAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  {/* Real-time Profit Calculator */}
                  {profitCalculation && (
                    <div className="p-3 bg-muted/30 rounded-lg border border-border">
                      <h4 className="text-sm font-medium mb-2 text-primary">Profit Calculator</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Stake:</span>
                          <span className="font-medium">{profitCalculation.amount.toFixed(3)} HBAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Odds:</span>
                          <span className="font-medium">{(castPosition === 'yes' ? market.yesOdds : market.noOdds).toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Potential Return:</span>
                          <span className="font-medium text-green-400">{profitCalculation.potential.toFixed(3)} HBAR</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1 mt-2">
                          <span className="text-muted-foreground">Profit if Correct:</span>
                          <span className="font-bold text-green-400">+{profitCalculation.profit.toFixed(3)} HBAR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Loss if Wrong:</span>
                          <span className="font-bold text-red-400">-{profitCalculation.amount.toFixed(3)} HBAR</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleCustomCast} 
                  className="w-full gap-2"
                  disabled={!castAmount || parseFloat(castAmount) > userBalance}
                >
                  <Target className="h-4 w-4" />
                  {t('castPosition')}
                </Button>
              </div>

              {/* Potential Return */}
              {castAmount && !isNaN(parseFloat(castAmount)) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t('potential_return')}</div>
                  <div className="font-semibold text-green-400">
                    {(parseFloat(castAmount) * (castPosition === 'yes' ? market.yesOdds : market.noOdds)).toFixed(3)} HBAR
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('marketStatistics')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('totalVolume')}</span>
                <span className="font-medium">{formatCurrency(market.totalPool)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('totalVerifiers')}</span>
                <span className="font-medium">{formatNumber(market.totalCasters)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('market_age')}</span>
                <span className="font-medium">5 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('liquidity')}</span>
                <span className="font-medium text-green-500">High</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={showDisputeModal}
        marketId={market.id}
        market={market}
        resolution={getResolutionData() || {} as MarketResolution}
        onSubmit={handleDisputeSubmit}
        onClose={() => setShowDisputeModal(false)}
        bondAmount={100} // Mock bond amount
        userTokenBalance={userTokenBalance}
        htsTokenId="mock-token-id"
        isSubmitting={isSubmittingDispute}
      />
    </div>
  );
}