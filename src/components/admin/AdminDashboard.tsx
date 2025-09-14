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
  Brain
} from 'lucide-react';
import { adminService, AdminStats } from '../../utils/adminService';
import AdminDisputePanel from '../AdminDisputePanel';
import { disputeService } from '../../utils/disputeService';
import { MarketDispute } from '../../utils/supabase';
import { AIAgentSimple } from '../AIAgentSimple';

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

  useEffect(() => {
    loadAdminStats();
    loadDisputes();
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Markets"
          value={stats.totalMarkets}
          icon={BarChart3}
          trend="+12% from last month"
          color="blue"
        />
        
        <StatCard
          title="Pending Approval"
          value={stats.pendingMarkets}
          icon={Clock}
          trend={stats.pendingMarkets > 5 ? "High volume" : "Normal"}
          color={stats.pendingMarkets > 5 ? "yellow" : "green"}
        />
        
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend="+8% from last month"
          color="green"
        />
        
        <StatCard
          title="Total Volume"
          value={`${stats.totalVolume} HBAR`}
          icon={DollarSign}
          trend="+15% from last month"
          color="blue"
        />
      </div>

      {/* Alerts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingMarkets > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium">{stats.pendingMarkets} Markets Awaiting Approval</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Review and approve new markets</p>
                </div>
                <Badge variant="secondary">{stats.pendingMarkets}</Badge>
              </div>
            )}
            
            {stats.flaggedContent > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="font-medium">{stats.flaggedContent} Flagged Content</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Content reported by users</p>
                </div>
                <Badge variant="destructive">{stats.flaggedContent}</Badge>
              </div>
            )}
            
            {stats.activeDisputes > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div>
                  <p className="font-medium">{stats.activeDisputes} Active Disputes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Market resolution disputes</p>
                </div>
                <Badge variant="outline">{stats.activeDisputes}</Badge>
              </div>
            )}
            
            {stats.pendingMarkets === 0 && stats.flaggedContent === 0 && stats.activeDisputes === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending actions at this time</p>
                <p className="text-sm">Great job keeping things up to date!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Navigate to market approval */}}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Review Pending Markets ({stats.pendingMarkets})
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Navigate to user management */}}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Navigate to reports */}}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Review Reports ({stats.flaggedContent})
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Navigate to analytics */}}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

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