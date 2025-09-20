import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Menu, Shield, Settings, Moon, Sun, TrendingUp, Wallet, Bell, Users, Languages, ChevronDown, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useLanguage } from './LanguageContext';
import { useUser } from '../contexts/UserContext';
// Logo placeholder - replace with actual image when available

interface TopNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userBalance: number;
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
  onDisconnectWallet?: () => void;
}

export default function TopNavigation({ currentTab, onTabChange, isDarkMode, onToggleDarkMode, userBalance, walletConnected, walletAddress, onConnectWallet, onDisconnectWallet }: TopNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { profile } = useUser();

  // Simplified main navigation - unified markets approach
  const mainNavItems = [
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'community', label: 'Community', icon: Users },
  ];

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  ];

  const handleNavClick = (tabId: string) => {
    // Handle settings with tab parameters
    if (tabId.includes('?tab=')) {
      const [mainTab, params] = tabId.split('?');
      onTabChange(mainTab);
      // Update URL to include tab parameter
      const url = new URL(window.location.href);
      url.search = params;
      window.history.replaceState({}, '', url.toString());
    } else {
      onTabChange(tabId);
      // Clear URL parameters for non-settings tabs
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    setShowMobileMenu(false);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto lg:px-8">
          {/* Left: Logo and Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                BC
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">Blockcast</h1>
              </div>
            </div>

            {/* Desktop Navigation Links - Simplified */}
            <nav className="hidden lg:flex items-center space-x-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => handleNavClick(item.id)}
                    className={`gap-2 px-4 py-2 h-10 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Right: User Actions - Simplified */}
          <div className="flex items-center gap-3">
            {/* Language Selector - Compact */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2 py-1">
                  <Languages className="h-4 w-4" />
                  <span className="hidden lg:inline text-xs">{languageOptions.find(l => l.code === language)?.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[100]">
                {languageOptions.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as any)}
                    className={language === lang.code ? 'bg-primary/10' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Balance (Desktop) - Compact */}
            <div className="hidden lg:flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
              <Wallet className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-foreground">{userBalance.toFixed(3)} HBAR</span>
            </div>

            {/* Wallet Connect/Disconnect Button */}
            {walletConnected ? (
              <Button variant="outline" size="sm" onClick={onDisconnectWallet} className="hidden lg:flex items-center gap-1 text-xs px-2 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={onConnectWallet} className="hidden lg:flex items-center gap-1 text-xs px-2 py-1">
                <Wallet className="h-3 w-3" />
                Connect Wallet
              </Button>
            )}

            {/* Notifications - Compact */}
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* Theme Toggle - Compact */}
            <Button variant="ghost" size="sm" onClick={onToggleDarkMode} className="p-2">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Menu (Desktop) - Simplified */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 py-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[100]">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile?.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {profile?.displayName?.charAt(0)?.toUpperCase() || 
                         profile?.username?.charAt(0)?.toUpperCase() || 
                         walletAddress?.slice(2, 4)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {profile?.displayName || profile?.username || `User ${walletAddress?.slice(-6)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">Truth Verifier</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavClick('profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('portfolio')}>
                    <Wallet className="h-4 w-4 mr-2" />
                    Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('settings?tab=markets')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    My Markets
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('settings?tab=history')}>
                    <Bell className="h-4 w-4 mr-2" />
                    History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavClick('settings?tab=preferences')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden">
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader className="pb-6">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
                        BC
                      </div>
                      Blockcast
                    </SheetTitle>
                  </SheetHeader>

                  {/* User Profile Section */}
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg mb-6">
                    <Avatar>
                      <AvatarImage src={profile?.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile?.displayName?.charAt(0)?.toUpperCase() || 
                         profile?.username?.charAt(0)?.toUpperCase() || 
                         walletAddress?.slice(2, 4)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {profile?.displayName || profile?.username || `User ${walletAddress?.slice(-6)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">Truth Verifier</p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <span className="font-medium">Balance</span>
                    </div>
                    <span className="font-bold text-primary">{userBalance.toFixed(3)} HBAR</span>
                  </div>

                  {/* Wallet Connect/Disconnect Button (Mobile) */}
                  <div className="mb-6">
                    {walletConnected ? (
                      <Button variant="outline" onClick={onDisconnectWallet} className="w-full flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Connected: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Wallet'}</span>
                      </Button>
                    ) : (
                      <Button variant="default" onClick={onConnectWallet} className="w-full flex items-center justify-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {mainNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      
                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? "default" : "ghost"}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full justify-start gap-3 h-12 ${
                            isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Account Settings (Mobile) */}
                  <div className="mt-4">
                    <Button
                      variant={currentTab === 'profile' ? "default" : "ghost"}
                      onClick={() => handleNavClick('profile')}
                      className="w-full justify-start gap-3 h-12"
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">Profile</span>
                    </Button>
                    <Button
                      variant={currentTab === 'settings' ? "default" : "ghost"}
                      onClick={() => handleNavClick('settings')}
                      className="w-full justify-start gap-3 h-12"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Account Settings</span>
                    </Button>
                  </div>

                  {/* Language Selector Mobile */}
                  <div className="mt-6">
                    <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                      <SelectTrigger>
                        <Languages className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="mr-2">{lang.flag}</span>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Only Core Features */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-t border-border/40">
        <div className="grid grid-cols-4 gap-1 p-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col gap-1 h-16 px-2 ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium truncate">{item.label.split(' ')[0]}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}