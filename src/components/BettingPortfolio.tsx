import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Wallet, TrendingUp, TrendingDown, Clock, DollarSign, Award, Target, Users, Zap, Vote, CheckCircle, XCircle, AlertTriangle, Plus, Minus, Eye, BarChart3, PieChart, Activity } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface UserBet {
  id: string;
  marketId: string;
  marketClaim?: string;
  position: 'yes' | 'no';
  amount: number;
  odds?: number;
  potentialWinning?: number;
  potentialReturn?: number;
  placedAt: Date;
  status: 'active' | 'won' | 'lost' | 'pending';
  resolvedAt?: Date;
  actualWinning?: number;
  blockchainTxId?: string; // Hedera transaction ID - added for blockchain integration
}

interface BettingPortfolioProps {
  userBalance: number;
  userBets: UserBet[];
  onAddFunds?: () => void;
  onWithdraw?: () => void;
}

export default function BettingPortfolio({ userBalance, userBets, onAddFunds, onWithdraw }: BettingPortfolioProps) {
  // Default handlers if not provided
  const handleAddFunds = onAddFunds || (() => { window.alert('Add funds functionality coming soon!'); });
  const handleWithdraw = onWithdraw || (() => { window.alert('Withdraw functionality coming soon!'); });
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate portfolio stats
  const totalCastAmount = userBets.reduce((sum, cast) => sum + cast.amount, 0);
  const activeCasts = userBets.filter(cast => cast.status === 'active');
  const resolvedCasts = userBets.filter(cast => cast.status === 'won' || cast.status === 'lost');
  const wonCasts = userBets.filter(cast => cast.status === 'won');
  const totalWinnings = wonCasts.reduce((sum, cast) => sum + (cast.actualWinning || 0), 0);
  const totalPotentialWinnings = activeCasts.reduce((sum, cast) => sum + (cast.potentialWinning || cast.potentialReturn || 0), 0);
  const winRate = resolvedCasts.length > 0 ? (wonCasts.length / resolvedCasts.length) * 100 : 0;
  const totalPnL = totalWinnings - resolvedCasts.reduce((sum, cast) => sum + cast.amount, 0);

  // Truth casting accuracy (simulated)
  const truthAccuracy = 87.3; // Percentage of correct truth predictions

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'lost':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">WON</Badge>;
      case 'lost':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">LOST</Badge>;
      case 'active':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">ACTIVE</Badge>;
      default:
        return <Badge variant="outline">PENDING</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    return position === 'yes' ? 
      <Badge className="bg-primary/20 text-primary border-primary/30">TRUE</Badge> :
      <Badge className="bg-secondary/20 text-secondary border-secondary/30">FALSE</Badge>;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
            <Wallet className="h-7 w-7" />
            Truth Casting Portfolio
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your truth verification positions • Monitor accuracy • Manage funds
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleAddFunds} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
          <Button onClick={handleWithdraw} variant="outline" className="gap-2">
            <Minus className="h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Available Balance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{userBalance.toFixed(3)} ETH</p>
            <p className="text-sm text-muted-foreground">Ready for casting</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Vote className="h-5 w-5 text-secondary" />
              <span className="font-semibold text-secondary">Total Cast</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalCastAmount.toFixed(3)} ETH</p>
            <p className="text-sm text-muted-foreground">Across {userBets.length} positions</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-500">Truth Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{truthAccuracy}%</p>
            <p className="text-sm text-muted-foreground">Verification success rate</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-yellow-500">P&L</span>
            </div>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(3)} ETH
            </p>
            <p className="text-sm text-muted-foreground">
              {winRate.toFixed(1)}% win rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Activity className="h-4 w-4" />
            Active Casts ({activeCasts.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Cast History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Performance */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Truth Casting Performance
              </CardTitle>
              <CardDescription>Your verification accuracy and earnings overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Position Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">TRUE Positions</span>
                      <span className="font-medium text-primary">
                        {userBets.filter(c => c.position === 'yes').length} casts
                      </span>
                    </div>
                    <Progress 
                      value={(userBets.filter(c => c.position === 'yes').length / userBets.length) * 100} 
                      className="h-2" 
                    />
                    
                    <div className="flex justify-between">
                      <span className="text-sm">FALSE Positions</span>
                      <span className="font-medium text-secondary">
                        {userBets.filter(c => c.position === 'no').length} casts
                      </span>
                    </div>
                    <Progress 
                      value={(userBets.filter(c => c.position === 'no').length / userBets.length) * 100} 
                      className="h-2 [&>div]:bg-secondary" 
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Cast Results</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Won Casts</span>
                      <span className="font-medium text-green-500">
                        {wonCasts.length} / {resolvedCasts.length}
                      </span>
                    </div>
                    <Progress value={winRate} className="h-2 [&>div]:bg-green-500" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Active Casts</span>
                      <span className="font-medium text-yellow-500">
                        {activeCasts.length} pending
                      </span>
                    </div>
                    <Progress 
                      value={userBets.length > 0 ? (activeCasts.length / userBets.length) * 100 : 0} 
                      className="h-2 [&>div]:bg-yellow-500" 
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{activeCasts.length}</div>
                  <div className="text-sm text-muted-foreground">Active Casts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {totalPotentialWinnings.toFixed(2)} ETH
                  </div>
                  <div className="text-sm text-muted-foreground">Potential Winnings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {userBets.length > 0 ? ((userBets.filter(c => c.position === 'yes').length / userBets.length) * 100).toFixed(0) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">TRUE Bias</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {userBets.filter(c => c.status === 'active' && 
                      c.expiresAt && new Date(c.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                    ).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recent Activity</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Truth Casts
              </CardTitle>
              <CardDescription>Your latest verification positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userBets.slice(0, 5).map((cast) => (
                  <div key={cast.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(cast.status)}
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{cast.marketClaim || 'Market position'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPositionBadge(cast.position)}
                          <span className="text-sm text-muted-foreground">
                            {cast.amount} ETH @ {cast.odds || 2.0}x
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        cast.status === 'won' ? 'text-green-500' : 
                        cast.status === 'lost' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {cast.status === 'won' && cast.actualWinning ? 
                          `+${cast.actualWinning.toFixed(3)} ETH` :
                          cast.status === 'lost' ? 
                            `-${cast.amount.toFixed(3)} ETH` :
                            `${(cast.potentialWinning || cast.potentialReturn || 0).toFixed(3)} ETH`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(cast.placedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeCasts.length === 0 ? (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Vote className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">No Active Truth Casts</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active truth verification positions right now.
                </p>
                <Button onClick={() => window.location.reload()} className="gap-2">
                  <Zap className="h-4 w-4" />
                  Browse Truth Markets
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeCasts.map((cast) => (
              <Card key={cast.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(cast.status)}
                        {getPositionBadge(cast.position)}
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(cast.placedAt)}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-foreground leading-tight">
                        {cast.marketClaim}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cast Amount:</span>
                          <div className="font-semibold text-foreground">{cast.amount} ETH</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Odds:</span>
                          <div className="font-semibold text-foreground">{cast.odds}x</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Potential Win:</span>
                          <div className="font-semibold text-green-500">{(cast.potentialWinning || cast.potentialReturn || 0).toFixed(3)} ETH</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Position:</span>
                          <div className={`font-semibold ${cast.position === 'yes' ? 'text-primary' : 'text-secondary'}`}>
                            {cast.position === 'yes' ? 'TRUE' : 'FALSE'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View Market
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {resolvedCasts.length === 0 ? (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">No Cast History</h3>
                <p className="text-muted-foreground">
                  Your resolved truth verification positions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            resolvedCasts.map((cast) => (
              <Card key={cast.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(cast.status)}
                        {getPositionBadge(cast.position)}
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Resolved {cast.resolvedAt ? formatTimeAgo(cast.resolvedAt) : 'Recently'}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-foreground leading-tight">
                        {cast.marketClaim}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cast Amount:</span>
                          <div className="font-semibold text-foreground">{cast.amount} ETH</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Odds:</span>
                          <div className="font-semibold text-foreground">{cast.odds}x</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Position:</span>
                          <div className={`font-semibold ${cast.position === 'yes' ? 'text-primary' : 'text-secondary'}`}>
                            {cast.position === 'yes' ? 'TRUE' : 'FALSE'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Result:</span>
                          <div className={`font-semibold ${cast.status === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                            {cast.status === 'won' ? 'CORRECT' : 'INCORRECT'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">P&L:</span>
                          <div className={`font-semibold ${
                            cast.status === 'won' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {cast.status === 'won' ? 
                              `+${(cast.actualWinning! - cast.amount).toFixed(3)} ETH` :
                              `-${cast.amount.toFixed(3)} ETH`
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}