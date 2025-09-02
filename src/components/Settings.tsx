import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Settings as SettingsIcon, User, Bell, Shield, Globe, Palette, Database, Smartphone, Languages, Moon, Sun, Volume2, VolumeX, Wallet, History, Save, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useLanguage } from './LanguageContext';
import { toast } from 'sonner@2.0.3';
import BettingPortfolio, { UserBet } from './BettingPortfolio';
import VerificationHistory, { VerificationResult } from './VerificationHistory';
import { useUser } from '../contexts/UserContext';
import { Textarea } from './ui/textarea';

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
  const { profile, updateUserProfile, loading } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    username: '',
    bio: '',
    avatar: ''
  });
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

  // Initialize profile form when profile loads
  useEffect(() => {
    if (profile && !editingProfile) {
      setProfileForm({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar: profile.avatar || ''
      });
    }
  }, [profile, editingProfile]);

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

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateUserProfile({
        displayName: profileForm.displayName,
        username: profileForm.username,
        bio: profileForm.bio,
        avatar: profileForm.avatar
      });
      setEditingProfile(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    // Reset form to current profile values
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar: profile.avatar || ''
      });
    }
  };

  const updateProfileForm = (field: keyof typeof profileForm, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Manage your public profile and account details
                  </CardDescription>
                </div>
                {!editingProfile && (
                  <Button onClick={handleEditProfile} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">Loading profile...</div>
                </div>
              ) : !profile ? (
                <div className="text-center py-8">
                  <p>Please connect your wallet to view your profile.</p>
                </div>
              ) : (
                <>
                  {/* Profile Picture */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={editingProfile ? profileForm.avatar : profile.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {(editingProfile ? profileForm.displayName : profile.displayName)?.charAt(0)?.toUpperCase() ||
                         (editingProfile ? profileForm.username : profile.username)?.charAt(0)?.toUpperCase() || 
                         'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      {editingProfile ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Avatar URL"
                            value={profileForm.avatar}
                            onChange={(e) => updateProfileForm('avatar', e.target.value)}
                            className="w-48"
                          />
                          <p className="text-xs text-muted-foreground">
                            Recommended: Square image, at least 400x400px
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground">
                            {profile.avatar ? 'Custom avatar set' : 'Using default avatar'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Click "Edit Profile" to change your avatar
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      {editingProfile ? (
                        <Input
                          id="displayName"
                          value={profileForm.displayName}
                          onChange={(e) => updateProfileForm('displayName', e.target.value)}
                          placeholder="Your display name"
                        />
                      ) : (
                        <div className="p-2 bg-muted/50 rounded-md text-sm">
                          {profile.displayName || 'No display name set'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      {editingProfile ? (
                        <Input
                          id="username"
                          value={profileForm.username}
                          onChange={(e) => updateProfileForm('username', e.target.value)}
                          placeholder="@username"
                        />
                      ) : (
                        <div className="p-2 bg-muted/50 rounded-md text-sm">
                          {profile.username ? `@${profile.username}` : 'No username set'}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="walletAddress">Wallet Address</Label>
                      <div className="p-2 bg-muted/50 rounded-md text-sm font-mono">
                        {profile.walletAddress}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {editingProfile ? (
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => updateProfileForm('bio', e.target.value)}
                        placeholder="Tell the community about yourself and your truth verification interests..."
                        rows={4}
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md text-sm min-h-[100px]">
                        {profile.bio || 'No bio provided'}
                      </div>
                    )}
                  </div>

                  {/* User Statistics */}
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3">Your Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{profile.stats.marketsCreated}</div>
                        <div className="text-xs text-muted-foreground">Markets Created</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{profile.stats.totalBetsPlaced}</div>
                        <div className="text-xs text-muted-foreground">Bets Placed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{profile.stats.correctPredictions}</div>
                        <div className="text-xs text-muted-foreground">Correct Predictions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{profile.stats.reputationScore}</div>
                        <div className="text-xs text-muted-foreground">Reputation</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {editingProfile ? (
                    <div className="flex gap-2">
                      <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                        {saving ? (
                          'Saving...'
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
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