import React, { useState, useEffect } from 'react';
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
import Profile from './components/Profile';
import MarketPage from './components/MarketPage';
import Categories from './components/Categories';
import CreateMarket from './components/CreateMarket';
import Admin from './components/admin/Admin';
import AdminModeSwitcher from './components/admin/AdminModeSwitcher';
import PredictionAnalysisPanel from './components/admin/PredictionAnalysisPanel';
import { adminService } from './utils/adminService';
import { marketStatusService } from './utils/marketStatusService';
import { pendingMarketsService } from './utils/pendingMarketsService';
import { approvedMarketsService } from './utils/approvedMarketsService';
import { userDataService } from './utils/userDataService';
import { supabase } from './utils/supabase';
import { UserProvider } from './contexts/UserContext';
import { DISPUTE_PERIOD } from './config/constants';
import { BettingMarket } from './components/BettingMarkets';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Gift, Sparkles, Wallet, Shield, Target, Zap, Users } from 'lucide-react';
// Logo placeholder - replace with actual image when available
import { mockVerificationHistory } from './utils/mockData';
import { useHedera } from './utils/useHedera';
import { walletService, WalletConnection } from './utils/walletService';
import { castTokenService } from './utils/castTokenService';

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
    'privacy', 'terms', 'create-market', 'admin'
  ];
  return validPages.includes(tab);
};

const shouldShowOnboarding = (): boolean => {
  const onboarded = localStorage.getItem('blockcast_onboarded');
  console.log('🔍 Onboarding check:', { onboarded, shouldShow: !onboarded });
  // Force skip onboarding - it's causing issues
  localStorage.setItem('blockcast_onboarded', 'true');
  return false;
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
  console.log('🔥 APP COMPONENT RENDER - timestamp:', Date.now());
  
  // Restore all the original state
  const [currentTab, setCurrentTab] = useState('markets');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminMode, setAdminMode] = useState<'user' | 'admin'>('user');
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [marketCreationContext, setMarketCreationContext] = useState<'truth-markets' | 'verify-truth'>('truth-markets');
  
  // User state
  const [userId] = useState(generateUserId());
  
  // Wallet state
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [castBalance, setCastBalance] = useState<number>(0);

  
  // Blockchain state - maps market IDs to their deployed contract addresses
  const [marketContracts, setMarketContracts] = useState<Record<string, string>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  
  // Verification state
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>(mockVerificationHistory);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Market page state
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);

  // Hedera blockchain integration - runs behind the scenes, no UI changes
  const {
    hederaEVMService,
    placeBet: hederaPlaceBet,
    placeBetWithAddress: hederaPlaceBetWithAddress,
    submitEvidence: hederaSubmitEvidence,
    createMarket: hederaCreateMarket,
    isConnected: isHederaConnected
  } = useHedera(walletConnection);

  // Manual function to test market refresh (for debugging)
  const testMarketRefresh = async () => {
    console.log('🧪 MANUAL TEST: Refreshing all markets with contracts...');
    const availableContracts = Object.keys(marketContracts);
    console.log('📋 Available contracts for testing:', availableContracts);

    if (availableContracts.length > 0) {
      const testMarketId = availableContracts[0];
      console.log(`🎯 Testing refresh for market: ${testMarketId}`);
      await refreshMarketOdds(testMarketId);
    } else {
      console.log('❌ No contracts available for testing');
    }
  };

  // Direct test of smart contract price fetching
  const testContractPrices = async (contractAddress: string) => {
    console.log('🔬 DIRECT CONTRACT TEST: Fetching prices from contract:', contractAddress);
    try {
      const { HederaEVMService, getHederaEVMConfig } = await import('./utils/hederaEVMService');
      const evmConfig = getHederaEVMConfig();
      const hederaEVMService = new HederaEVMService(evmConfig);

      console.log('📊 HederaEVMService created, fetching prices...');
      const prices = await hederaEVMService.getMarketPrices(contractAddress);
      console.log('✅ PRICES FETCHED:', prices);

      return prices;
    } catch (error) {
      console.error('❌ DIRECT CONTRACT TEST FAILED:', error);
      return null;
    }
  };

  // Function to refresh market odds using direct contract address (bypasses state timing issues)
  const refreshMarketOddsWithAddress = async (marketId: string, contractAddress: string) => {
    // Expose function globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).debugRefreshMarketOdds = refreshMarketOddsWithAddress;
    }
    try {
      console.log(`🔄 Refreshing market odds for ${marketId} using direct contract address: ${contractAddress}`);

      // Import hederaEVMService for direct price fetching
      const { HederaEVMService, getHederaEVMConfig } = await import('./utils/hederaEVMService');
      const evmConfig = getHederaEVMConfig();
      const hederaEVMService = new HederaEVMService(evmConfig);

      const prices = await hederaEVMService.getMarketPrices(contractAddress);
      const volume = await hederaEVMService.getMarketVolume(contractAddress);
      console.log(`📊 Fetched prices from blockchain:`, {
        yesOdds: prices.yesOdds,
        noOdds: prices.noOdds,
        yesProb: (prices.yesProb * 100).toFixed(1) + '%',
        noProb: (prices.noProb * 100).toFixed(1) + '%',
        yesPrice: prices.yesPrice,
        noPrice: prices.noPrice,
        volume: volume
      });

      // Update the market in the markets array with new prices
      setMarkets(prevMarkets => {
        const targetMarket = prevMarkets.find(m => m.id === marketId);
        console.log(`🔄 State update for market ${marketId}:`, {
          found: !!targetMarket,
          oldYesOdds: targetMarket?.yesOdds,
          newYesOdds: prices.yesOdds,
          oldNoOdds: targetMarket?.noOdds,
          newNoOdds: prices.noOdds,
          pricesChanged: targetMarket ? (
            Math.abs(targetMarket.yesOdds - prices.yesOdds) > 0.001 ||
            Math.abs(targetMarket.noOdds - prices.noOdds) > 0.001
          ) : false
        });

        const updatedMarkets = prevMarkets.map(market =>
          market.id === marketId
            ? {
                ...market,
                yesOdds: prices.yesOdds,
                noOdds: prices.noOdds,
                volume: volume, // Total CAST volume traded
                // Update pools based on probabilities to reflect betting activity
                yesPool: market.totalPool * prices.yesProb,
                noPool: market.totalPool * prices.noProb
              }
            : market
        );
        return updatedMarkets;
      });

      console.log(`✅ Market odds updated for ${marketId} using direct address:`, {
        yesOdds: prices.yesOdds.toFixed(3),
        noOdds: prices.noOdds.toFixed(3),
        yesProb: (prices.yesProb * 100).toFixed(1) + '%',
        noProb: (prices.noProb * 100).toFixed(1) + '%'
      });

      // Persist odds to Supabase so they survive page reloads
      try {
        if (supabase) {
          await supabase
            .from('approved_markets')
            .update({
              yes_odds: prices.yesOdds,
              no_odds: prices.noOdds,
              volume: volume
            })
            .eq('id', marketId);
          console.log(`💾 Saved odds to Supabase for market ${marketId}`);
        }
      } catch (dbError) {
        console.warn(`⚠️ Failed to save odds to Supabase:`, dbError);
      }

    } catch (error) {
      console.error(`❌ Failed to refresh market odds for ${marketId} with direct address:`, error);
    }
  };

  // Function to refresh market odds from smart contract after bet placement
  const refreshMarketOdds = async (marketId: string, retryCount = 0) => {
    try {
      console.log(`🔍 Looking for contract address for market: ${marketId} (attempt ${retryCount + 1})`);
      console.log(`📋 Available contracts:`, Object.keys(marketContracts));
      console.log(`📊 Full marketContracts state:`, marketContracts);

      const contractAddress = marketContracts[marketId];
      if (!contractAddress) {
        console.log(`❌ No contract address found for market ${marketId}`);

        // If no contract found and this is not the final attempt, wait and retry
        if (retryCount < 3) {
          console.log(`🔄 Retrying in 2 seconds... (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            refreshMarketOdds(marketId, retryCount + 1);
          }, 2000);
          return;
        }

        console.log(`🔧 Final attempt failed. Available market contracts:`, marketContracts);
        return;
      }

      console.log(`🔄 Refreshing market odds for ${marketId} using contract ${contractAddress}...`);

      // Import hederaEVMService for direct price fetching
      const { HederaEVMService, getHederaEVMConfig } = await import('./utils/hederaEVMService');
      const evmConfig = getHederaEVMConfig();
      const hederaEVMService = new HederaEVMService(evmConfig);

      const prices = await hederaEVMService.getMarketPrices(contractAddress);

      // Update the market in the markets array with new prices
      setMarkets(prevMarkets =>
        prevMarkets.map(market =>
          market.id === marketId
            ? {
                ...market,
                yesOdds: prices.yesOdds,
                noOdds: prices.noOdds
              }
            : market
        )
      );

      console.log(`✅ Market odds updated for ${marketId}:`, {
        yesOdds: prices.yesOdds.toFixed(3),
        noOdds: prices.noOdds.toFixed(3),
        yesProb: (prices.yesProb * 100).toFixed(1) + '%',
        noProb: (prices.noProb * 100).toFixed(1) + '%'
      });

    } catch (error) {
      console.error(`❌ Failed to refresh market odds for ${marketId}:`, error);

      // If error and this is not the final retry, try again
      if (retryCount < 2) {
        console.log(`🔄 Retrying due to error in 3 seconds... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          refreshMarketOdds(marketId, retryCount + 1);
        }, 3000);
      }
    }
  };

  // Function to refresh CAST balance
  const refreshCastBalance = async () => {
    try {
      if (hederaEVMService && walletConnection?.isConnected) {
        console.log('🔄 Refreshing CAST balance...');
        const balance = await hederaEVMService.getCastTokenBalance();
        const balanceNum = parseFloat(balance);
        setCastBalance(balanceNum);
        console.log('✅ CAST balance updated:', balanceNum);
      }
    } catch (error) {
      console.error('❌ Failed to refresh CAST balance:', error);
    }
  };

  // Initialize app on mount
  useEffect(() => {
    console.log('🔥 MAIN useEffect triggered - will call initializeApp');
    initializeApp();

    // Start market status monitoring
    console.log('🚀 Starting market status service...');
    marketStatusService.start();

    // Make test function available in browser console for debugging
    (window as any).testMarketRefresh = testMarketRefresh;
    (window as any).marketContracts = marketContracts;
    (window as any).castTokenService = castTokenService;
    (window as any).walletService = walletService;
    (window as any).marketStatusService = marketStatusService;
    console.log('🧪 DEBUG: window.testMarketRefresh(), window.marketContracts, window.castTokenService, window.walletService, and window.marketStatusService available in console');

    // Cleanup on unmount
    return () => {
      console.log('🛑 Cleaning up market status service...');
      marketStatusService.stop();
    };
  }, []);
  
  // Debug all state changes
  useEffect(() => {
    console.log('🔥 State changed - isLoading:', isLoading, 'showOnboarding:', showOnboarding, 'currentTab:', currentTab);
    
    // Check if something is setting showOnboarding to true after initialization
    if (showOnboarding) {
      console.log('🚨 ALERT: showOnboarding became true! This will cause blank screen!');
    }
  }, [isLoading, showOnboarding, currentTab]);
  
  useEffect(() => {
    console.log('🔥 Markets changed - count:', markets.length, markets.length === 0 ? '(empty - loading from Supabase)' : '(loaded from Supabase)');
  }, [markets]);
  
  useEffect(() => {
    console.log('🔥 UserProfile changed:', userProfile ? 'exists' : 'null');
  }, [userProfile]);

  // Test function for betting integration
  const testBettingIntegration = async () => {
    console.log('🧪 TESTING BETTING INTEGRATION...');
    try {
      // Test with a mock market address
      const testMarketAddress = '0x1234567890123456789012345678901234567890';
      const testPosition = 'yes';
      const testAmount = 1;
      
      console.log('🎯 Testing placeBetWithAddress...');
      const result = await hederaPlaceBetWithAddress(testMarketAddress, testPosition, testAmount);
      console.log('✅ Test result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Test failed:', error);
      return null;
    }
  };

  // Test function for market creation
  const testMarketCreation = async () => {
    console.log('🧪 TESTING MARKET CREATION...');
    try {
      const testMarket = {
        claim: `Test market for debugging - will this work? ${Date.now()}`,
        description: 'This is a test market to verify contract address extraction',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        category: 'Test'
      };
      
      console.log('🎯 Testing hederaCreateMarket...');
      const result = await hederaCreateMarket(testMarket);
      console.log('✅ Market creation result:', result);
      console.log('🔍 Contract ID validation:', {
        isString: typeof result?.contractId === 'string',
        length: result?.contractId?.length,
        startsWith0x: result?.contractId?.startsWith('0x'),
        isMock: result?.contractId?.startsWith('mock-'),
        isValid: result?.contractId && result.contractId.startsWith('0x') && result.contractId.length === 42
      });
      
      return result;
    } catch (error) {
      console.error('❌ Market creation test failed:', error);
      return null;
    }
  };

  // Helper function to check transaction status
  const checkTransactionStatus = async (txHash: string) => {
    console.log('🔍 CHECKING TRANSACTION STATUS:', txHash);
    try {
      const { HederaEVMService, getHederaEVMConfig } = await import('./utils/hederaEVMService');
      const evmConfig = getHederaEVMConfig();
      const hederaEVMService = new HederaEVMService(evmConfig);
      
      const result = await hederaEVMService.checkTransactionStatus(txHash);
      
      if (result) {
        console.log('📋 Transaction status:', {
          found: result.found,
          confirmed: result.confirmed,
          status: result.status,
          gasUsed: result.gasUsed,
          logsCount: result.logsCount
        });
        
        // If we have a receipt, try to extract market address
        if (result.receipt) {
          console.log('🔍 Attempting to extract market address from receipt...');
          const contractAddress = result.receipt.contractAddress;
          if (contractAddress) {
            console.log('✅ Found contract address in receipt:', contractAddress);
          } else {
            console.log('❌ No contract address found in receipt');
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to check transaction status:', error);
      return null;
    }
  };

  // Update debug functions when marketContracts changes
  useEffect(() => {
    (window as any).testMarketRefresh = testMarketRefresh;
    (window as any).testContractPrices = testContractPrices;
    (window as any).testBettingIntegration = testBettingIntegration;
    (window as any).testMarketCreation = testMarketCreation;
    (window as any).checkTransactionStatus = checkTransactionStatus;
    (window as any).marketContracts = marketContracts;
    console.log('🔄 DEBUG FUNCTIONS UPDATED: marketContracts count:', Object.keys(marketContracts).length);
  }, []); // Only run once on mount - no dependencies needed for initialization
  const initializeApp = async () => {
    console.log('🚀 Starting app initialization...');
    setIsLoading(true);
    
    try {
      // Initialize dark mode
      console.log('🌙 Setting up dark mode...');
      const darkModeEnabled = initializeDarkMode();
      setIsDarkMode(darkModeEnabled);
      
      // Check onboarding status
      console.log('📚 Checking onboarding status...');
      const needsOnboarding = shouldShowOnboarding();
      setShowOnboarding(needsOnboarding);

      // Load approved markets into homepage
      console.log('📊 Loading approved markets...');
      await loadApprovedMarkets();

      // Set up callback for when markets are approved by admin
      console.log('⚙️ Setting up admin callbacks...');
      adminService.setMarketApprovalCallback(addApprovedMarketToHomepage);
      
      // Initialize user profile
      console.log('👤 Creating user profile...');
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
      console.log('💳 Attempting auto-wallet connection...');
      tryAutoConnectWallet();
      
      // Show welcome for new users
      if (profile.isNew && !needsOnboarding) {
        setShowWelcomeDialog(true);
      }
      
      console.log('✅ App initialization complete!');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setIsLoading(false);
    }
  };

  // Wallet connection functions
  const tryAutoConnectWallet = async () => {
    try {
      const connection = await walletService.autoConnect();
      if (connection) {
        setWalletConnection(connection);
        await updateUserBalanceFromWallet(connection);
      }
    } catch (error) {
      console.log('Auto-connect failed, user needs to connect manually');
    }
  };

  const connectWallet = async () => {
    try {
      // Show loading toast for circuit breaker situations
      let loadingToast: string | number | undefined;

      const connectionPromise = walletService.connectMetaMask();

      // Show loading toast after 1 second if still connecting (circuit breaker delay)
      const loadingTimeout = setTimeout(() => {
        loadingToast = toast.loading('Connecting to MetaMask... Please wait, this may take a moment.');
      }, 1000);

      const connection = await connectionPromise;

      // Clear loading timeout and toast
      clearTimeout(loadingTimeout);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      setWalletConnection(connection);
      await updateUserBalanceFromWallet(connection);

      // Check if on correct network
      if (!walletService.isOnHederaTestnet()) {
        toast.warning(`⚠️ Wrong network detected: ${walletService.getCurrentNetwork()}\nPlease switch to Hedera Testnet for full functionality.`);
      } else {
        toast.success(`Wallet connected successfully! 🦊\nNetwork: ${walletService.getCurrentNetwork()}\nHBAR: ${connection.balance} (for network fees)\nCAST: ${castBalance} (for trading)`);
      }
    } catch (error: any) {
      // Handle specific circuit breaker errors with helpful suggestions
      let errorMessage = error.message || 'Failed to connect wallet';

      if (error.message?.includes('temporarily unavailable') ||
          error.message?.includes('circuit breaker')) {
        errorMessage += '\n\n💡 Try these steps:\n1. Wait 30 seconds and try again\n2. Refresh the page\n3. Restart MetaMask';
      } else if (error.message?.includes('internal error')) {
        errorMessage += '\n\n💡 Try refreshing the page or restarting MetaMask';
      }

      toast.error(errorMessage);
    }
  };

  const updateUserBalanceFromWallet = async (connection: WalletConnection) => {
    setUserProfile(prev => prev ? {
      ...prev,
      balance: parseFloat(connection.balance)
    } : null);

    // Also update CAST token balance
    try {
      const castBalanceStr = await walletService.getCastTokenBalance();
      const castBalanceNumber = parseFloat(castBalanceStr);
      setCastBalance(castBalanceNumber);
      console.log('💰 CAST Balance updated:', castBalanceNumber);
    } catch (error) {
      console.error('Failed to fetch CAST balance:', error);
      setCastBalance(0);
    }
  };

  const disconnectWallet = () => {
    walletService.disconnect();
    setWalletConnection(null);
    setCastBalance(0);
    // Reset balance to 0 when wallet is disconnected
    setUserProfile(prev => prev ? {
      ...prev,
      balance: 0
    } : null);
    toast.info('Wallet disconnected');
  };

  // Handle navigation changes
  const handleTabChange = (tab: string) => {
    // Redirect verify-truth to unified markets for backward compatibility
    if (tab === 'verify-truth') {
      setCurrentTab('markets');
      setSelectedMarket(null);
      setVerificationResult(null);
      return;
    }

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

  // Handle admin mode switching
  const handleAdminModeChange = (mode: 'user' | 'admin') => {
    setAdminMode(mode);
    if (mode === 'admin') {
      setCurrentTab('admin');
      toast.success('Switched to Admin Mode');
    } else {
      setCurrentTab('markets');
      toast.success('Switched to User Mode');
    }
  };

  // Load real odds for all markets that have contract addresses
  const loadRealOddsForAllMarkets = async (marketsToCheck: BettingMarket[]) => {
    console.log('🔄 Loading real odds for all markets with contract addresses...');

    const marketsWithContracts = marketsToCheck.filter(market =>
      (market as any).contractAddress &&
      (market as any).contractAddress !== 'null' &&
      (market as any).contractAddress.startsWith('0x')
    );

    console.log(`📊 Found ${marketsWithContracts.length} markets with contract addresses out of ${marketsToCheck.length} total`);

    for (const market of marketsWithContracts) {
      try {
        console.log(`🔍 Loading odds for market: ${market.claim.substring(0, 40)}... (${(market as any).contractAddress})`);
        await refreshMarketOddsWithAddress(market.id, (market as any).contractAddress);
        // Small delay to avoid overwhelming the RPC
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`⚠️ Failed to load odds for market ${market.id}:`, error);
      }
    }

    console.log('✅ Finished loading real odds for all markets');
  };

  // Load approved markets from Supabase and merge with existing markets
  const loadApprovedMarkets = async () => {
    try {
      // Load from Supabase (permanent storage)
      const supabaseMarkets = await approvedMarketsService.getApprovedMarkets();
      
      // Also load from localStorage (for backward compatibility and recent approvals)
      const localApprovedMarkets = pendingMarketsService.getApprovedMarkets();
      
      // Combine both sources, avoiding duplicates
      const allApprovedMarkets = [...supabaseMarkets];
      localApprovedMarkets.forEach(localMarket => {
        if (!supabaseMarkets.find(m => m.id === localMarket.id)) {
          allApprovedMarkets.push(localMarket);
        }
      });
      
      // Merge approved markets with existing markets, avoiding duplicates
      setMarkets(currentMarkets => {
        const existingIds = new Set(currentMarkets.map(m => m.id));
        const newApprovedMarkets = allApprovedMarkets.filter(m => !existingIds.has(m.id));
        
        if (newApprovedMarkets.length > 0) {
          console.log(`🎉 Adding ${newApprovedMarkets.length} approved markets to homepage (${supabaseMarkets.length} from Supabase, ${localApprovedMarkets.length} from localStorage)`);

          // Load real odds for markets with contract addresses
          setTimeout(() => {
            loadRealOddsForAllMarkets([...currentMarkets, ...newApprovedMarkets]);
          }, 1000); // Small delay to ensure markets are rendered

          return [...currentMarkets, ...newApprovedMarkets];
        }

        return currentMarkets;
      });
    } catch (error) {
      console.error('Error loading approved markets:', error);
      
      // Fallback to localStorage if Supabase fails
      try {
        const localApprovedMarkets = pendingMarketsService.getApprovedMarkets();
        setMarkets(currentMarkets => {
          const existingIds = new Set(currentMarkets.map(m => m.id));
          const newApprovedMarkets = localApprovedMarkets.filter(m => !existingIds.has(m.id));
          
          if (newApprovedMarkets.length > 0) {
            console.log(`📦 Fallback: Adding ${newApprovedMarkets.length} approved markets from localStorage`);
            return [...currentMarkets, ...newApprovedMarkets];
          }
          
          return currentMarkets;
        });
      } catch (fallbackError) {
        console.error('Error loading markets from localStorage fallback:', fallbackError);
      }
    }
  };

  // Add a specific approved market immediately to the markets list
  const addApprovedMarketToHomepage = (market: BettingMarket) => {
    setMarkets(currentMarkets => {
      // Check if market already exists
      const exists = currentMarkets.some(m => m.id === market.id);
      
      if (!exists) {
        console.log(`🎉 Market approved and added to homepage: ${market.claim}`);
        return [...currentMarkets, market];
      }
      
      return currentMarkets;
    });
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

    // Check if wallet is connected (including mock wallet for testing)
    if (!walletConnection || !walletConnection.isConnected) {
      toast.error('Please connect your wallet to place bets');
      return;
    }

    // Check CAST token balance (not HBAR) for betting
    const currentCastBalance = await walletService.getCastTokenBalance();
    const numericCastBalance = parseFloat(currentCastBalance);

    if (amount > numericCastBalance) {
      toast.error(`Insufficient CAST balance. You have ${numericCastBalance.toFixed(3)} CAST but need ${amount} CAST to place this bet. Please buy more CAST tokens.`);
      return;
    }

    // Create local bet record immediately for UI responsiveness
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    console.log('🏪 Market found for betting:', {
      id: market.id,
      claim: market.claim.substring(0, 50),
      contractAddress: (market as any).contractAddress
    });

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
    
    // Record bet in userDataService for persistence
    userDataService.recordBet(
      walletConnection.address,
      marketId,
      market.claim,
      position,
      amount,
      '0', // shares - would be calculated from blockchain
      'pending', // transactionHash - will be updated after blockchain confirmation
      newBet.odds, // Pass the actual odds from the market
      newBet.potentialWinning // Pass the calculated potential winning
    );
    
    // Update user profile immediately
    setUserProfile({
      ...userProfile,
      balance: userProfile.balance - amount,
      totalBets: userProfile.totalBets + 1
    });

    // Submit to Hedera blockchain in the background (no UI blocking)
    console.log('🔍 Hedera connection status:', { isHederaConnected, walletConnected: walletConnection?.isConnected });
    if (isHederaConnected) {
      const getContractAddress = async (): Promise<string | null> => {
        // First check if market already has a contract address from database
        const marketContractAddress = (market as any).contract_address || (market as any).contractAddress;
        if (marketContractAddress && marketContractAddress.startsWith('0x')) {
          console.log(`✅ Using existing market contract address: ${marketContractAddress}`);
          return marketContractAddress;
        }

        // Fallback to local state (for newly created markets)
        const localAddress = marketContracts[marketId];
        if (localAddress && localAddress.startsWith('0x')) {
          console.log(`✅ Using local contract address: ${localAddress}`);
          return localAddress;
        }

        console.warn(`❌ No contract address found for market ${marketId}`);
        return null;
      };

      // Get contract address and place bet
      let contractAddressForRefresh: string | null = null;

      const contractAddress = await getContractAddress();
      contractAddressForRefresh = contractAddress; // Store for later use

      // Always record bet locally first
      console.log(`📝 Proceeding with bet placement for market ${marketId}. Contract: ${contractAddress || 'local mode'}`);

      if (contractAddress) {
        console.log(`🚀 Placing bet on blockchain contract: ${contractAddress}`);

        // Place bet directly on the existing market contract
        hederaPlaceBetWithAddress(contractAddress, position, amount).then(transactionId => {
        if (transactionId) {
          console.log(`Bet recorded on Hedera blockchain: ${transactionId}`);
          // Update bet record with blockchain transaction ID
          setUserBets(prev => prev.map(bet =>
            bet.id === newBet.id
              ? { ...bet, blockchainTxId: transactionId }
              : bet
          ));

          // 💰 Refresh wallet balances after successful bet to show updated CAST and HBAR balances
          console.log('🔄 Refreshing wallet balances after successful bet...');
          setTimeout(async () => {
            try {
              // Refresh both HBAR and CAST balances
              if (walletConnection?.address) {
                const newHbarBalance = await walletService.getBalance();
                const newCastBalance = await walletService.getCastTokenBalance();

                console.log('💰 Balance update after bet:', {
                  hbar: newHbarBalance,
                  cast: newCastBalance,
                  change: `HBAR: ${(parseFloat(newHbarBalance) - (walletConnection?.balance ? parseFloat(walletConnection.balance) : 0)).toFixed(4)} (gas fees)`,
                  stakePaid: `${amount} CAST (from CAST balance)`
                });

                // Update wallet connection with new HBAR balance
                setWalletConnection(prev => prev ? { ...prev, balance: newHbarBalance } : null);

                // Update CAST balance in state
                setCastBalance(parseFloat(newCastBalance));

                // Show informative toast about the balance changes
                toast.info(
                  `Balance updated: ${amount} CAST used for bet + gas fees paid in HBAR`,
                  {
                    duration: 4000,
                    description: 'Your CAST balance decreased by your stake amount, HBAR balance decreased by gas fees'
                  }
                );
              }
            } catch (error) {
              console.error('❌ Failed to refresh balances after bet:', error);
            }
          }, 2000); // 2 second delay to allow transaction confirmation

          // 🔄 Refresh market odds after successful bet placement
          // Use the stored contract address to avoid React state timing issues
          console.log(`🎯 Refreshing market odds after bet placement for market: ${marketId}`);
          console.log(`🔍 Stored contract address:`, contractAddressForRefresh);
          console.log(`🗂️ Current marketContracts state:`, marketContracts);

          if (contractAddressForRefresh) {
            console.log(`📍 Using stored contract address: ${contractAddressForRefresh}`);
            console.log(`⏰ Setting refresh timeouts after transaction sent...`);

            // Multiple refresh attempts - transaction was sent but may still be confirming
            setTimeout(() => {
              console.log(`🚀 EXECUTING refreshMarketOddsWithAddress (attempt 1)...`);
              refreshMarketOddsWithAddress(marketId, contractAddressForRefresh!);
            }, 3000); // 3 seconds - allow time for confirmation

            setTimeout(() => {
              console.log(`🔄 EXECUTING refreshMarketOddsWithAddress (attempt 2)...`);
              refreshMarketOddsWithAddress(marketId, contractAddressForRefresh!);
            }, 8000); // 8 seconds - second attempt

            setTimeout(() => {
              console.log(`🔄 EXECUTING refreshMarketOddsWithAddress (attempt 3)...`);
              refreshMarketOddsWithAddress(marketId, contractAddressForRefresh!);
            }, 15000); // 15 seconds - third attempt

            setTimeout(() => {
              console.log(`🔄 EXECUTING refreshMarketOddsWithAddress (attempt 4)...`);
              refreshMarketOddsWithAddress(marketId, contractAddressForRefresh!);
            }, 30000); // 30 seconds - final attempt
          } else {
            console.log(`❌ No contract address available for refresh`);
            console.log(`🔍 Debugging: contractAddressForRefresh was:`, contractAddressForRefresh);
          }
        }
        }).catch(error => {
          console.error('Blockchain transaction failed:', error);
          // UI continues to work normally even if blockchain fails
        });
      } else {
        console.log(`📱 No contract found - bet will be stored locally for market ${marketId}`);
        // Bet was already recorded locally above, so this is fine
        // User will get success message below
      }
    }

    toast.success(
      `${position.toUpperCase()} position placed: ${amount} CAST`,
      {
        duration: 4000,
        description: `Bet placed on "${market.claim.substring(0, 60)}..." - Your balances will update shortly`
      }
    );
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

  // Handle market creation with context
  const handleCreateMarketWithContext = (context: 'truth-markets' | 'verify-truth') => {
    setMarketCreationContext(context);
    setCurrentTab('create-market');
  };

  // Handle new market submission - Enhanced with Hedera integration and admin approval
  const handleSubmitNewMarket = async (marketData: Partial<BettingMarket>) => {
    try {
      // Check if user is connected
      if (!walletConnection?.address) {
        toast.error('Please connect your wallet to create a market');
        return;
      }

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
        status: marketData.status || 'active', // Use status from CreateMarket component
        trending: false,
        country: marketData.country,
        region: marketData.region,
        marketType: marketData.marketType || 'future',
        confidenceLevel: marketData.confidenceLevel || 'medium',
        imageUrl: marketData.imageUrl // Add the imageUrl field
      };

      // Submit to pending markets first (for admin approval)
      pendingMarketsService.submitMarket(
        newMarket,
        walletConnection.address
      );

      // Submit to Hedera blockchain and wait for deployment
      console.log('🔗 Attempting to create market on Hedera...', {
        isHederaConnected,
        hasHederaCreateMarket: !!hederaCreateMarket,
        marketId: newMarket.id
      });

      if (isHederaConnected && hederaCreateMarket) {
        console.log('⏳ Starting blockchain deployment for market:', newMarket.id);

        try {
          // Wait for contract deployment to complete
          const contract = await hederaCreateMarket(marketData);
          
          if (contract && contract.contractId) {
            console.log(`✅ Market created on Hedera: ${contract.contractId}`);
            // Update the pending market with contract address immediately
            const pendingMarkets = pendingMarketsService.getPendingMarkets();
            const updatedMarkets = pendingMarkets.map(pending =>
              pending.id === newMarket.id
                ? { ...pending, contractAddress: contract.contractId }
                : pending
            );
            localStorage.setItem('blockcast_pending_markets', JSON.stringify(updatedMarkets));
            console.log(`✅ Contract address ${contract.contractId} stored with pending market ${newMarket.id}`);
            toast.success('Market created and deployed to blockchain! Awaiting admin approval.');
          } else {
            console.warn('⚠️ Contract deployment returned invalid result');
            throw new Error('Contract deployment failed - no valid contract address returned');
          }
        } catch (error) {
          console.error('❌ Blockchain market creation failed:', error);

          // Check if it's a timeout error with transaction hash
          const txHash = (error as any)?.txHash;
          if (txHash) {
            const hashScanUrl = `https://hashscan.io/testnet/transaction/${txHash}`;
            toast.error(
              <div className="space-y-2">
                <p className="font-semibold">Transaction confirmation timed out</p>
                <p className="text-sm">Your transaction was sent but we couldn't confirm it yet.</p>
                <a
                  href={hashScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline block"
                >
                  Check status on HashScan →
                </a>
              </div>,
              { duration: 10000 }
            );
          } else {
            toast.error(`Market creation failed: ${(error as Error).message}`);
          }
          return; // Don't create the market if blockchain deployment fails
        }
      } else {
        console.log('🔧 Hedera not connected - market will run in local mode');
        toast.success('Market created! Running in local mode.');
      }

      // Handle different market types differently
      if (newMarket.status === 'disputable') {
        // Disputable markets (Verify Truth) go directly to approved markets with dispute period
        // IMPORTANT: Calculate dispute period from market expiry time, not current time
        const disputePeriodEnd = new Date(newMarket.expiresAt.getTime() + DISPUTE_PERIOD.MILLISECONDS);

        // Create the market with dispute period
        const disputableMarket = {
          ...newMarket,
          dispute_period_end: disputePeriodEnd.toISOString(),
          status: 'disputable' as const
        };

        // Add to approved markets immediately with dispute period
        setMarkets(prev => [...prev, disputableMarket]);

        // Store in approved markets service with the disputable market data
        approvedMarketsService.storeApprovedMarket(
          disputableMarket,
          'system_auto_approved', // System approval for past events
          walletConnection.address,
          'Past event submitted for community verification'
        );

        // Record market creation
        userDataService.recordMarketCreation(
          walletConnection.address,
          marketId,
          newMarket.claim,
          `disputable-${Date.now()}`, // Use a proper transaction hash format
          newMarket
        );

        toast.success(`Past event published for community verification! It will be disputable for ${DISPUTE_PERIOD.HOURS} hours.`);
        setCurrentTab('verify-truth'); // Return to verify truth section
      } else {
        // Regular markets were already submitted to pending approval above

        // Record market creation in userDataService
        console.log('🔥 About to call recordMarketCreation with newMarket:', newMarket);
        console.log('🔥 newMarket.imageUrl specifically:', newMarket.imageUrl);
        userDataService.recordMarketCreation(
          walletConnection.address,
          marketId,
          newMarket.claim,
          `pending-${Date.now()}`, // Use a proper transaction hash format
          newMarket
        );

        // Don't show success message here - it was already shown above based on blockchain deployment status
        setCurrentTab('markets');
      }
    } catch (error) {
      toast.error('Failed to create market. Please try again.');
    }
  };

  // Render current page
  const renderCurrentPage = () => {
    console.log('🎯 renderCurrentPage called, isLoading:', isLoading, 'currentTab:', currentTab);
    
    if (isLoading) {
      console.log('🔄 Showing loading screen');
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          backgroundColor: 'white',
          color: 'black'
        }}>
          <div style={{textAlign: 'center'}}>
            <div>Loading Blockcast...</div>
            <div>Please wait while we initialize...</div>
          </div>
        </div>
      );
    }

    console.log('🎯 About to render main content');
    
    try {
      switch (currentTab) {
        case 'markets':
          console.log('🏪 Rendering unified markets with', markets.length, 'markets');
          if (!markets || markets.length === 0) {
            return <div style={{padding: '20px', background: 'yellow', color: 'black'}}>No markets available</div>;
          }

          return (
            <BettingMarkets
              onPlaceBet={handlePlaceBet}
              userBalance={castBalance}
              onMarketSelect={handleMarketSelect}
              markets={markets}
              onCreateMarket={handleCreateMarket}
              statusFilter="all"
              showUnified={true}
              walletConnected={walletConnection?.isConnected || false}
              onConnectWallet={connectWallet}
            />
          );
      case 'market-detail':
        return selectedMarket ? (
          <MarketPage
            market={selectedMarket}
            onPlaceBet={handlePlaceBet}
            userBalance={userProfile?.balance || 0}
            onBack={handleBackFromMarket}
            walletConnected={walletConnection?.isConnected || false}
            onConnectWallet={connectWallet}
          />
        ) : null;
      case 'portfolio':
        return <BettingPortfolio userBets={userBets} userBalance={userProfile?.balance || 0} />;
      case 'verify':
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <VerificationInput 
              onSubmit={handleVerifyTruth}
              isLoading={isVerifying}
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
            onBack={() => setCurrentTab(marketCreationContext === 'truth-markets' ? 'markets' : 'verify-truth')}
            onCreateMarket={handleSubmitNewMarket}
            marketContext={marketCreationContext}
          />
        );
      case 'profile':
        return <Profile 
          userBalance={userProfile?.balance || 0}
        />;
      case 'settings':
        return <Settings
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          userBalance={userProfile?.balance || 0}
          castBalance={castBalance}
          walletConnected={walletConnection?.isConnected || false}
          userBets={userBets}
          verificationHistory={verificationHistory}
          onSelectVerification={handleSelectVerification}
          onCreateMarket={handleCreateMarket}
        />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService />;
      case 'admin':
        // Only show admin panel if user is in admin mode and is authorized
        if (adminMode === 'admin' && walletConnection?.address &&
            adminService.isAdmin(walletConnection.address)) {

          // Render admin layout with all tabs
          return (
            <Admin
              walletConnection={walletConnection}
              activeTab={activeAdminTab}
              onTabChange={setActiveAdminTab}
            />
          );
        } else {
          // Redirect to markets if trying to access admin without proper mode/permissions
          setCurrentTab('markets');
          return (
            <BettingMarkets
              onPlaceBet={handlePlaceBet}
              userBalance={castBalance}
              onMarketSelect={handleMarketSelect}
              markets={markets}
              onCreateMarket={() => handleCreateMarketWithContext('truth-markets')}
              statusFilter="active"
              walletConnected={walletConnection?.isConnected || false}
              onConnectWallet={connectWallet}
            />
          );
        }
      default:
        return (
          <BettingMarkets
            onPlaceBet={handlePlaceBet}
            userBalance={userProfile?.balance || 0}
            onMarketSelect={handleMarketSelect}
            markets={markets}
            onCreateMarket={handleCreateMarket}
            statusFilter="active"
            walletConnected={walletConnection?.isConnected || false}
            onConnectWallet={connectWallet}
          />
        );
    }
    } catch (error) {
      console.error('❌ Error rendering main content:', error);
      return (
        <div style={{padding: '20px', background: 'red', color: 'white', position: 'fixed', top: 0, left: 0, zIndex: 10000}}>
          <h1>RENDER ERROR</h1>
          <p>Error: {error.message}</p>
          <p>Stack: {error.stack}</p>
        </div>
      );
    }
  };


  // Show onboarding if needed - BUT PREVENT IT FROM SHOWING AFTER INITIALIZATION
  if (showOnboarding && isLoading) {
    console.log('📚 Would show onboarding, but preventing it');
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
          castBalance={castBalance}
          walletConnected={walletConnection?.isConnected || false}
          walletAddress={walletConnection?.address}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          hederaEVMService={hederaEVMService}
          onRefreshBalance={refreshCastBalance}
        />

        {/* Admin Mode Switcher - Only show for admin users */}
        {walletConnection?.isConnected && walletConnection?.address && 
         adminService.isAdmin(walletConnection.address) && (
          <div className="container mx-auto px-4 pt-4 max-w-7xl lg:px-8">
            <AdminModeSwitcher
              walletAddress={walletConnection.address}
              currentMode={adminMode}
              onModeChange={handleAdminModeChange}
            />
          </div>
        )}

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
                    {formatCurrency(castBalance || 0.0)} CAST
                  </div>
                  <span className="text-sm text-muted-foreground">Trading Balance</span>
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