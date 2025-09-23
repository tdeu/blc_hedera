 Market found for betting: {id: 'market_1758614886755_km5srl0vm', claim: 'nueva markto', contractAddress: '0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108'}
userDataService.ts:170 ✅ Bet recorded locally: {id: 'market_1758614886755_km5srl0vm-1758617085911', marketId: 'market_1758614886755_km5srl0vm', marketClaim: 'nueva markto', position: 'no', amount: 5, …}
App.tsx:804 🔍 Hedera connection status: {isHederaConnected: true, walletConnected: true}
App.tsx:810 ✅ Using existing market contract address from database: 0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108
App.tsx:847 📝 Contract address ready for market market_1758614886755_km5srl0vm: 0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108
useHedera.ts:226 🎯 placeBetWithAddress called with: {marketAddress: '0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108', position: 'no', amount: 5}
useHedera.ts:227 📊 HederaEVMService status: AVAILABLE
useHedera.ts:228 🔍 Market address validation: {isString: true, length: 42, startsWith0x: true, isValid: true}
useHedera.ts:246 🚀 Starting real bet placement with HederaEVMService...
hederaEVMService.ts:306 🎯 HederaEVMService.placeBet called: {marketAddress: '0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108', position: 'no', amount: 5}
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617085940
App.tsx:1032 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1053 🎯 About to render main content
App.tsx:1058 🏪 Rendering unified markets with 42 markets
App.tsx:315 🔥 UserProfile changed: exists
hederaEVMService.ts:334 🪙 Collateral token address: 0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d
hederaEVMService.ts:340 📊 Shares to buy: 5.0
hederaEVMService.ts:347 💰 Cost for 5 NO shares: 2.43840983143341567 tokens
hederaEVMService.ts:350 🔍 Checking balance for address: 0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD
hederaEVMService.ts:351 🔍 Collateral contract address: 0x0F15071DaBb3c22203dA7071A031a404ce2B1a2d
hederaEVMService.ts:352 ⚠️ TEMPORARILY SKIPPING BALANCE CHECK TO TEST BETTING FLOW
hederaEVMService.ts:355 💳 Simulated user balance: 1000.0 tokens (TESTING MODE)
hederaEVMService.ts:356 💰 Required cost: 2.43840983143341567 tokens
hederaEVMService.ts:357 ✅ Simulated balance check passed - proceeding with bet...
hederaEVMService.ts:361 🔒 Current allowance: 0.0
hederaEVMService.ts:364 📝 Approving collateral...
hederaEVMService.ts:367 ✅ Collateral approved
hederaEVMService.ts:371 🎲 Placing NO bet...
hederaEVMService.ts:376 📤 Bet transaction sent: 0x1d670ea7529e14b011367c089ba2d6bd3738948a42806782082b30c56baaf33d
hederaEVMService.ts:379 ✅ Bet transaction confirmed: 0x1d670ea7529e14b011367c089ba2d6bd3738948a42806782082b30c56baaf33d
useHedera.ts:253 Position placed on blockchain: 0x1d670ea7529e14b011367c089ba2d6bd3738948a42806782082b30c56baaf33d
App.tsx:852 Bet recorded on Hedera blockchain: 0x1d670ea7529e14b011367c089ba2d6bd3738948a42806782082b30c56baaf33d
App.tsx:862 🎯 Refreshing market odds after bet placement for market: market_1758614886755_km5srl0vm
App.tsx:863 🔍 Stored contract address: 0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108
App.tsx:864 🗂️ Current marketContracts state: {}
App.tsx:867 📍 Using stored contract address: 0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108
App.tsx:868 ⏰ Setting 1-second timeout before calling refreshMarketOddsWithAddress...
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617115398
App.tsx:1032 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1053 🎯 About to render main content
App.tsx:1058 🏪 Rendering unified markets with 42 markets
App.tsx:870 🚀 EXECUTING refreshMarketOddsWithAddress now!
App.tsx:179 🔄 Refreshing market odds for market_1758614886755_km5srl0vm using direct contract address: 0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108
hederaEVMService.ts:53 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0xa9C5D6286F38b672B7a17763d72A8565559EC13c', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:71 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:73 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:75 ✅ EVM Service initialized with private key
hederaEVMService.ts:431 🔍 Getting market prices for contract: 0x22eC50A58d9348a4F9ABba2fDf0D300a3FF9b108
hederaEVMService.ts:457 📞 Calling getCurrentPrice()...
hederaEVMService.ts:460 📊 Raw prices from contract: {priceYesWei: '468915963761324586', priceNoWei: '531084036238675414'}
hederaEVMService.ts:495 ✅ Market prices calculated: {yesPrice: 0.4689159637613246, noPrice: 0.5310840362386754, yesOdds: 2.1739130434782608, noOdds: 1.8518518518518516, yesProb: 0.46, …}
App.tsx:191 🔄 State update for market market_1758614886755_km5srl0vm: {found: true, oldYesOdds: 2, newYesOdds: 2.1739130434782608, oldNoOdds: 2, newNoOdds: 1.8518518518518516}
App.tsx:211 ✅ Market odds updated for market_1758614886755_km5srl0vm using direct address: {yesOdds: '2.174', noOdds: '1.852', yesProb: '46.0%', noProb: '54.0%'}
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617118330
App.tsx:1032 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1053 🎯 About to render main content
App.tsx:1058 🏪 Rendering unified markets with 42 markets
App.tsx:311 🔥 Markets changed - count: 42 (loaded from Supabase)


reload main page: 

[vite] connecting...
client:912 [vite] connected.
chunk-VZA4JSNL.js?v=67557bf1:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
@hashgraph_sdk.js?v=67557bf1:19767 Patching Protobuf Long.js instance...
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617163331
App.tsx:1032 🎯 renderCurrentPage called, isLoading: true currentTab: markets
App.tsx:1035 🔄 Showing loading screen
UserContext.tsx:32 🔌 Wallet disconnected, clearing profile
useHedera.ts:53 🔄 Initializing HederaEVMService with private key (will update with wallet if connected)...
useHedera.ts:54 🔍 EVM Config details: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0xa9C5D6286F38b672B7a17763d72A8565559EC13c', hasPrivateKey: true, privateKeyLength: 66}
hederaEVMService.ts:53 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0xa9C5D6286F38b672B7a17763d72A8565559EC13c', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:71 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:73 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:75 ✅ EVM Service initialized with private key
useHedera.ts:62 ✅ HederaEVMService initialized successfully
useHedera.ts:78 Connected to Hedera network (HCS + EVM)
App.tsx:291 🔥 MAIN useEffect triggered - will call initializeApp
App.tsx:416 🚀 Starting app initialization...
App.tsx:421 🌙 Setting up dark mode...
App.tsx:426 📚 Checking onboarding status...
App.tsx:71 🔍 Onboarding check: {onboarded: 'true', shouldShow: false}
App.tsx:431 📊 Loading approved markets...
App.tsx:297 🧪 DEBUG: window.testMarketRefresh() and window.marketContracts available in console
App.tsx:302 🔥 State changed - isLoading: true showOnboarding: false currentTab: markets
App.tsx:311 🔥 Markets changed - count: 0 (empty - loading from Supabase)
App.tsx:315 🔥 UserProfile changed: null
App.tsx:413 🔄 DEBUG FUNCTIONS UPDATED: marketContracts count: 0
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617163475
App.tsx:1032 🎯 renderCurrentPage called, isLoading: true currentTab: markets
App.tsx:1035 🔄 Showing loading screen
disputeService.ts:69 No dispute bond token found, will create when needed
approvedMarketsService.ts:222 🔍 NEW MARKET CONTRACT DEBUG: null
approvedMarketsService.ts:223 🔍 NEW MARKET TYPE: object
approvedMarketsService.ts:224 🔍 NEW MARKET ID: market_1758612204970_xgolhnr9c
App.tsx:583 🎉 Adding 42 approved markets to homepage (42 from Supabase, 0 from localStorage)
App.tsx:435 ⚙️ Setting up admin callbacks...
App.tsx:439 👤 Creating user profile...
App.tsx:453 💳 Attempting auto-wallet connection...
App.tsx:461 ✅ App initialization complete!
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617163909
App.tsx:1032 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1053 🎯 About to render main content
App.tsx:1058 🏪 Rendering unified markets with 42 markets
App.tsx:302 🔥 State changed - isLoading: false showOnboarding: false currentTab: markets
App.tsx:311 🔥 Markets changed - count: 42 (loaded from Supabase)
App.tsx:315 🔥 UserProfile changed: exists
chunk-VZA4JSNL.js?v=67557bf1:377 [Violation] 'message' handler took 235ms
[Violation] Forced reflow while executing JavaScript took 74ms
walletService.ts:36 🔄 Connecting to MetaMask...
walletService.ts:47 ✅ Account access granted: 0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead
walletService.ts:53 🔄 Switching to Hedera testnet...
walletService.ts:58 ✅ Network switched successfully
walletService.ts:76 ✅ Wallet connected successfully: {address: '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', balance: '137.52780676', chainId: 296}
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617164479
App.tsx:1032 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1053 🎯 About to render main content
App.tsx:1058 🏪 Rendering unified markets with 42 markets
UserContext.tsx:29 🔄 Wallet connected, loading user profile for: 0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead
UserContext.tsx:40 📋 Loading profile for wallet: 0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead
useHedera.ts:94 🔄 Updating HederaEVMService with connected wallet...
hederaEVMService.ts:53 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0xa9C5D6286F38b672B7a17763d72A8565559EC13c', useConnectedWallet: true, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:68 ✅ EVM Service initialized with connected wallet
useHedera.ts:103 ✅ HederaEVMService updated with connected wallet address: 0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead
App.tsx:315 🔥 UserProfile changed: exists
UserContext.tsx:63 🔄 Updating profile with real stats
[Violation] Forced reflow while executing JavaScript took 57ms
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617164667
App.tsx:1032 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1053 🎯 About to render main content
App.tsx:1058 🏪 Rendering unified markets with 42 markets
UserContext.tsx:66 ✅ Profile loaded successfully
App.tsx:96 🔥 APP COMPONENT RENDER - timestamp: 1758617166690
App.tsx:1032 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1053 🎯 About to render main content
App.tsx:1058 🏪 Rendering unified markets with 42 markets
