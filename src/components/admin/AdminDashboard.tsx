import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  BarChart3,
  Users,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  Brain,
  Calendar,
  History,
  Timer,
  EyeOff,
  Eye
} from 'lucide-react';
import { adminService, AdminStats } from '../../utils/adminService';
import AdminDisputePanel from '../AdminDisputePanel';
import { disputeService } from '../../utils/disputeService';
import { MarketDispute } from '../../utils/supabase';
import { AIAgentSimple } from '../AIAgentSimple';
import { approvedMarketsService } from '../../utils/approvedMarketsService';
import { BettingMarket } from '../BettingMarkets';

interface AdminOverviewProps {
  userProfile?: {
    walletAddress: string;
    displayName?: string;
  };
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ userProfile }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<MarketDispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
    loadDisputes();
    loadMarkets();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const adminStats = await adminService.getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDisputes = async () => {
    try {
      setDisputesLoading(true);
      const pendingDisputes = await disputeService.getPendingDisputes();
      setDisputes(pendingDisputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setDisputesLoading(false);
    }
  };

  const loadMarkets = async () => {
    try {
      setMarketsLoading(true);
      const allMarkets = await approvedMarketsService.getApprovedMarkets();
      setMarkets(allMarkets);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setMarketsLoading(false);
    }
  };

  // Helper functions to categorize markets
  const categorizeMarkets = (markets: BettingMarket[]) => {
    const now = new Date();

    // Filter out offline markets for public display but include them in admin counts
    const activeMarkets = markets.filter(market => market.status !== 'offline');

    const futureMarkets = activeMarkets.filter(market =>
      market.marketType === 'future' &&
      market.status === 'active' &&
      market.expiresAt && market.expiresAt > now
    );

    const pastMarkets = activeMarkets.filter(market =>
      market.marketType === 'present' ||
      (market.marketType === 'future' && market.status !== 'active')
    );

    const expiredMarkets = activeMarkets.filter(market =>
      market.marketType === 'future' &&
      market.expiresAt && market.expiresAt <= now
    );

    const offlineMarkets = markets.filter(market => market.status === 'offline');

    return {
      future: futureMarkets,
      past: pastMarkets,
      expired: expiredMarkets,
      offline: offlineMarkets,
      total: markets.length
    };
  };

  const handleReviewDispute = async (disputeId: string, decision: any) => {
    try {
      await disputeService.reviewDispute(disputeId, decision);
      // Reload disputes after review
      await loadDisputes();
      await loadAdminStats(); // Update stats as well
    } catch (error) {
      console.error('Error reviewing dispute:', error);
      throw error; // Re-throw to let the component handle the error
    }
  };

  const handleOfflineMarket = async (market: BettingMarket) => {
    if (!userProfile?.walletAddress) {
      console.error('Admin wallet not connected');
      return;
    }

    try {
      const success = await adminService.offlineMarket(
        market.id,
        userProfile.walletAddress,
        'Market taken offline by admin'
      );

      if (success) {
        console.log(`Market "${market.claim}" has been taken offline`);
        // Reload markets to reflect the change
        await loadMarkets();
      } else {
        console.error('Failed to offline market');
      }
    } catch (error) {
      console.error('Error offlining market:', error);
    }
  };

  const handleOnlineMarket = async (market: BettingMarket) => {
    if (!userProfile?.walletAddress) {
      console.error('Admin wallet not connected');
      return;
    }

    try {
      const success = await adminService.onlineMarket(
        market.id,
        userProfile.walletAddress,
        'Market brought back online by admin'
      );

      if (success) {
        console.log(`Market "${market.claim}" has been brought back online`);
        // Reload markets to reflect the change
        await loadMarkets();
      } else {
        console.error('Failed to bring market online');
      }
    } catch (error) {
      console.error('Error bringing market online:', error);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "default" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color?: "default" | "green" | "red" | "blue" | "yellow";
  }) => {
    const colorClasses = {
      default: "bg-white dark:bg-gray-800",
      green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
    };

    return (
      <Card className={colorClasses[color]}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">Failed to load admin statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome to BlockCast Admin</h2>
        <p className="opacity-90">
          Manage markets, users, and platform operations. Current admin: {' '}
          {userProfile?.displayName || `${userProfile?.walletAddress?.slice(0, 6)}...${userProfile?.walletAddress?.slice(-4)}`}
        </p>
      </div>

      {/* Key Metrics - Real Market Data */}
      {(() => {
        const marketData = categorizeMarkets(markets);
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Future Markets"
              value={marketData.future.length}
              icon={Calendar}
              trend={`${marketData.future.length} active betting markets`}
              color="blue"
            />

            <StatCard
              title="Past Events"
              value={marketData.past.length}
              icon={History}
              trend={`${marketData.past.length} verification markets`}
              color="green"
            />

            <StatCard
              title="Expired Markets"
              value={marketData.expired.length}
              icon={Timer}
              trend={`${marketData.expired.length} awaiting resolution`}
              color="yellow"
            />

            <StatCard
              title="Total Markets"
              value={marketData.total}
              icon={BarChart3}
              trend={`${marketData.total} total markets`}
              color="default"
            />
          </div>
        );
      })()}

      {/* Market Listings by Type */}
      {(() => {
        const marketData = categorizeMarkets(markets);

        const MarketCard = ({ market }: { market: BettingMarket }) => (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm line-clamp-1">{market.claim}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{market.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {market.expiresAt ? new Date(market.expiresAt).toLocaleDateString() : 'No expiry'}
                </span>
                {market.status === 'offline' && (
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                    Offline
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{market.totalPool.toFixed(2)} HBAR</p>
                <p className="text-xs text-muted-foreground">{market.totalCasters} bets</p>
              </div>
              {market.status === 'offline' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOnlineMarket(market)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Bring market back online"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOfflineMarket(market)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Take market offline"
                >
                  <EyeOff className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        );

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Future Markets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Future Markets ({marketData.future.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                  {marketData.future.length > 0 ? (
                    marketData.future.slice(0, 10).map(market => (
                      <MarketCard key={market.id} market={market} />
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No future markets</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Past Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Past Events ({marketData.past.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                  {marketData.past.length > 0 ? (
                    marketData.past.slice(0, 10).map(market => (
                      <MarketCard key={market.id} market={market} />
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No past events</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expired Markets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Expired Markets ({marketData.expired.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                  {marketData.expired.length > 0 ? (
                    marketData.expired.slice(0, 10).map(market => (
                      <MarketCard key={market.id} market={market} />
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No expired markets</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Offline Markets Section */}
            {marketData.offline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <EyeOff className="h-5 w-5" />
                    Offline Markets ({marketData.offline.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                  {marketData.offline.map(market => (
                    <MarketCard key={market.id} market={market} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Dispute Management Section */}
      {stats && stats.activeDisputes > 0 && (
        <div className="mt-6">
          <AdminDisputePanel
            disputes={disputes}
            onReviewDispute={handleReviewDispute}
            showHCSHistory={true}
            showBondTransactions={true}
            enableContractArbitration={false}
            isLoading={disputesLoading}
          />
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Blockchain Services</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Hedera Network: Online</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Smart Contracts: Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">HCS Topics: Healthy</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">AI Agent Status</h4>
              <AIAgentSimple compact={true} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Panel - Temporarily disabled for debugging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="p-6 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-medium mb-2">AI Agent Integration</h3>
            <p className="text-sm text-muted-foreground">
              AI Agent components temporarily disabled while debugging. 
              The BlockCast AI Agent with multi-language support and cultural context will be restored once dependencies are resolved.
            </p>
          </div>
        </div>
        <div>
          <div className="p-6 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Coming Soon</h4>
            <p className="text-xs text-muted-foreground">
              Advanced AI status panel with real-time dispute analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;