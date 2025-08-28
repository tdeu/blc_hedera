import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Settings as SettingsIcon, User, Bell, Shield, Globe, Palette, Database, Smartphone, Languages, Moon, Sun, Volume2, VolumeX, Wallet, History } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useLanguage } from './LanguageContext';
import { toast } from 'sonner@2.0.3';
import BettingPortfolio, { UserBet } from './BettingPortfolio';
import VerificationHistory, { VerificationResult } from './VerificationHistory';

interface SettingsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userBalance?: number;
  userBets?: UserBet[];
  verificationHistory?: VerificationResult[];
  onSelectVerification?: (result: VerificationResult) => void;
}

export default function Settings({ isDarkMode, onToggleDarkMode, userBalance = 0, userBets = [], verificationHistory = [], onSelectVerification }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    truthMarkets: true,
    communityUpdates: true,
    governance: false,
    marketing: false,
    soundEnabled: true
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    historyVisible: false,
    activityVisible: true
  });

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪', native: 'Kiswahili' },
  ];

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as any);
    toast.success(`Language changed to ${languageOptions.find(l => l.code === newLanguage)?.native}`);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast.success(value ? 'Notification enabled' : 'Notification disabled');
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    toast.success('Privacy setting updated');
  };

  const handleExportData = () => {
    toast.success('Data export started! You will receive an email when ready.');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requires email confirmation. Check your inbox.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
            <SettingsIcon className="h-7 w-7" />
            {t('nav.settings')}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, preferences, and privacy settings
          </p>
        </div>
      </div>

      {/* Settings Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="gap-2">
            <Wallet className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <BettingPortfolio userBalance={userBalance} userBets={userBets} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <VerificationHistory 
            verificationHistory={verificationHistory} 
            onSelectVerification={onSelectVerification}
          />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your public profile and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue="TruthSeeker_001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select defaultValue="nigeria">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nigeria">🇳🇬 Nigeria</SelectItem>
                      <SelectItem value="kenya">🇰🇪 Kenya</SelectItem>
                      <SelectItem value="south-africa">🇿🇦 South Africa</SelectItem>
                      <SelectItem value="ghana">🇬🇭 Ghana</SelectItem>
                      <SelectItem value="senegal">🇸🇳 Senegal</SelectItem>
                      <SelectItem value="cote-divoire">🇨🇮 Côte d'Ivoire</SelectItem>
                      <SelectItem value="morocco">🇲🇦 Morocco</SelectItem>
                      <SelectItem value="egypt">🇪🇬 Egypt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="africa/lagos">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="africa/lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="africa/nairobi">Africa/Nairobi (EAT)</SelectItem>
                      <SelectItem value="africa/johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                      <SelectItem value="africa/cairo">Africa/Cairo (EET)</SelectItem>
                      <SelectItem value="africa/casablanca">Africa/Casablanca (WET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="w-full min-h-[100px] px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Tell the community about yourself and your truth verification interests..."
                  defaultValue="Passionate about fighting misinformation across Africa. Specialized in economic and political fact-checking."
                />
              </div>

              {/* Verification Status */}
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">Verification Status</h4>
                    <p className="text-sm text-muted-foreground">Complete verification to increase trust</p>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                    Partial
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Email verified</span>
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30">✓</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Phone verified</span>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Identity verified</span>
                    <Badge variant="outline">Not started</Badge>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Complete Verification
                </Button>
              </div>

              <Button className="w-full">Save Profile Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize your Blockcast experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Language & Region</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Interface Language</Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="mr-2">{lang.flag}</span>
                            {lang.native}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Currency Display</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="ngn">Nigerian Naira (₦)</SelectItem>
                        <SelectItem value="kes">Kenyan Shilling (KSh)</SelectItem>
                        <SelectItem value="zar">South African Rand (R)</SelectItem>
                        <SelectItem value="ghs">Ghanaian Cedi (₵)</SelectItem>
                        <SelectItem value="xof">CFA Franc (CFA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Theme Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Appearance</h4>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme for better night viewing</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleDarkMode}
                    className="gap-2"
                  >
                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    {isDarkMode ? 'Dark' : 'Light'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Show more content in less space</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">Play sounds for interactions</p>
                  </div>
                  <Switch 
                    checked={notifications.soundEnabled}
                    onCheckedChange={(checked) => handleNotificationChange('soundEnabled', checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Mobile Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Mobile Experience</h4>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-rotate</Label>
                    <p className="text-sm text-muted-foreground">Automatically rotate content on mobile</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Haptic Feedback</Label>
                    <p className="text-sm text-muted-foreground">Vibrate on interactions (mobile only)</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what updates you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Truth Markets */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Truth Markets</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Market Resolutions</Label>
                    <p className="text-sm text-muted-foreground">When markets you participated in are resolved</p>
                  </div>
                  <Switch 
                    checked={notifications.truthMarkets}
                    onCheckedChange={(checked) => handleNotificationChange('truthMarkets', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New African Markets</Label>
                    <p className="text-sm text-muted-foreground">When new truth markets are created in your region</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">When odds change significantly on your positions</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              {/* Community */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Community</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Community Updates</Label>
                    <p className="text-sm text-muted-foreground">Posts and discussions from your communities</p>
                  </div>
                  <Switch 
                    checked={notifications.communityUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('communityUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mentions</Label>
                    <p className="text-sm text-muted-foreground">When someone mentions you in discussions</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Followers</Label>
                    <p className="text-sm text-muted-foreground">When someone follows your truth verification activity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              {/* Governance */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Governance</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Proposals</Label>
                    <p className="text-sm text-muted-foreground">When new governance proposals are submitted</p>
                  </div>
                  <Switch 
                    checked={notifications.governance}
                    onCheckedChange={(checked) => handleNotificationChange('governance', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Voting Reminders</Label>
                    <p className="text-sm text-muted-foreground">Reminders before voting deadlines</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Results</Label>
                    <p className="text-sm text-muted-foreground">When proposals you voted on are resolved</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              {/* Delivery Methods */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Delivery Methods</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser and mobile push notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important alerts via SMS (fees may apply)</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>
                Control who can see your information and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Visibility */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Profile Visibility</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">Allow others to view your profile and stats</p>
                  </div>
                  <Switch 
                    checked={privacy.profileVisible}
                    onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verification History</Label>
                    <p className="text-sm text-muted-foreground">Show your truth verification history publicly</p>
                  </div>
                  <Switch 
                    checked={privacy.historyVisible}
                    onCheckedChange={(checked) => handlePrivacyChange('historyVisible', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activity Status</Label>
                    <p className="text-sm text-muted-foreground">Show when you're online or active</p>
                  </div>
                  <Switch 
                    checked={privacy.activityVisible}
                    onCheckedChange={(checked) => handlePrivacyChange('activityVisible', checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Security Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Security</h4>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Change Password
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Setup Two-Factor Authentication
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Active Sessions
                </Button>
              </div>

              <Separator />

              {/* Data Control */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Data Control</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">Help improve the platform with usage data</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Personalized Content</Label>
                    <p className="text-sm text-muted-foreground">Show content based on your activity</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates about new features</p>
                  </div>
                  <Switch 
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export, backup, or delete your account data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Export */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your Blockcast data including verification history, posts, and settings.
                </p>
                
                <Button onClick={handleExportData} className="w-full" variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
              </div>

              <Separator />

              {/* Storage Usage */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Storage Usage</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Verification History</span>
                    <span className="text-sm font-medium">2.4 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Community Posts</span>
                    <span className="text-sm font-medium">856 KB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Truth Market Data</span>
                    <span className="text-sm font-medium">1.2 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache & Temporary</span>
                    <span className="text-sm font-medium">432 KB</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Usage</span>
                    <span>4.9 MB</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Clear Cache & Temporary Data
                </Button>
              </div>

              <Separator />

              {/* Account Deletion */}
              <div className="space-y-4">
                <h4 className="font-semibold text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground">
                  These actions are permanent and cannot be undone.
                </p>
                
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <h5 className="font-semibold text-destructive mb-2">Delete Account</h5>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be reversed.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="w-full"
                  >
                    Delete My Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}