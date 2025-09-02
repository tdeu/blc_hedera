import { useState, useEffect } from 'react';
import { LanguageProvider } from './components/LanguageContext';
import TopNavigation from './components/TopNavigation';
import Footer from './components/Footer';
import BettingMarkets from './components/BettingMarkets';
import BettingPortfolio, { UserBet } from './components/BettingPortfolio';
import Social from './components/Social';
import Community from './components/Community';
import About from './components/About';
import Contact from './components/Contact';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import LocalCurrencyWallet from './components/LocalCurrencyWallet';
import Onboarding from './components/Onboarding';
import VerificationInput from './components/VerificationInput';
import VerificationResults, { VerificationResult } from './components/VerificationResults';
import VerificationHistory from './components/VerificationHistory';
import Settings from './components/Settings';
import MarketPage from './components/MarketPage';
import Categories from './components/Categories';
import CreateMarket from './components/CreateMarket';
import { UserProvider } from './contexts/UserContext';
import { BettingMarket, realTimeMarkets } from './components/BettingMarkets';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Gift, Sparkles, Wallet, Shield, Target, Zap, Users } from 'lucide-react';
// Logo placeholder - replace with actual image when available
import { mockVerificationHistory } from './utils/mockData';
import { useHedera } from './utils/useHedera';
import { walletService, WalletConnection } from './utils/walletService';

interface UserProfile {
  id: string;
  balance: number;
  totalBets: number;
  totalWinnings: number;
  verificationCount: number;
  level: string;
  isNew: boolean;
}

// Simplified utility functions
const generateUserId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(3)}`;
};

const isValidPage = (tab: string): boolean => {
  const validPages = [
    'markets', 'market-detail', 'portfolio', 'verify', 'community', 
    'social', 'settings', 'about', 'contact', 'categories',
    'privacy', 'terms', 'create-market'
  ];
  return validPages.includes(tab);
};

const shouldShowOnboarding = (): boolean => {
  return !localStorage.getItem('blockcast_onboarded');
};

const markOnboardingComplete = (): void => {
  localStorage.setItem('blockcast_onboarded', 'true');
};

const initializeDarkMode = (): boolean => {
  const stored = localStorage.getItem('blockcast_dark_mode');
  const isDark = stored !== null ? stored === 'true' : true;
  document.documentElement.classList.toggle('dark', isDark);
  return isDark;
};

const toggleDarkMode = (current: boolean): boolean => {
  const newMode = !current;
  localStorage.setItem('blockcast_dark_mode', newMode.toString());
  document.documentElement.classList.toggle('dark', newMode);
  return newMode;
};

export default function App() {
  // Core state
  const [currentTab, setCurrentTab] = useState('markets');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // User state
  const [userId] = useState(generateUserId());
  
  // Wallet state
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  
  // Blockchain state - maps market IDs to their deployed contract addresses
  const [marketContracts, setMarketContracts] = useState<Record<string, string>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [markets] = useState<BettingMarket[]>(realTimeMarkets);
  
  // Verification state
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>(mockVerificationHistory);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Market page state
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);

  // Hedera blockchain integration - runs behind the scenes, no UI changes
  const { 
    placeBet: hederaPlaceBet, 
    submitEvidence: hederaSubmitEvidence,
    createMarket: hederaCreateMarket,
    isConnected: isHederaConnected 
  } = useHedera(walletConnection);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    
    // Initialize dark mode
    const darkModeEnabled = initializeDarkMode();
    setIsDarkMode(darkModeEnabled);
    
    // Check onboarding status
    const needsOnboarding = shouldShowOnboarding();
    setShowOnboarding(needsOnboarding);
    
    // Initialize user profile
    const profile: UserProfile = {
      id: userId,
      balance: walletConnection?.balance ? parseFloat(walletConnection.balance) : 0.0, // Use real wallet balance
      totalBets: 0,
      totalWinnings: 0,
      verificationCount: 0,
      level: 'Novice Verifier',
      isNew: !localStorage.getItem('blockcast_welcomed')
    };
    
    setUserProfile(profile);

    // Try to auto-connect wallet if previously connected
    tryAutoConnectWallet();
    
    // Show welcome for new users
    if (profile.isNew && !needsOnboarding) {
      setShowWelcomeDialog(true);
    }
    
    setIsLoading(false);
  };

  // Wallet connection functions
  const tryAutoConnectWallet = async () => {
    try {
      const connection = await walletService.autoConnect();
      if (connection) {
        setWalletConnection(connection);
        updateUserBalanceFromWallet(connection);
      }
    } catch (error) {
      console.log('Auto-connect failed, user needs to connect manually');
    }
  };

  const connectWallet = async () => {
    try {
      const connection = await walletService.connectMetaMask();
      setWalletConnection(connection);
      updateUserBalanceFromWallet(connection);
      toast.success('Wallet connected successfully! 🦊');
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const updateUserBalanceFromWallet = (connection: WalletConnection) => {
    setUserProfile(prev => prev ? {
      ...prev,
      balance: parseFloat(connection.balance)
    } : null);
  };

  const disconnectWallet = () => {
    walletService.disconnect();
    setWalletConnection(null);
    // Reset balance to 0 when wallet is disconnected
    setUserProfile(prev => prev ? {
      ...prev,
      balance: 0
    } : null);
    toast.info('Wallet disconnected');
  };

  // Handle navigation changes
  const handleTabChange = (tab: string) => {
    if (isValidPage(tab)) {
      setCurrentTab(tab);
      setSelectedMarket(null);
      if (tab !== 'verify') {
        setVerificationResult(null);
      }
    }
  };

  // Handle market selection
  const handleMarketSelect = (market: BettingMarket) => {
    setSelectedMarket(market);
    setCurrentTab('market-detail');
  };

  // Handle back from market page
  const handleBackFromMarket = () => {
    setSelectedMarket(null);
    setCurrentTab('markets');
  };

  // Handle dark mode toggle
  const handleToggleDarkMode = () => {
    const newMode = toggleDarkMode(isDarkMode);
    setIsDarkMode(newMode);
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    setShowOnboarding(false);
    setShowWelcomeDialog(true);
  };

  // Handle welcome bonus claim
  const handleClaimWelcomeBonus = () => {
    localStorage.setItem('blockcast_welcomed', 'true');
    setShowWelcomeDialog(false);
    toast.success('Welcome to Blockcast! Your account is ready for truth verification.');
  };

  // Handle truth verification - Enhanced with Hedera HCS integration
  const handleVerifyTruth = async (claim: string) => {
    if (!claim || claim.trim().length < 10) {
      toast.error('Please enter a claim of at least 10 characters');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    
    const loadingMessages = [
      'Analyzing claim credibility...',
      'Cross-referencing African news sources...',
      'Submitting evidence to Hedera Consensus Service...',
      'Consulting fact-checking databases...',
      'Evaluating evidence patterns...',
      'Generating verification report...'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 800);

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newVerification: VerificationResult = {
        id: `verification_${Date.now()}`,
        claim: claim,
        verdict: Math.random() > 0.5 ? 'true' : 'false',
        confidence: Math.floor(Math.random() * 40 + 60), // 60-100%
        aiAnalysis: 'This verification uses AI-powered fact-checking combined with community consensus to determine truth. Multiple credible African news sources were analyzed to reach this conclusion.',
        sources: [
          { title: 'African Union News Network', url: 'https://au-news.org', credibility: 96 },
          { title: 'Reuters Africa', url: 'https://reuters.com/africa', credibility: 94 },
          { title: 'BBC Africa', url: 'https://bbc.com/africa', credibility: 92 },
          { title: 'Al Jazeera Africa', url: 'https://aljazeera.com/africa', credibility: 90 }
        ],
        blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: new Date(),
        verificationTime: Math.floor(Math.random() * 3000) + 1000
      };
      
      setVerificationResult(newVerification);
      
      // Submit verification evidence to Hedera Consensus Service in background
      if (isHederaConnected) {
        const topicId = `topic-${newVerification.id}`; // In real implementation, this would be the market's topic ID
        hederaSubmitEvidence(topicId, claim, 'AI Verification System').then(transactionId => {
          if (transactionId) {
            console.log(`Verification evidence submitted to HCS: ${transactionId}`);
            // Update verification with blockchain transaction ID
            setVerificationHistory(prev => prev.map(verification => 
              verification.id === newVerification.id 
                ? { ...verification, hcsTransactionId: transactionId }
                : verification
            ));
          }
        }).catch(error => {
          console.error('HCS evidence submission failed:', error);
          // Verification continues to work even if HCS fails
        });
      }
      
      // Update user profile with reward
      if (userProfile) {
        const reward = 0.005; // Small reward for verification
        setUserProfile({
          ...userProfile,
          balance: userProfile.balance + reward,
          verificationCount: userProfile.verificationCount + 1
        });
      }

      // Update verification history
      setVerificationHistory(prev => [newVerification, ...prev.slice(0, 19)]);
      
      toast.success('Truth verification completed! You earned a verification reward.');
      
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      clearInterval(messageInterval);
      setIsVerifying(false);
      setLoadingMessage('');
    }
  };

  // Handle verification history selection
  const handleSelectVerification = (result: VerificationResult) => {
    setVerificationResult(result);
    setCurrentTab('verify');
    toast.success('Verification result loaded');
  };

  // Handle betting/casting - Enhanced with Hedera blockchain integration
  const handlePlaceBet = async (marketId: string, position: 'yes' | 'no', amount: number) => {
    if (!userProfile) {
      toast.error('User profile not found');
      return;
    }

    // Check if wallet is connected
    if (!walletConnection || !walletConnection.isConnected) {
      toast.error('Please connect your wallet to place bets');
      return;
    }

    // Refresh wallet balance before checking
    const currentBalance = await walletService.getBalance();
    const numericBalance = parseFloat(currentBalance);
    
    if (amount > numericBalance) {
      toast.error(`Insufficient balance. You have ${numericBalance.toFixed(3)} HBAR available`);
      return;
    }

    // Create local bet record immediately for UI responsiveness
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    const newBet: UserBet = {
      id: `bet_${Date.now()}`,
      marketId,
      marketClaim: market.claim,
      position,
      amount,
      odds: position === 'yes' ? market.yesOdds : market.noOdds,
      potentialWinning: amount * (position === 'yes' ? market.yesOdds : market.noOdds),
      placedAt: new Date(),
      status: 'active'
    };
    
    setUserBets(prev => [newBet, ...prev]);
    
    // Update user profile immediately
    setUserProfile({
      ...userProfile,
      balance: userProfile.balance - amount,
      totalBets: userProfile.totalBets + 1
    });

    // Submit to Hedera blockchain in the background (no UI blocking)
    if (isHederaConnected) {
      // Get or create contract address for this market
      const getOrCreateContractAddress = async (): Promise<string | null> => {
        // Check if we already have a contract address for this market
        if (marketContracts[marketId]) {
          return marketContracts[marketId];
        }

        // Create a new contract for this market
        try {
          const marketContract = await hederaCreateMarket({
            claim: market.claim,
            description: market.description,
            expiresAt: market.expiresAt,
            category: market.category
          });

          if (marketContract?.contractId) {
            // Store the contract address mapping
            setMarketContracts(prev => ({
              ...prev,
              [marketId]: marketContract.contractId
            }));
            console.log(`Created new contract for market ${marketId}: ${marketContract.contractId}`);
            return marketContract.contractId;
          }
        } catch (error) {
          console.error('Failed to create contract for market:', error);
        }
        
        return null;
      };

      // Get contract address and place bet
      getOrCreateContractAddress().then(contractAddress => {
        if (contractAddress) {
          return hederaPlaceBet(contractAddress, position, amount);
        }
        return null;
      }).then(transactionId => {
        if (transactionId) {
          console.log(`Bet recorded on Hedera blockchain: ${transactionId}`);
          // Optionally update bet record with blockchain transaction ID
          setUserBets(prev => prev.map(bet => 
            bet.id === newBet.id 
              ? { ...bet, blockchainTxId: transactionId }
              : bet
          ));
        }
      }).catch(error => {
        console.error('Blockchain transaction failed:', error);
        // UI continues to work normally even if blockchain fails
      });
    }

    toast.success(`Position placed: ${position.toUpperCase()} on "${market.claim.substring(0, 40)}..."`);
  };

  // Handle category selection
  const handleSelectCategory = (categoryId: string) => {
    // Filter markets by category when implementing category filtering
    toast.success(`Selected ${categoryId} category`);
  };

  // Handle market creation
  const handleCreateMarket = () => {
    setCurrentTab('create-market');
  };

  // Handle new market submission - Enhanced with Hedera integration
  const handleSubmitNewMarket = async (marketData: Partial<BettingMarket>) => {
    try {
      // Generate market ID
      const marketId = `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newMarket: BettingMarket = {
        id: marketId,
        claim: marketData.claim || '',
        category: marketData.category || '',
        source: marketData.source || '',
        description: marketData.description || '',
        totalPool: 0,
        yesPool: 0,
        noPool: 0,
        yesOdds: 2.0,
        noOdds: 2.0,
        totalCasters: 0,
        expiresAt: marketData.expiresAt || new Date(),
        status: 'active',
        trending: false,
        country: marketData.country,
        region: marketData.region,
        marketType: marketData.marketType || 'future',
        confidenceLevel: marketData.confidenceLevel || 'medium'
      };

      // Submit to Hedera blockchain in background (don't let errors affect UI)
      if (isHederaConnected && hederaCreateMarket) {
        hederaCreateMarket(marketData).then(contract => {
          if (contract) {
            console.log(`Market created on Hedera: ${contract.contractId}`);
            // Optionally show a subtle success notification for blockchain confirmation
          }
        }).catch(error => {
          console.warn('Blockchain market creation failed (running in mock mode):', error);
          // Don't show error to user as the market creation itself was successful
        });
      }

      // Add to local markets (in real app, this would come from backend)
      // For now, we'll just show success
      toast.success('Market created successfully! It will be reviewed and activated shortly.');
      setCurrentTab('markets');
    } catch (error) {
      toast.error('Failed to create market. Please try again.');
    }
  };

  // Render current page
  const renderCurrentPage = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3>Loading Blockcast...</h3>
            <p className="text-muted-foreground">
              Connecting to African truth verification network
            </p>
          </div>
        </div>
      );
    }

    switch (currentTab) {
      case 'markets':
        return (
          <BettingMarkets 
            onPlaceBet={handlePlaceBet} 
            userBalance={userProfile?.balance || 0}
            onMarketSelect={handleMarketSelect}
            markets={markets}
            onCreateMarket={handleCreateMarket}
          />
        );
      case 'market-detail':
        return selectedMarket ? (
          <MarketPage
            market={selectedMarket}
            onPlaceBet={handlePlaceBet}
            userBalance={userProfile?.balance || 0}
            onBack={handleBackFromMarket}
          />
        ) : null;
      case 'portfolio':
        return <BettingPortfolio userBets={userBets} userBalance={userProfile?.balance || 0} />;
      case 'verify':
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <VerificationInput 
              onVerify={handleVerifyTruth}
              isVerifying={isVerifying}
              loadingMessage={loadingMessage}
            />
            {verificationResult && (
              <VerificationResults 
                result={verificationResult}
                onNewVerification={() => setVerificationResult(null)}
              />
            )}
          </div>
        );
      case 'community':
        return <Community />;
      case 'social':
        return <Social />;
      case 'categories':
        return <Categories onSelectCategory={handleSelectCategory} />;
      case 'create-market':
        return (
          <CreateMarket 
            onBack={() => setCurrentTab('markets')}
            onCreateMarket={handleSubmitNewMarket}
          />
        );
      case 'settings':
        return <Settings 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={handleToggleDarkMode}
          userBalance={userProfile?.balance || 0}
          userBets={userBets}
          verificationHistory={verificationHistory}
          onSelectVerification={handleSelectVerification}
        />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService />;
      default:
        return (
          <BettingMarkets 
            onPlaceBet={handlePlaceBet} 
            userBalance={userProfile?.balance || 0}
            onMarketSelect={handleMarketSelect}
            markets={markets}
            onCreateMarket={handleCreateMarket}
          />
        );
    }
  };

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <LanguageProvider>
        <div className="min-h-screen bg-background">
          <Onboarding onComplete={handleOnboardingComplete} />
          <Toaster />
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <UserProvider walletConnection={walletConnection}>
        <div className="min-h-screen bg-background flex flex-col">
        {/* Navigation */}
        <TopNavigation 
          currentTab={currentTab}
          onTabChange={handleTabChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          userBalance={userProfile?.balance || 0}
          walletConnected={walletConnection?.isConnected || false}
          walletAddress={walletConnection?.address}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
        />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl lg:px-8 pb-20 lg:pb-6">
          {renderCurrentPage()}
        </main>

        {/* Footer */}
        <Footer onNavigate={handleTabChange} />

        {/* Welcome Dialog */}
        <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center flex items-center gap-3 justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                                  <div>
                    <div className="w-8 h-8 rounded-lg mx-auto mb-2 bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                      BC
                    </div>
                    Welcome to Blockcast!
                  </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-center space-y-4">
              <span className="text-muted-foreground block">
                You've successfully joined Africa's premier truth verification platform! 
                Your account is ready to start verifying truth and casting positions.
              </span>
              
              <div className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border border-primary/30">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                    <Wallet className="h-8 w-8" />
                    {formatCurrency(userProfile?.balance || 0.0)} HBAR
                  </div>
                  <span className="text-sm text-muted-foreground">Starting Balance</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Verify Truth</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4 text-secondary" />
                  <span>Cast Positions</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span>Earn Rewards</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-yellow-500" />
                  <span>Join Community</span>
                </div>
              </div>
            </div>
            
            <Button onClick={handleClaimWelcomeBonus} className="w-full mt-4 gap-2">
              <Sparkles className="h-4 w-4" />
              Start Verifying Truth
            </Button>
          </DialogContent>
        </Dialog>

        {/* Currency Wallet - Always available */}
        <LocalCurrencyWallet />

        {/* Toast Notifications */}
        <Toaster />
        </div>
      </UserProvider>
    </LanguageProvider>
  );
}