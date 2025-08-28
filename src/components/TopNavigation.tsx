import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Menu, Shield, Settings, Moon, Sun, TrendingUp, Wallet, Bell, Users, Languages, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useLanguage } from './LanguageContext';
// Logo placeholder - replace with actual image when available

interface TopNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userBalance: number;
}

export default function TopNavigation({ currentTab, onTabChange, isDarkMode, onToggleDarkMode, userBalance }: TopNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { language, setLanguage } = useLanguage();

  // Simplified main navigation - only core features
  const mainNavItems = [
    { id: 'markets', label: 'Truth Markets', icon: TrendingUp },
    { id: 'verify', label: 'Verify Truth', icon: Shield },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'social', label: 'Social Hub', icon: Users },
  ];

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
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
              <DropdownMenuContent align="end">
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
              <span className="text-xs font-semibold text-foreground">{userBalance.toFixed(3)}</span>
            </div>

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
                <DropdownMenuContent align="end" className="w-48">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">John Doe</p>
                      <p className="text-xs text-muted-foreground">Truth Verifier</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavClick('settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Sign Out
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
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">Truth Verifier</p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <span className="font-medium">Balance</span>
                    </div>
                    <span className="font-bold text-primary">{userBalance.toFixed(3)} ETH</span>
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

                  {/* Sign Out */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-8 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Sign Out
                  </Button>
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