APP COMPONENT RENDER - timestamp: 1759175776045
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: create-market
App.tsx:1262 🎯 About to render main content
App.tsx:370 🔥 State changed - isLoading: false showOnboarding: false currentTab: create-market
marketStatusService.ts:77 🔍 Checking 13 markets for status updates...
CreateMarket.tsx:163 🕐 Date validation debug: {now: '2025-09-29T19:56:36.688Z', selectedDate: '2025-10-11T19:56:00.000Z', nowTime: 1759175796688, selectedTime: 1760212560000, difference: 1036763312, …}
CreateMarket.tsx:185 🔍 DEBUG: selectedImage exists? false
CreateMarket.tsx:186 🔍 DEBUG: selectedImage details: null
CreateMarket.tsx:221 📤 Creating market with data: {claim: 'zezezezezezezzzzzzzzzzz', imageUrl: undefined, hasImage: false}
pendingMarketsService.ts:40 📝 Market submitted for approval: zezezezezezezzzzzzzzzzz
App.tsx:1144 🔗 Attempting to create market on Hedera... {isHederaConnected: true, hasHederaCreateMarket: true, marketId: 'market_1759175796691_nlqgg40i1'}
App.tsx:1151 ⏳ Starting blockchain deployment for market: market_1759175796691_nlqgg40i1
useHedera.ts:115 🏗️ createMarket called with: {hederaEVMService: true, isConnected: true, isLoading: false, marketClaim: 'zezezezezezezzzzzzzzzzz'}
useHedera.ts:148 🚀 Calling hederaEVMService.createMarket...
useHedera.ts:149 📋 Market details: {claim: 'zezezezezezezzzzzzzzzzz', description: 'zezezezezezezzzzzzzzzzzzezezezezezezzzzzzzzzzz', expiresAt: Sat Oct 11 2025 22:56:00 GMT+0300 (heure normale d’Afrique de l’Est), category: 'Sports'}
hederaEVMService.ts:115 Creating market on Hedera EVM: {claim: 'zezezezezezezzzzzzzzzzz', expirationDate: Sat Oct 11 2025 22:56:00 GMT+0300 (heure normale d’Afrique de l’Est)}
hederaEVMService.ts:118 🔍 Testing connectivity...
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175796700
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: create-market
App.tsx:1262 🎯 About to render main content
hederaEVMService.ts:120 ✅ Signer balance: 69.88822747 HBAR
hederaEVMService.ts:128 🏭 Factory contract initialized at: 0xD2092162aD3A392686A6B0e5dFC0d34c953c221D
hederaEVMService.ts:133 🔍 Factory paused status: false
hederaEVMService.ts:141 📊 Proceeding with market creation
hederaEVMService.ts:147 ⏰ User specified expiration: 2025-10-11T19:56:00.000Z
hederaEVMService.ts:148 ⏰ Market end time: 1760212560 vs current time: 1759175797
hederaEVMService.ts:149 ⏰ Time difference: 1036763 seconds
hederaEVMService.ts:150 ⏰ Market will expire in: 287.9897222222222 hours
hederaEVMService.ts:156 🚀 About to call factory.createMarket with params: {claim: 'zezezezezezezzzzzzzzzzz...', endTime: 1760212560, gasLimit: 15000000}
hederaEVMService.ts:167 ⏳ Waiting for transaction confirmation...
hederaEVMService.ts:168 🔍 About to wait for receipt...
marketStatusService.ts:77 🔍 Checking 13 markets for status updates...
hederaEVMService.ts:184 ✅ Transaction confirmed: 0x62cbe3ac7f897eb161e605c4058bd935bc8e9259470555eaee6625b182e4a709
hederaEVMService.ts:185 📋 Receipt status: 1
hederaEVMService.ts:186 📋 Gas used: 12000000
hederaEVMService.ts:187 📋 Receipt logs count: 1
hederaEVMService.ts:251 🔍 Raw logs from receipt:
hederaEVMService.ts:253 Log 0: {address: '0xD2092162aD3A392686A6B0e5dFC0d34c953c221D', topics: Array(2), data: '0x0000000000000000000000006694d2ee3b5869ad5c622780…57a657a657a7a7a7a7a7a7a7a7a7a7a000000000000000000'}
hederaEVMService.ts:262 🔍 Attempting to parse log from address: 0xD2092162aD3A392686A6B0e5dFC0d34c953c221D
hederaEVMService.ts:263 🔍 Factory address: 0xD2092162aD3A392686A6B0e5dFC0d34c953c221D
hederaEVMService.ts:264 🔍 Addresses match: true
hederaEVMService.ts:267 🔍 Parsed successfully: MarketCreated Proxy(_Result) {0: '0xb630e04f2bcbc7b7b2580b0984b2dadff67a9beed2352510b064b00cc8002aec', 1: '0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2', 2: 'zezezezezezezzzzzzzzzzz'}
hederaEVMService.ts:268 🔍 Log topics: (2) ['0xc541e2497675ce714e07255730ed49d88f45ecf375056391d8238dcd463fbbb6', '0xb630e04f2bcbc7b7b2580b0984b2dadff67a9beed2352510b064b00cc8002aec']
hederaEVMService.ts:269 🔍 Log data: 0x0000000000000000000000006694d2ee3b5869ad5c6227808b5ff4dd958e07a2000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000177a657a657a657a657a657a657a7a7a7a7a7a7a7a7a7a7a000000000000000000
hederaEVMService.ts:272 ✅ MarketCreated event found via normal parsing!
hederaEVMService.ts:273 📍 Parsed args: Proxy(_Result) {0: '0xb630e04f2bcbc7b7b2580b0984b2dadff67a9beed2352510b064b00cc8002aec', 1: '0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2', 2: 'zezezezezezezzzzzzzzzzz'}
hederaEVMService.ts:274 📍 Args keys: (3) ['0', '1', '2']
hederaEVMService.ts:275 📍 Args[0] (id): 0xb630e04f2bcbc7b7b2580b0984b2dadff67a9beed2352510b064b00cc8002aec
hederaEVMService.ts:276 📍 Args[1] (market): 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:277 📍 Args[2] (question): zezezezezezezzzzzzzzzzz
hederaEVMService.ts:281 📍 Market address extracted: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:341 🎉 Market created successfully at address: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
useHedera.ts:163 ✅ Market created on Hedera EVM: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
useHedera.ts:164 📋 Market contract details: {contractId: '0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2', topicId: 'market-0x6694D2EE', createdAt: Mon Sep 29 2025 22:56:52 GMT+0300 (heure normale d’Afrique de l’Est), status: 'active'}
useHedera.ts:165 🔍 Contract ID validation: {isString: true, length: 42, startsWith0x: true, isMock: false, isValid: true}
App.tsx:1158 ✅ Market created on Hedera: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
App.tsx:1167 ✅ Contract address 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2 stored with pending market market_1759175796691_nlqgg40i1
App.tsx:1221 🔥 About to call recordMarketCreation with newMarket: {id: 'market_1759175796691_nlqgg40i1', claim: 'zezezezezezezzzzzzzzzzz', category: 'Sports', source: 'zezezezezezezzzzzzzzzzz', description: 'zezezezezezezzzzzzzzzzzzezezezezezezzzzzzzzzzz', …}
App.tsx:1222 🔥 newMarket.imageUrl specifically: undefined
userDataService.ts:190 🚨 RECORD MARKET CREATION CALLED! {walletAddress: '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', marketId: 'market_1759175796691_nlqgg40i1', claim: 'zezezezezezezzzzzzzzzzz', transactionHash: 'pending-1759175812494', fullMarketData: {…}, …}
userDataService.ts:213 🔍 DEBUG: Recording market with imageUrl: undefined
userDataService.ts:214 ✅ Market creation recorded locally: {id: 'market_1759175796691_nlqgg40i1', claim: 'zezezezezezezzzzzzzzzzz', createdAt: Mon Sep 29 2025 22:56:52 GMT+0300 (heure normale d’Afrique de l’Est), transactionHash: 'pending-1759175812494', submitterAddress: '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', …}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175812497
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 72 markets
App.tsx:370 🔥 State changed - isLoading: false showOnboarding: false currentTab: markets
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175815666
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: admin
App.tsx:1262 🎯 About to render main content
App.tsx:370 🔥 State changed - isLoading: false showOnboarding: false currentTab: admin
pendingMarketsService.ts:205 🔍 DEBUG: Converting submission with imageUrl: undefined
pendingMarketsService.ts:234 🔍 DEBUG: Converted to pending market format with imageUrl: undefined
MarketApproval.tsx:131 🏛️ Admin dashboard rendering market: {id: 'market_1759175796691_nlqgg40i1', question: 'zezezezezezezzzzzzzzzzz', hasImageUrl: false, imageUrl: undefined, imageUrlType: 'undefined', …}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175816969
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: admin
App.tsx:1262 🎯 About to render main content
approvedMarketsService.ts:222 🔍 NEW MARKET CONTRACT DEBUG: null
approvedMarketsService.ts:223 🔍 NEW MARKET TYPE: object
approvedMarketsService.ts:224 🔍 NEW MARKET ID: market_1758612204970_xgolhnr9c
approvedMarketsService.ts:222 🔍 NEW MARKET CONTRACT DEBUG: null
approvedMarketsService.ts:223 🔍 NEW MARKET TYPE: object
approvedMarketsService.ts:224 🔍 NEW MARKET ID: market_1758612204970_xgolhnr9c
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175820563
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: admin
App.tsx:1262 🎯 About to render main content
pendingMarketsService.ts:205 🔍 DEBUG: Converting submission with imageUrl: undefined
pendingMarketsService.ts:234 🔍 DEBUG: Converted to pending market format with imageUrl: undefined
MarketApproval.tsx:131 🏛️ Admin dashboard rendering market: {id: 'market_1759175796691_nlqgg40i1', question: 'zezezezezezezzzzzzzzzzz', hasImageUrl: false, imageUrl: undefined, imageUrlType: 'undefined', …}
adminService.ts:143 Admin 0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead approving market market_1759175796691_nlqgg40i1
pendingMarketsService.ts:124 ✅ Market approved by admin: zezezezezezezzzzzzzzzzz
pendingMarketsService.ts:132 🔍 APPROVAL DEBUG: contractAddress from pending market: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
pendingMarketsService.ts:133 🔍 APPROVAL DEBUG: final approved market contractAddress: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
MarketApproval.tsx:131 🏛️ Admin dashboard rendering market: {id: 'market_1759175796691_nlqgg40i1', question: 'zezezezezezezzzzzzzzzzz', hasImageUrl: false, imageUrl: undefined, imageUrlType: 'undefined', …}
approvedMarketsService.ts:48 ✅ Market stored in Supabase: zezezezezezezzzzzzzzzzz
App.tsx:764 🎉 Market approved and added to homepage: zezezezezezezzzzzzzzzzz
adminService.ts:379 🔗 Activating market market_1759175796691_nlqgg40i1 on-chain...
adminService.ts:403 📝 Calling contract.approveMarket() for 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
adminService.ts:409 🔐 Using signer address: 0xfd76D4c18D5A10F558d057743bFB0218130157f4
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175822949
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: admin
App.tsx:1262 🎯 About to render main content
MarketApproval.tsx:131 🏛️ Admin dashboard rendering market: {id: 'market_1759175796691_nlqgg40i1', question: 'zezezezezezezzzzzzzzzzz', hasImageUrl: false, imageUrl: undefined, imageUrlType: 'undefined', …}
App.tsx:379 🔥 Markets changed - count: 73 (loaded from Supabase)
adminService.ts:422 📊 Current market status: 0 (type: bigint)
adminService.ts:426 ✅ Market is Submited, calling approveMarket()...
adminService.ts:428 📤 Transaction sent: 0xba91e1a0a4712045a7adee1d830408df14637ad5d8300476c33b4732acd28c14
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175826463
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 73 markets
App.tsx:370 🔥 State changed - isLoading: false showOnboarding: false currentTab: markets
BettingMarkets.tsx:193 🎯 BettingMarkets: handleOpenBetDialog called with market: {id: 'market_1759175796691_nlqgg40i1', claim: 'zezezezezezezzzzzzzzzzz'}
adminService.ts:431 ✅ Market market_1759175796691_nlqgg40i1 activated on-chain! Gas used: 400000
adminService.ts:435 🎉 New market status: 1 (should be 1 for Open)
adminService.ts:481 📝 Recording approval to HCS: {action: 'market_approval', marketId: 'market_1759175796691_nlqgg40i1', adminAddress: '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', reason: 'Market approved by admin review', status: 'contract_activated', …}
BettingMarkets.tsx:216 🎯 BettingMarkets: handlePlaceBet called with selectedMarket: {id: 'market_1759175796691_nlqgg40i1', claim: 'zezezezezezezzzzzzzzzzz'}
App.tsx:910 🏪 Market found for betting: {id: 'market_1759175796691_nlqgg40i1', claim: 'zezezezezezezzzzzzzzzzz', contractAddress: '0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2'}
userDataService.ts:174 ✅ Bet recorded locally: {id: 'market_1759175796691_nlqgg40i1-1759175838504', marketId: 'market_1759175796691_nlqgg40i1', marketClaim: 'zezezezezezezzzzzzzzzzz', position: 'no', amount: 8, …}
App.tsx:951 🔍 Hedera connection status: {isHederaConnected: true, walletConnected: true}
App.tsx:957 ✅ Using existing market contract address: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
App.tsx:979 📝 Proceeding with bet placement for market market_1759175796691_nlqgg40i1. Contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
App.tsx:982 🚀 Placing bet on blockchain contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
useHedera.ts:227 🎯 placeBetWithAddress called with: {marketAddress: '0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2', position: 'no', amount: 8}
useHedera.ts:228 📊 HederaEVMService status: AVAILABLE
useHedera.ts:229 🔍 Market address validation: {isString: true, length: 42, startsWith0x: true, isValid: true}
useHedera.ts:247 🚀 Starting real bet placement with HederaEVMService...
useHedera.ts:252 🎯 About to call hederaEVMService.placeBet...
hederaEVMService.ts:391 🎯 HederaEVMService.placeBet called: {marketAddress: '0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2', position: 'no', amount: 8}
hederaEVMService.ts:400 🔐 Skipping market authorization check (bypass enabled)
hederaEVMService.ts:401 ✅ Proceeding with bet without authorization check
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175838515
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 73 markets
App.tsx:383 🔥 UserProfile changed: exists
hederaEVMService.ts:424 🪙 Collateral token address: 0xC78Ac73844077917E20530E36ac935c4B56236c2
hederaEVMService.ts:430 📊 Shares to buy: 8.0
hederaEVMService.ts:437 💰 Cost for 8 NO shares: 5.6 tokens
hederaEVMService.ts:440 🔍 Checking balance for address: 0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD
hederaEVMService.ts:441 🔍 Collateral contract address: 0xC78Ac73844077917E20530E36ac935c4B56236c2
hederaEVMService.ts:454 💳 User CAST balance (attempt 1): 68.532309792187387407 tokens
hederaEVMService.ts:455 💰 Required cost: 5.6 tokens
hederaEVMService.ts:458 ✅ Balance check result: SUFFICIENT
hederaEVMService.ts:493 ✅ Balance check passed - proceeding with bet...
marketStatusService.ts:77 🔍 Checking 14 markets for status updates...
hederaEVMService.ts:497 🔒 Current allowance: 0.0
hederaEVMService.ts:500 📝 Approving collateral...
hederaEVMService.ts:503 ✅ Collateral approved with unlimited allowance
hederaEVMService.ts:507 🎲 Placing NO bet...
hederaEVMService.ts:516 ⛽ Estimated gas: 347844
hederaEVMService.ts:520 ⛽ Using gas limit: 417412
hederaEVMService.ts:526 📤 Bet transaction sent: 0x1379168a47739538f673cba16e09a8ec8a2638c4859888c675d2411dd02ccf48
hederaEVMService.ts:550 ⏳ Waiting for transaction confirmation...
hederaEVMService.ts:560 ✅ Transaction confirmed: 0x1379168a47739538f673cba16e09a8ec8a2638c4859888c675d2411dd02ccf48
hederaEVMService.ts:561 📊 Gas used: 333930
useHedera.ts:254 ✅ hederaEVMService.placeBet completed successfully
useHedera.ts:256 Position placed on blockchain: 0x1379168a47739538f673cba16e09a8ec8a2638c4859888c675d2411dd02ccf48
App.tsx:987 Bet recorded on Hedera blockchain: 0x1379168a47739538f673cba16e09a8ec8a2638c4859888c675d2411dd02ccf48
App.tsx:996 🔄 Refreshing wallet balances after successful bet...
App.tsx:1033 🎯 Refreshing market odds after bet placement for market: market_1759175796691_nlqgg40i1
App.tsx:1034 🔍 Stored contract address: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
App.tsx:1035 🗂️ Current marketContracts state: {}
App.tsx:1038 📍 Using stored contract address: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
App.tsx:1039 ⏰ Setting refresh timeouts after transaction sent...
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175870837
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 73 markets
marketStatusService.ts:77 🔍 Checking 14 markets for status updates...
walletService.ts:125 🔄 Attempting to get balance (attempt 1/3)...
walletService.ts:127 ✅ Balance retrieved successfully
App.tsx:1004 💰 Balance update after bet: {hbar: '65.13719477', cast: '62.932309792187387407', change: 'HBAR: -4.7510 (gas fees)', stakePaid: '8 CAST (from CAST balance)'}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175873324
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 73 markets
App.tsx:1043 🚀 EXECUTING refreshMarketOddsWithAddress (attempt 1)...
App.tsx:184 🔄 Refreshing market odds for market_1759175796691_nlqgg40i1 using direct contract address: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:55 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0xD2092162aD3A392686A6B0e5dFC0d34c953c221D', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:73 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:75 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:77 ✅ EVM Service initialized with private key
hederaEVMService.ts:632 🔍 Getting market prices for contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:658 📞 Calling getCurrentPrice()...
hederaEVMService.ts:82 💰 Private key wallet balance: 872.67968992 HBAR
hederaEVMService.ts:661 📊 Raw prices from contract: {priceYesWei: '100000000000000000', priceNoWei: '900000000000000000'}
hederaEVMService.ts:696 ✅ Market prices calculated: {yesPrice: 0.1, noPrice: 0.9, yesOdds: 10, noOdds: 1.1111111111111112, yesProb: 0.1, …}
hederaEVMService.ts:770 🔍 Getting market volume for contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:785 💰 Market volume: 5.6 CAST
App.tsx:193 📊 Fetched prices from blockchain: {yesOdds: 10, noOdds: 1.1111111111111112, yesProb: '10.0%', noProb: '90.0%', yesPrice: 0.1, …}
App.tsx:206 🔄 State update for market market_1759175796691_nlqgg40i1: {found: true, oldYesOdds: 2, newYesOdds: 10, oldNoOdds: 2, newNoOdds: 1.1111111111111112, …}
App.tsx:234 ✅ Market odds updated for market_1759175796691_nlqgg40i1 using direct address: {yesOdds: '10.000', noOdds: '1.111', yesProb: '10.0%', noProb: '90.0%'}
App.tsx:255 ⚠️ Failed to save odds to Supabase: ReferenceError: supabase is not defined
    at refreshMarketOddsWithAddress (App.tsx:243:9)
refreshMarketOddsWithAddress @ App.tsx:255
await in refreshMarketOddsWithAddress
(anonymous) @ App.tsx:1044
setTimeout
(anonymous) @ App.tsx:1042
Promise.then
handlePlaceBet @ App.tsx:985
await in handlePlaceBet
handlePlaceBet @ BettingMarkets.tsx:219
handleEvent @ chunk-OOS6ENNK.js?v=67557bf1:15
callCallback2 @ chunk-VZA4JSNL.js?v=67557bf1:3680
invokeGuardedCallbackDev @ chunk-VZA4JSNL.js?v=67557bf1:3705
invokeGuardedCallback @ chunk-VZA4JSNL.js?v=67557bf1:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-VZA4JSNL.js?v=67557bf1:3742
executeDispatch @ chunk-VZA4JSNL.js?v=67557bf1:7046
processDispatchQueueItemsInOrder @ chunk-VZA4JSNL.js?v=67557bf1:7066
processDispatchQueue @ chunk-VZA4JSNL.js?v=67557bf1:7075
dispatchEventsForPlugins @ chunk-VZA4JSNL.js?v=67557bf1:7083
(anonymous) @ chunk-VZA4JSNL.js?v=67557bf1:7206
batchedUpdates$1 @ chunk-VZA4JSNL.js?v=67557bf1:18966
batchedUpdates @ chunk-VZA4JSNL.js?v=67557bf1:3585
dispatchEventForPluginEventSystem @ chunk-VZA4JSNL.js?v=67557bf1:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-VZA4JSNL.js?v=67557bf1:5484
dispatchEvent @ chunk-VZA4JSNL.js?v=67557bf1:5478
dispatchDiscreteEvent @ chunk-VZA4JSNL.js?v=67557bf1:5455Understand this warning
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175876495
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 73 markets
App.tsx:379 🔥 Markets changed - count: 73 (loaded from Supabase)
App.tsx:1048 🔄 EXECUTING refreshMarketOddsWithAddress (attempt 2)...
App.tsx:184 🔄 Refreshing market odds for market_1759175796691_nlqgg40i1 using direct contract address: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:55 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0xD2092162aD3A392686A6B0e5dFC0d34c953c221D', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:73 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:75 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:77 ✅ EVM Service initialized with private key
hederaEVMService.ts:632 🔍 Getting market prices for contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:658 📞 Calling getCurrentPrice()...
hederaEVMService.ts:82 💰 Private key wallet balance: 872.67968992 HBAR
hederaEVMService.ts:661 📊 Raw prices from contract: {priceYesWei: '100000000000000000', priceNoWei: '900000000000000000'}
hederaEVMService.ts:696 ✅ Market prices calculated: {yesPrice: 0.1, noPrice: 0.9, yesOdds: 10, noOdds: 1.1111111111111112, yesProb: 0.1, …}
hederaEVMService.ts:770 🔍 Getting market volume for contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:785 💰 Market volume: 5.6 CAST
App.tsx:193 📊 Fetched prices from blockchain: {yesOdds: 10, noOdds: 1.1111111111111112, yesProb: '10.0%', noProb: '90.0%', yesPrice: 0.1, …}
App.tsx:206 🔄 State update for market market_1759175796691_nlqgg40i1: {found: true, oldYesOdds: 10, newYesOdds: 10, oldNoOdds: 1.1111111111111112, newNoOdds: 1.1111111111111112, …}
App.tsx:234 ✅ Market odds updated for market_1759175796691_nlqgg40i1 using direct address: {yesOdds: '10.000', noOdds: '1.111', yesProb: '10.0%', noProb: '90.0%'}
App.tsx:255 ⚠️ Failed to save odds to Supabase: ReferenceError: supabase is not defined
    at refreshMarketOddsWithAddress (App.tsx:243:9)
refreshMarketOddsWithAddress @ App.tsx:255
await in refreshMarketOddsWithAddress
(anonymous) @ App.tsx:1049
setTimeout
(anonymous) @ App.tsx:1047
Promise.then
handlePlaceBet @ App.tsx:985
await in handlePlaceBet
handlePlaceBet @ BettingMarkets.tsx:219
handleEvent @ chunk-OOS6ENNK.js?v=67557bf1:15
callCallback2 @ chunk-VZA4JSNL.js?v=67557bf1:3680
invokeGuardedCallbackDev @ chunk-VZA4JSNL.js?v=67557bf1:3705
invokeGuardedCallback @ chunk-VZA4JSNL.js?v=67557bf1:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-VZA4JSNL.js?v=67557bf1:3742
executeDispatch @ chunk-VZA4JSNL.js?v=67557bf1:7046
processDispatchQueueItemsInOrder @ chunk-VZA4JSNL.js?v=67557bf1:7066
processDispatchQueue @ chunk-VZA4JSNL.js?v=67557bf1:7075
dispatchEventsForPlugins @ chunk-VZA4JSNL.js?v=67557bf1:7083
(anonymous) @ chunk-VZA4JSNL.js?v=67557bf1:7206
batchedUpdates$1 @ chunk-VZA4JSNL.js?v=67557bf1:18966
batchedUpdates @ chunk-VZA4JSNL.js?v=67557bf1:3585
dispatchEventForPluginEventSystem @ chunk-VZA4JSNL.js?v=67557bf1:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-VZA4JSNL.js?v=67557bf1:5484
dispatchEvent @ chunk-VZA4JSNL.js?v=67557bf1:5478
dispatchDiscreteEvent @ chunk-VZA4JSNL.js?v=67557bf1:5455Understand this warning
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175880257
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 73 markets
App.tsx:379 🔥 Markets changed - count: 73 (loaded from Supabase)
App.tsx:1053 🔄 EXECUTING refreshMarketOddsWithAddress (attempt 3)...
App.tsx:184 🔄 Refreshing market odds for market_1759175796691_nlqgg40i1 using direct contract address: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:55 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0xD2092162aD3A392686A6B0e5dFC0d34c953c221D', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:73 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:75 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:77 ✅ EVM Service initialized with private key
hederaEVMService.ts:632 🔍 Getting market prices for contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:658 📞 Calling getCurrentPrice()...
hederaEVMService.ts:82 💰 Private key wallet balance: 872.67968992 HBAR
hederaEVMService.ts:661 📊 Raw prices from contract: {priceYesWei: '100000000000000000', priceNoWei: '900000000000000000'}
hederaEVMService.ts:696 ✅ Market prices calculated: {yesPrice: 0.1, noPrice: 0.9, yesOdds: 10, noOdds: 1.1111111111111112, yesProb: 0.1, …}
hederaEVMService.ts:770 🔍 Getting market volume for contract: 0x6694D2EE3b5869Ad5c6227808B5ff4dd958e07a2
hederaEVMService.ts:785 💰 Market volume: 5.6 CAST
App.tsx:193 📊 Fetched prices from blockchain: {yesOdds: 10, noOdds: 1.1111111111111112, yesProb: '10.0%', noProb: '90.0%', yesPrice: 0.1, …}
App.tsx:206 🔄 State update for market market_1759175796691_nlqgg40i1: {found: true, oldYesOdds: 10, newYesOdds: 10, oldNoOdds: 1.1111111111111112, newNoOdds: 1.1111111111111112, …}
App.tsx:234 ✅ Market odds updated for market_1759175796691_nlqgg40i1 using direct address: {yesOdds: '10.000', noOdds: '1.111', yesProb: '10.0%', noProb: '90.0%'}
App.tsx:255 ⚠️ Failed to save odds to Supabase: ReferenceError: supabase is not defined
    at refreshMarketOddsWithAddress (App.tsx:243:9)
refreshMarketOddsWithAddress @ App.tsx:255
await in refreshMarketOddsWithAddress
(anonymous) @ App.tsx:1054
setTimeout
(anonymous) @ App.tsx:1052
Promise.then
handlePlaceBet @ App.tsx:985
await in handlePlaceBet
handlePlaceBet @ BettingMarkets.tsx:219
handleEvent @ chunk-OOS6ENNK.js?v=67557bf1:15
callCallback2 @ chunk-VZA4JSNL.js?v=67557bf1:3680
invokeGuardedCallbackDev @ chunk-VZA4JSNL.js?v=67557bf1:3705
invokeGuardedCallback @ chunk-VZA4JSNL.js?v=67557bf1:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-VZA4JSNL.js?v=67557bf1:3742
executeDispatch @ chunk-VZA4JSNL.js?v=67557bf1:7046
processDispatchQueueItemsInOrder @ chunk-VZA4JSNL.js?v=67557bf1:7066
processDispatchQueue @ chunk-VZA4JSNL.js?v=67557bf1:7075
dispatchEventsForPlugins @ chunk-VZA4JSNL.js?v=67557bf1:7083
(anonymous) @ chunk-VZA4JSNL.js?v=67557bf1:7206
batchedUpdates$1 @ chunk-VZA4JSNL.js?v=67557bf1:18966
batchedUpdates @ chunk-VZA4JSNL.js?v=67557bf1:3585
dispatchEventForPluginEventSystem @ chunk-VZA4JSNL.js?v=67557bf1:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-VZA4JSNL.js?v=67557bf1:5484
dispatchEvent @ chunk-VZA4JSNL.js?v=67557bf1:5478
dispatchDiscreteEvent @ chunk-VZA4JSNL.js?v=67557bf1:5455Understand this warning
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1759175888887
App.tsx:1241 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1262 🎯 About to render main content
App.tsx:1267 🏪 Rendering unified markets with 73 markets
App.tsx:379 🔥 Markets changed - count: 73 (loaded from Supabase)