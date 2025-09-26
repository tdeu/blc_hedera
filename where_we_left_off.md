🔍 Checking 5 markets for status updates...
walletService.ts:125 🔄 Attempting to get balance (attempt 1/3)...
walletService.ts:127 ✅ Balance retrieved successfully
App.tsx:889 🏪 Market found for betting: {id: 'market_1758882504259_drkye0cnk', claim: 'Did King Charles and Donald Trump meet  Windsor Ca', contractAddress: '0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd'}
userDataService.ts:174 ✅ Bet recorded locally: {id: 'market_1758882504259_drkye0cnk-1758882878636', marketId: 'market_1758882504259_drkye0cnk', marketClaim: 'Did King Charles and Donald Trump meet  Windsor Castle grounds ?', position: 'no', amount: 2, …}
App.tsx:930 🔍 Hedera connection status: {isHederaConnected: true, walletConnected: true}
App.tsx:936 ✅ Using existing market contract address: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
App.tsx:958 📝 Proceeding with bet placement for market market_1758882504259_drkye0cnk. Contract: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
App.tsx:961 🚀 Placing bet on blockchain contract: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
useHedera.ts:227 🎯 placeBetWithAddress called with: {marketAddress: '0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd', position: 'no', amount: 2}
useHedera.ts:228 📊 HederaEVMService status: AVAILABLE
useHedera.ts:229 🔍 Market address validation: {isString: true, length: 42, startsWith0x: true, isValid: true}
useHedera.ts:247 🚀 Starting real bet placement with HederaEVMService...
hederaEVMService.ts:345 🎯 HederaEVMService.placeBet called: {marketAddress: '0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd', position: 'no', amount: 2}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758882878640
App.tsx:1168 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1189 🎯 About to render main content
App.tsx:1194 🏪 Rendering unified markets with 56 markets
App.tsx:362 🔥 UserProfile changed: exists
hederaEVMService.ts:373 🪙 Collateral token address: 0xC78Ac73844077917E20530E36ac935c4B56236c2
hederaEVMService.ts:379 📊 Shares to buy: 2.0
hederaEVMService.ts:386 💰 Cost for 2 NO shares: 1.25 tokens
hederaEVMService.ts:389 🔍 Checking balance for address: 0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD
hederaEVMService.ts:390 🔍 Collateral contract address: 0xC78Ac73844077917E20530E36ac935c4B56236c2
hederaEVMService.ts:403 💳 User CAST balance (attempt 1): 30.0 tokens
hederaEVMService.ts:404 💰 Required cost: 1.25 tokens
hederaEVMService.ts:407 ✅ Balance check result: SUFFICIENT
hederaEVMService.ts:442 ✅ Balance check passed - proceeding with bet...
hederaEVMService.ts:446 🔒 Current allowance: 115792089237316195423570985008687907853269984665640564039457.584007913129639935
hederaEVMService.ts:456 🎲 Placing NO bet...
hederaEVMService.ts:461 📤 Bet transaction sent: 0x1ba51401a7f62f1cd806d493414753c2d6fe6f0b3628f23b823a98413c355344
useHedera.ts:254 Position placed on blockchain: 0x1ba51401a7f62f1cd806d493414753c2d6fe6f0b3628f23b823a98413c355344
App.tsx:966 Bet recorded on Hedera blockchain: 0x1ba51401a7f62f1cd806d493414753c2d6fe6f0b3628f23b823a98413c355344
App.tsx:976 🎯 Refreshing market odds after bet placement for market: market_1758882504259_drkye0cnk
App.tsx:977 🔍 Stored contract address: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
App.tsx:978 🗂️ Current marketContracts state: {}
App.tsx:981 📍 Using stored contract address: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
App.tsx:982 ⏰ Setting 3-second timeout before calling refreshMarketOddsWithAddress...
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758882889572
App.tsx:1168 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1189 🎯 About to render main content
App.tsx:1194 🏪 Rendering unified markets with 56 markets
App.tsx:986 🚀 EXECUTING refreshMarketOddsWithAddress (attempt 1)...
App.tsx:183 🔄 Refreshing market odds for market_1758882504259_drkye0cnk using direct contract address: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
hederaEVMService.ts:55 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0x6A108622e5B0F2Db7f6118E71259F34937225809', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:73 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:75 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:77 ✅ EVM Service initialized with private key
hederaEVMService.ts:521 🔍 Getting market prices for contract: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
hederaEVMService.ts:547 📞 Calling getCurrentPrice()...
ethers.js?v=67557bf1:19090 JsonRpcProvider failed to detect network and cannot start up; retry in 1s (perhaps the URL is wrong or the node is not started)
hederaEVMService.ts:597 🔄 Returning default values due to error
App.tsx:191 📊 Fetched prices from blockchain: {yesOdds: 2, noOdds: 2, yesProb: '50.0%', noProb: '50.0%', yesPrice: 0.5, …}
App.tsx:203 🔄 State update for market market_1758882504259_drkye0cnk: {found: true, oldYesOdds: 2, newYesOdds: 2, oldNoOdds: 2, newNoOdds: 2, …}
App.tsx:230 ✅ Market odds updated for market_1758882504259_drkye0cnk using direct address: {yesOdds: '2.000', noOdds: '2.000', yesProb: '50.0%', noProb: '50.0%'}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758882893299
App.tsx:1168 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1189 🎯 About to render main content
App.tsx:1194 🏪 Rendering unified markets with 56 markets
App.tsx:358 🔥 Markets changed - count: 56 (loaded from Supabase)
hederaEVMService.ts:466 ✅ Bet transaction confirmed: 0x1ba51401a7f62f1cd806d493414753c2d6fe6f0b3628f23b823a98413c355344
App.tsx:991 🔄 EXECUTING refreshMarketOddsWithAddress (attempt 2)...
App.tsx:183 🔄 Refreshing market odds for market_1758882504259_drkye0cnk using direct contract address: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
hederaEVMService.ts:55 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0x6A108622e5B0F2Db7f6118E71259F34937225809', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:73 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:75 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:77 ✅ EVM Service initialized with private key
hederaEVMService.ts:521 🔍 Getting market prices for contract: 0x4B084720b67bBb9d379E95145E4dC2D6f3534cbd
hederaEVMService.ts:547 📞 Calling getCurrentPrice()...
hederaEVMService.ts:550 📊 Raw prices from contract: {priceYesWei: '250000000000000000', priceNoWei: '750000000000000000'}
hederaEVMService.ts:585 ✅ Market prices calculated: {yesPrice: 0.25, noPrice: 0.75, yesOdds: 4, noOdds: 1.3333333333333333, yesProb: 0.25, …}
App.tsx:191 📊 Fetched prices from blockchain: {yesOdds: 4, noOdds: 1.3333333333333333, yesProb: '25.0%', noProb: '75.0%', yesPrice: 0.25, …}
App.tsx:203 🔄 State update for market market_1758882504259_drkye0cnk: {found: true, oldYesOdds: 2, newYesOdds: 4, oldNoOdds: 2, newNoOdds: 1.3333333333333333, …}
App.tsx:230 ✅ Market odds updated for market_1758882504259_drkye0cnk using direct address: {yesOdds: '4.000', noOdds: '1.333', yesProb: '25.0%', noProb: '75.0%'}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758882896622
App.tsx:1168 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1189 🎯 About to render main content
App.tsx:1194 🏪 Rendering unified markets with 56 markets
App.tsx:358 🔥 Markets changed - count: 56 (loaded from Supabase)





above working,below not working: 


market created 

 DEBUG: selectedImage exists? false
CreateMarket.tsx:171 🔍 DEBUG: selectedImage details: null
CreateMarket.tsx:206 📤 Creating market with data: {claim: 'nouvnouvovoooooo', imageUrl: undefined, hasImage: false}
pendingMarketsService.ts:40 📝 Market submitted for approval: nouvnouvovoooooo
App.tsx:1074 🔗 Attempting to create market on Hedera... {isHederaConnected: true, hasHederaCreateMarket: true, marketId: 'market_1758898091082_hzrlank6s'}
App.tsx:1081 ⏳ Starting blockchain deployment for market: market_1758898091082_hzrlank6s
useHedera.ts:115 🏗️ createMarket called with: {hederaEVMService: true, isConnected: true, isLoading: false, marketClaim: 'nouvnouvovoooooo'}
useHedera.ts:148 🚀 Calling hederaEVMService.createMarket...
useHedera.ts:149 📋 Market details: {claim: 'nouvnouvovoooooo', description: 'nouvnouvovoooooo', expiresAt: Mon Sep 29 2025 11:01:00 GMT+0300 (heure normale d’Afrique de l’Est), category: 'Sports'}
hederaEVMService.ts:104 Creating market on Hedera EVM: {claim: 'nouvnouvovoooooo', expirationDate: Mon Sep 29 2025 11:01:00 GMT+0300 (heure normale d’Afrique de l’Est)}
hederaEVMService.ts:107 🔍 Testing connectivity...
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758898091101
App.tsx:1171 🎯 renderCurrentPage called, isLoading: false currentTab: create-market
App.tsx:1192 🎯 About to render main content
hederaEVMService.ts:109 ✅ Signer balance: 217.22702676 HBAR
hederaEVMService.ts:117 🏭 Factory contract initialized at: 0x6A108622e5B0F2Db7f6118E71259F34937225809
hederaEVMService.ts:118 📊 Proceeding with market creation
hederaEVMService.ts:126 ⏰ Market end time: 1758984491 vs current time: 1758898091
hederaEVMService.ts:127 ⏰ Market will expire in: 24 hours
hederaEVMService.ts:129 🚀 About to call factory.createMarket with params: {claim: 'nouvnouvovoooooo...', endTime: 1758984491, gasLimit: 15000000}
hederaEVMService.ts:140 ⏳ Waiting for transaction confirmation...
hederaEVMService.ts:141 🔍 About to wait for receipt...
hederaEVMService.ts:157 ✅ Transaction confirmed: 0x663b112eec7714676e51ebc662c2204fa0980c38f77a5b37de91f1703ddd6cf7
hederaEVMService.ts:158 📋 Receipt status: 1
hederaEVMService.ts:159 📋 Gas used: 12000000
hederaEVMService.ts:160 📋 Receipt logs count: 1
hederaEVMService.ts:224 🔍 Raw logs from receipt:
hederaEVMService.ts:226 Log 0: {address: '0x6A108622e5B0F2Db7f6118E71259F34937225809', topics: Array(2), data: '0x000000000000000000000000eb320186b2b554b0bf8c01b7…66f766f6f6f6f6f6f00000000000000000000000000000000'}
hederaEVMService.ts:235 🔍 Attempting to parse log from address: 0x6A108622e5B0F2Db7f6118E71259F34937225809
hederaEVMService.ts:236 🔍 Factory address: 0x6A108622e5B0F2Db7f6118E71259F34937225809
hederaEVMService.ts:237 🔍 Addresses match: true
hederaEVMService.ts:240 🔍 Parsed successfully: MarketCreated Proxy(_Result) {0: '0x4eb3acfda43708dbb4c257f61f7c6852779e5d6a9247d3cf5a3ac1fb432fcefc', 1: '0xeb320186b2B554B0bF8C01B75475584A8f11b362', 2: 'nouvnouvovoooooo'}
hederaEVMService.ts:241 🔍 Log topics: (2) ['0xc541e2497675ce714e07255730ed49d88f45ecf375056391d8238dcd463fbbb6', '0x4eb3acfda43708dbb4c257f61f7c6852779e5d6a9247d3cf5a3ac1fb432fcefc']
hederaEVMService.ts:242 🔍 Log data: 0x000000000000000000000000eb320186b2b554b0bf8c01b75475584a8f11b362000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000106e6f75766e6f75766f766f6f6f6f6f6f00000000000000000000000000000000
hederaEVMService.ts:246 ✅ MarketCreated event found!
hederaEVMService.ts:247 📍 Market address: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
hederaEVMService.ts:295 🎉 Market created successfully at address: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
useHedera.ts:163 ✅ Market created on Hedera EVM: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
useHedera.ts:164 📋 Market contract details: {contractId: '0xeb320186b2B554B0bF8C01B75475584A8f11b362', topicId: 'market-0xeb320186', createdAt: Fri Sep 26 2025 17:48:29 GMT+0300 (heure normale d’Afrique de l’Est), status: 'active'}
useHedera.ts:165 🔍 Contract ID validation: {isString: true, length: 42, startsWith0x: true, isMock: false, isValid: true}
App.tsx:1088 ✅ Market created on Hedera: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
App.tsx:1097 ✅ Contract address 0xeb320186b2B554B0bF8C01B75475584A8f11b362 stored with pending market market_1758898091082_hzrlank6s
App.tsx:1151 🔥 About to call recordMarketCreation with newMarket: {id: 'market_1758898091082_hzrlank6s', claim: 'nouvnouvovoooooo', category: 'Sports', source: 'bbc', description: 'nouvnouvovoooooo', …}
App.tsx:1152 🔥 newMarket.imageUrl specifically: undefined
userDataService.ts:190 🚨 RECORD MARKET CREATION CALLED! {walletAddress: '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', marketId: 'market_1758898091082_hzrlank6s', claim: 'nouvnouvovoooooo', transactionHash: 'pending-1758898109557', fullMarketData: {…}, …}
userDataService.ts:213 🔍 DEBUG: Recording market with imageUrl: undefined
userDataService.ts:214 ✅ Market creation recorded locally: {id: 'market_1758898091082_hzrlank6s', claim: 'nouvnouvovoooooo', createdAt: Fri Sep 26 2025 17:48:29 GMT+0300 (heure normale d’Afrique de l’Est), transactionHash: 'pending-1758898109557', submitterAddress: '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', …}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758898109558
App.tsx:1171 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1192 🎯 About to render main content
App.tsx:1197 🏪 Rendering unified markets with 57 markets
App.tsx:352 🔥 State changed - isLoad




Checking 3 markets for status updates...
walletService.ts:125 🔄 Attempting to get balance (attempt 1/3)...
walletService.ts:127 ✅ Balance retrieved successfully
App.tsx:892 🏪 Market found for betting: {id: 'market_1758898091082_hzrlank6s', claim: 'nouvnouvovoooooo', contractAddress: '0xeb320186b2B554B0bF8C01B75475584A8f11b362'}
userDataService.ts:174 ✅ Bet recorded locally: {id: 'market_1758898091082_hzrlank6s-1758898144974', marketId: 'market_1758898091082_hzrlank6s', marketClaim: 'nouvnouvovoooooo', position: 'no', amount: 10, …}
App.tsx:933 🔍 Hedera connection status: {isHederaConnected: true, walletConnected: true}
App.tsx:939 ✅ Using existing market contract address: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
App.tsx:961 📝 Proceeding with bet placement for market market_1758898091082_hzrlank6s. Contract: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
App.tsx:964 🚀 Placing bet on blockchain contract: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
useHedera.ts:227 🎯 placeBetWithAddress called with: {marketAddress: '0xeb320186b2B554B0bF8C01B75475584A8f11b362', position: 'no', amount: 10}
useHedera.ts:228 📊 HederaEVMService status: AVAILABLE
useHedera.ts:229 🔍 Market address validation: {isString: true, length: 42, startsWith0x: true, isValid: true}
useHedera.ts:247 🚀 Starting real bet placement with HederaEVMService...
hederaEVMService.ts:345 🎯 HederaEVMService.placeBet called: {marketAddress: '0xeb320186b2B554B0bF8C01B75475584A8f11b362', position: 'no', amount: 10}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758898144979
App.tsx:1171 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1192 🎯 About to render main content
App.tsx:1197 🏪 Rendering unified markets with 58 markets
App.tsx:365 🔥 UserProfile changed: exists
hederaEVMService.ts:373 🪙 Collateral token address: 0xC78Ac73844077917E20530E36ac935c4B56236c2
hederaEVMService.ts:379 📊 Shares to buy: 10.0
hederaEVMService.ts:386 💰 Cost for 10 NO shares: 7.08333333333333333 tokens
hederaEVMService.ts:389 🔍 Checking balance for address: 0x32B03e2fd3DcbFd1cb9C17fF4F9652579945aEAD
hederaEVMService.ts:390 🔍 Collateral contract address: 0xC78Ac73844077917E20530E36ac935c4B56236c2
hederaEVMService.ts:403 💳 User CAST balance (attempt 1): 48.75 tokens
hederaEVMService.ts:404 💰 Required cost: 7.08333333333333333 tokens
hederaEVMService.ts:407 ✅ Balance check result: SUFFICIENT
hederaEVMService.ts:442 ✅ Balance check passed - proceeding with bet...
hederaEVMService.ts:446 🔒 Current allowance: 0.0
hederaEVMService.ts:449 📝 Approving collateral...
hederaEVMService.ts:452 ✅ Collateral approved with unlimited allowance
hederaEVMService.ts:456 🎲 Placing NO bet...
marketStatusService.ts:77 🔍 Checking 3 markets for status updates...
hederaEVMService.ts:461 📤 Bet transaction sent: 0xf81db91d77d37ff82c1808598287a9303574162002f222875fcde919863d5ef4
useHedera.ts:254 Position placed on blockchain: 0xf81db91d77d37ff82c1808598287a9303574162002f222875fcde919863d5ef4
App.tsx:969 Bet recorded on Hedera blockchain: 0xf81db91d77d37ff82c1808598287a9303574162002f222875fcde919863d5ef4
App.tsx:979 🎯 Refreshing market odds after bet placement for market: market_1758898091082_hzrlank6s
App.tsx:980 🔍 Stored contract address: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
App.tsx:981 🗂️ Current marketContracts state: {}
App.tsx:984 📍 Using stored contract address: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
App.tsx:985 ⏰ Setting 3-second timeout before calling refreshMarketOddsWithAddress...
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758898175400
App.tsx:1171 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1192 🎯 About to render main content
App.tsx:1197 🏪 Rendering unified markets with 58 markets
App.tsx:989 🚀 EXECUTING refreshMarketOddsWithAddress (attempt 1)...
App.tsx:183 🔄 Refreshing market odds for market_1758898091082_hzrlank6s using direct contract address: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
hederaEVMService.ts:55 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0x6A108622e5B0F2Db7f6118E71259F34937225809', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:73 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:75 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:77 ✅ EVM Service initialized with private key
hederaEVMService.ts:521 🔍 Getting market prices for contract: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
hederaEVMService.ts:547 📞 Calling getCurrentPrice()...
hederaEVMService.ts:550 📊 Raw prices from contract: {priceYesWei: '500000000000000000', priceNoWei: '500000000000000000'}
App.tsx:994 🔄 EXECUTING refreshMarketOddsWithAddress (attempt 2)...
App.tsx:183 🔄 Refreshing market odds for market_1758898091082_hzrlank6s using direct contract address: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
hederaEVMService.ts:55 🔧 Initializing HederaEVMService with config: {rpcUrl: 'https://testnet.hashio.io/api', factoryAddress: '0x6A108622e5B0F2Db7f6118E71259F34937225809', useConnectedWallet: false, signerAddress: 'PRIVATE_KEY_PROVIDED'}
hederaEVMService.ts:73 🔍 Creating provider with RPC URL: https://testnet.hashio.io/api
hederaEVMService.ts:75 🔍 Creating wallet with private key length: 66
hederaEVMService.ts:77 ✅ EVM Service initialized with private key
hederaEVMService.ts:521 🔍 Getting market prices for contract: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
hederaEVMService.ts:547 📞 Calling getCurrentPrice()...
hederaEVMService.ts:550 📊 Raw prices from contract: {priceYesWei: '500000000000000000', priceNoWei: '500000000000000000'}
hederaEVMService.ts:585 ✅ Market prices calculated: {yesPrice: 0.5, noPrice: 0.5, yesOdds: 2, noOdds: 2, yesProb: 0.5, …}
hederaEVMService.ts:659 🔍 Getting market volume for contract: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
App.tsx:192 📊 Fetched prices from blockchain: {yesOdds: 2, noOdds: 2, yesProb: '50.0%', noProb: '50.0%', yesPrice: 0.5, …}
App.tsx:205 🔄 State update for market market_1758898091082_hzrlank6s: {found: true, oldYesOdds: 2, newYesOdds: 2, oldNoOdds: 2, newNoOdds: 2, …}
App.tsx:233 ✅ Market odds updated for market_1758898091082_hzrlank6s using direct address: {yesOdds: '2.000', noOdds: '2.000', yesProb: '50.0%', noProb: '50.0%'}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758898182131
App.tsx:1171 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1192 🎯 About to render main content
App.tsx:1197 🏪 Rendering unified markets with 58 markets
App.tsx:361 🔥 Markets changed - count: 58 (loaded from Supabase)
hederaEVMService.ts:585 ✅ Market prices calculated: {yesPrice: 0.5, noPrice: 0.5, yesOdds: 2, noOdds: 2, yesProb: 0.5, …}
hederaEVMService.ts:659 🔍 Getting market volume for contract: 0xeb320186b2B554B0bF8C01B75475584A8f11b362
App.tsx:192 📊 Fetched prices from blockchain: {yesOdds: 2, noOdds: 2, yesProb: '50.0%', noProb: '50.0%', yesPrice: 0.5, …}
App.tsx:205 🔄 State update for market market_1758898091082_hzrlank6s: {found: true, oldYesOdds: 2, newYesOdds: 2, oldNoOdds: 2, newNoOdds: 2, …}
App.tsx:233 ✅ Market odds updated for market_1758898091082_hzrlank6s using direct address: {yesOdds: '2.000', noOdds: '2.000', yesProb: '50.0%', noProb: '50.0%'}
App.tsx:98 🔥 APP COMPONENT RENDER - timestamp: 1758898183696
App.tsx:1171 🎯 renderCurrentPage called, isLoading: false currentTab: markets
App.tsx:1192 🎯 About to render main content
App.tsx:1197 🏪 Rendering unified markets with 58 markets
App.tsx:361 🔥 Markets changed - count: 58 (loaded from Supabase)