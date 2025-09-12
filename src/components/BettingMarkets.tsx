import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { TrendingUp, TrendingDown, Users, Clock, Target, Star, MessageCircle, Filter, ChevronDown, Share2, Heart, Bookmark, Zap, Globe, Shield, Search, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from './LanguageContext';
import ShareModal from './ShareModal';

export interface BettingMarket {
  id: string;
  claim: string;
  claimTranslations?: {
    en: string;
    fr: string;
    sw: string;
  };
  category: string;
  subcategory?: string;
  source: string;
  description: string;
  descriptionTranslations?: {
    en: string;
    fr: string;
    sw: string;
  };
  totalPool: number;
  yesPool: number;
  noPool: number;
  yesOdds: number;
  noOdds: number;
  totalCasters: number;
  expiresAt: Date;
  status: 'active' | 'pending_resolution' | 'disputing' | 'resolved' | 'disputed_resolution' | 'locked';
  resolution?: 'yes' | 'no';
  trending: boolean;
  imageUrl?: string;
  country?: string;
  region?: string;
  marketType: 'present' | 'future';
  confidenceLevel: 'high' | 'medium' | 'low';
  // Resolution system fields
  resolution_data?: {
    outcome?: 'yes' | 'no';
    source?: string;
    confidence?: 'high' | 'medium' | 'low';
    timestamp?: string;
    final_outcome?: 'yes' | 'no';
    resolved_by?: 'api' | 'admin' | 'contract';
    admin_notes?: string;
    hcs_topic_id?: string;
    transaction_id?: string;
    consensus_timestamp?: string;
  };
  dispute_count?: number;
  dispute_period_end?: string;
}

interface BettingMarketsProps {
  onPlaceBet: (marketId: string, position: 'yes' | 'no', amount: number) => void;
  userBalance: number;
  onMarketSelect?: (market: BettingMarket) => void;
  markets?: BettingMarket[];
  onCreateMarket?: () => void;
}

// No more dummy markets - all markets come from Supabase now  
export const realTimeMarkets: BettingMarket[] = [];

export default function BettingMarkets({ onPlaceBet, userBalance, onMarketSelect, markets = [], onCreateMarket }: BettingMarketsProps) {
  const [showBetDialog, setShowBetDialog] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);
  const [betPosition, setBetPosition] = useState<'yes' | 'no'>('yes');
  const [betAmount, setBetAmount] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedConfidence, setSelectedConfidence] = useState('all');
  const { language } = useLanguage();

  // Ensure all markets have safe default values to prevent crashes
  const safeMarkets = markets.map(market => ({
    ...market,
    claim: market.claim || 'Untitled Market',
    category: market.category || 'General', 
    source: market.source || 'Unknown',
    totalPool: market.totalPool || 0,
    yesPool: market.yesPool || 0,
    noPool: market.noPool || 0,
    totalCasters: market.totalCasters || 0,
    yesOdds: market.yesOdds || 2.0,
    noOdds: market.noOdds || 2.0,
    confidenceLevel: market.confidenceLevel || 'medium',
    expiresAt: market.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 24h from now
  }));

  // Filter markets
  const filteredMarkets = safeMarkets.filter(market => {
    const matchesSearch = (market.claim || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (market.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (market.source || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || market.category === selectedCategory;
    const matchesCountry = selectedCountry === 'all' || market.country === selectedCountry || market.region === selectedCountry;
    const matchesConfidence = selectedConfidence === 'all' || market.confidenceLevel === selectedConfidence;
    
    return matchesSearch && matchesCategory && matchesCountry && matchesConfidence;
  });

  // Sort markets (trending first, then by total pool)
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    return b.totalPool - a.totalPool;
  });

  // Get unique categories and countries for filters
  const categories = ['all', ...Array.from(new Set(markets.map(m => m.category)))];
  const countries = ['all', ...Array.from(new Set(markets.map(m => m.country || m.region).filter(Boolean)))];

  const handleOpenBetDialog = (market: BettingMarket, position: 'yes' | 'no') => {
    setSelectedMarket(market);
    setBetPosition(position);
    setBetAmount('');
    setShowBetDialog(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket || !betAmount) return;
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await onPlaceBet(selectedMarket.id, betPosition, amount);
      setShowBetDialog(false);
      // Success message will be shown by the parent component
    } catch (error) {
      // Error message will be shown by the parent component
    }
  };

  const handleShareMarket = (market: BettingMarket) => {
    setSelectedMarket(market);
    setShowShareModal(true);
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0';
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const getClaimText = (market: BettingMarket): string => {
    if (language !== 'en' && market.claimTranslations) {
      return market.claimTranslations[language] || market.claim;
    }
    return market.claim;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section - Enhanced Mobile Layout */}
      <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-xl p-4 md:p-6 lg:p-8 border border-primary/30">
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Truth Markets
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Verify truth and cast positions on trending African news. Join the community fighting misinformation.
          </p>
        </div>

        {/* Search and Filters - Horizontal Layout Matching Image */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Bar - Left Side */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search markets, categories, or sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 md:h-12 bg-background/50 border-primary/30 focus:border-primary text-sm md:text-base"
              />
            </div>
          </div>

          {/* Filter Dropdowns - Center */}
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 h-11 bg-background/50 border-primary/30 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value="trending" onValueChange={() => {}}>
              <SelectTrigger className="w-32 h-11 bg-background/50 border-primary/30 text-sm">
                <SelectValue placeholder="Trending" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>

            <Select value="all" onValueChange={() => {}}>
              <SelectTrigger className="w-32 h-11 bg-background/50 border-primary/30 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="future">Future</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Markets Counter & Create Button - Right Side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">
                31 Active Markets
              </span>
            </div>
            {onCreateMarket && (
              <Button 
                onClick={onCreateMarket}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Market
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Markets Grid - Responsive */}
      {sortedMarkets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No markets found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sortedMarkets.map((market) => (
            <Card 
              key={market.id} 
              className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-border hover:border-primary/50 ${
                market.trending ? 'trending-corner' : ''
              }`}
              onClick={() => onMarketSelect && onMarketSelect(market)}
            >
              {market.trending && (
                <div className="absolute top-0 left-0 z-10">
                  <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-2 py-1 text-xs font-bold transform -rotate-45 translate-x-[-8px] translate-y-[10px] shadow-lg">
                    TRENDING
                  </div>
                </div>
              )}

              {market.imageUrl && (
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={market.imageUrl} 
                    alt={market.claim}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  {/* Confidence Badge */}
                  <Badge 
                    className={`absolute top-2 right-2 text-xs px-2 py-1 ${
                      market.confidenceLevel === 'high' ? 'bg-green-500/90 text-white' :
                      market.confidenceLevel === 'medium' ? 'bg-yellow-500/90 text-white' :
                      'bg-red-500/90 text-white'
                    }`}
                  >
                    {(market.confidenceLevel || 'medium').toUpperCase()}
                  </Badge>

                  {/* Country/Region Badge */}
                  {(market.country || market.region) && (
                    <Badge variant="secondary" className="absolute top-2 left-2 text-xs bg-background/90 text-foreground">
                      {market.country || market.region}
                    </Badge>
                  )}
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {market.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareMarket(market);
                    }}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardTitle className="text-sm md:text-base leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                  {getClaimText(market)}
                </CardTitle>
                
                <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                  Source: {market.source}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pool Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Pool</span>
                    <span className="font-semibold">{formatCurrency(market.totalPool)} HBAR</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-muted-foreground">{formatCurrency(market.totalCasters)} verifiers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-muted-foreground">{formatTimeRemaining(market.expiresAt)}</span>
                    </div>
                  </div>

                  {/* Pool Distribution */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${market.totalPool > 0 ? (market.yesPool / market.totalPool) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>True: {market.totalPool > 0 ? ((market.yesPool / market.totalPool) * 100).toFixed(1) : '0.0'}%</span>
                    <span>False: {market.totalPool > 0 ? ((market.noPool / market.totalPool) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                </div>

                {/* Betting Buttons - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBetDialog(market, 'yes');
                    }}
                    className="flex-1 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400 hover:text-green-300 h-9 text-xs md:text-sm"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    True {market.yesOdds.toFixed(2)}x
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBetDialog(market, 'no');
                    }}
                    className="flex-1 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 h-9 text-xs md:text-sm"
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    False {market.noOdds.toFixed(2)}x
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bet Dialog */}
      <AlertDialog open={showBetDialog} onOpenChange={setShowBetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cast Your Truth Position</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedMarket?.claim}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Source: {selectedMarket?.source}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={betPosition === 'yes' ? 'default' : 'outline'}
                    onClick={() => setBetPosition('yes')}
                    className="h-auto p-3 flex-col gap-1"
                  >
                    <span className="text-lg">True</span>
                    <span className="text-sm opacity-80">
                      {selectedMarket?.yesOdds.toFixed(2)}x odds
                    </span>
                  </Button>
                  <Button
                    variant={betPosition === 'no' ? 'default' : 'outline'}
                    onClick={() => setBetPosition('no')}
                    className="h-auto p-3 flex-col gap-1"
                  >
                    <span className="text-lg">False</span>
                    <span className="text-sm opacity-80">
                      {selectedMarket?.noOdds.toFixed(2)}x odds
                    </span>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="betAmount">Amount (HBAR)</Label>
                  <Input
                    id="betAmount"
                    type="number"
                    step="0.001"
                    min="0.001"
                    max={userBalance}
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Enter amount..."
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Balance: {userBalance.toFixed(3)} HBAR</span>
                    {betAmount && selectedMarket && (
                      <span>
                        Potential win: {(parseFloat(betAmount) * (betPosition === 'yes' ? selectedMarket.yesOdds : selectedMarket.noOdds)).toFixed(3)} HBAR
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePlaceBet}>
              Cast Position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedMarket(null);
          }}
          market={selectedMarket}
        />
      )}
    </div>
  );
}