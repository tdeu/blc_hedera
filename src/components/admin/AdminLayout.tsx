import React from 'react';
import { Shield, BarChart3, Users, Settings, FileCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile?: {
    walletAddress: string;
    displayName?: string;
  };
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  userProfile 
}) => {
  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'markets', label: 'Market Approval', icon: FileCheck },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports & Flags', icon: AlertTriangle },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                BlockCast Admin
              </h1>
              <Badge variant="destructive" className="ml-2">
                ADMIN MODE
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">
                    {userProfile.displayName || `Admin ${userProfile.walletAddress.slice(-6)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Admin Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Panel</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => onTabChange(tab.id)}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {tab.label}
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Admin Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;