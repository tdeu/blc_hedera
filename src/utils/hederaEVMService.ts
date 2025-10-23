import { ethers } from 'ethers';
import { toast } from 'sonner';
import { TOKEN_ADDRESSES } from '../config/constants';

export interface MarketContract {
  contractId: string;
  topicId: string;
  createdAt: Date;
  status: 'active' | 'resolving' | 'resolved';
}

export interface HederaEVMConfig {
  rpcUrl: string;
  privateKey?: string; // Optional, can use connected wallet instead
  factoryAddress: string;
}

export class HederaEVMService {
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
  private signer: ethers.Wallet | ethers.JsonRpcSigner;
  private factoryAddress: string;
  private useConnectedWallet: boolean;
  private factoryContract: ethers.Contract;

  // ABI for the PredictionMarketFactory contract
  private factoryABI = [
    // Main functions
    "function createMarket(string question, uint256 endTime) external returns (bytes32)",
    "function markets(bytes32) external view returns (address)",
    "function getAllMarkets() external view returns (address[] memory)",
    
    // State variables (public getters)
    "function adminManager() external view returns (address)",
    "function treasury() external view returns (address)",
    "function castToken() external view returns (address)",
    "function betNFT() external view returns (address)",
    "function isFactoryPaused() external view returns (bool)",
    "function defaultProtocolFeeRate() external view returns (uint256)",
    
    // The actual event signature from your deployed contract
    // Based on the log having 2 topics, this is likely:
    "event MarketCreated(bytes32 indexed id, address market, string question)",
    
    // Or it might be (try this if the above doesn't work):
    // "event MarketCreated(address indexed market, bytes32 id, string question)",
    
    // Other events
    "event FactoryPaused(bool paused)",
    "event BetNFTUpdated(address newBetNFT)",
    "event AdminManagerUpdated(address newAdminManager)",
    "event DefaultProtocolFeeRateChanged(uint256 oldRate, uint256 newRate)"
  ];

  constructor(config: HederaEVMConfig, connectedWallet?: { provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner }) {
    console.log('🔧 Initializing HederaEVMService with config:', {
      rpcUrl: config.rpcUrl,
      factoryAddress: config.factoryAddress,
      useConnectedWallet: !!connectedWallet,
      signerAddress: config.privateKey ? 'PRIVATE_KEY_PROVIDED' : 'NO_PRIVATE_KEY'
    });
    
    this.factoryAddress = config.factoryAddress;
    this.useConnectedWallet = !!connectedWallet;

    try {
      if (connectedWallet) {
        // Use connected wallet (MetaMask)
        this.provider = connectedWallet.provider;
        this.signer = connectedWallet.signer;
        console.log('✅ EVM Service initialized with connected wallet');
      } else if (config.privateKey) {
        // Fallback to hardcoded private key for development
        console.log('🔍 Creating provider with RPC URL:', config.rpcUrl);

        // Create provider with explicit network config for Hedera testnet
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl, {
          name: 'hedera-testnet',
          chainId: 296  // Hedera testnet chainId
        });

        console.log('🔍 Creating wallet with private key length:', config.privateKey.length);
        this.signer = new ethers.Wallet(config.privateKey, this.provider);
        console.log('✅ EVM Service initialized with private key');

        // Verify network connection
        this.provider.getNetwork().then(network => {
          console.log('🌐 Connected to network:', {
            name: network.name,
            chainId: network.chainId
          });
        }).catch(err => {
          console.error('❌ Failed to get network info:', err);
        });

        // Check wallet balance
        this.signer.provider.getBalance(this.signer.address).then(balance => {
          const hbarBalance = parseFloat(ethers.formatEther(balance));
          console.log('💰 Private key wallet balance:', hbarBalance, 'HBAR');
          if (hbarBalance < 0.1) {
            console.warn('⚠️ Low HBAR balance - transactions may fail!');
          }
        }).catch(err => {
          console.error('❌ Failed to check wallet balance:', err);
        });
      } else {
        throw new Error('Either connected wallet or private key must be provided');
      }

      // Initialize factory contract
      this.factoryContract = new ethers.Contract(
        this.factoryAddress,
        this.factoryABI,
        this.signer
      );
    } catch (error) {
      console.error('❌ Error in HederaEVMService constructor:', error);
      throw error;
    }
  }

  /**
   * Creates a new prediction market using the deployed factory contract
   */
  async createMarket(
    claim: string,
    description: string,
    expirationDate: Date,
    category: string,
    marketId?: string
  ): Promise<MarketContract> {
    try {
      console.log('Creating market on Hedera EVM:', { claim, expirationDate });
      
      // Test connectivity
      console.log('🔍 Testing connectivity...');
      const balance = await this.provider.getBalance(this.signer.address);
      console.log('✅ Signer balance:', ethers.formatEther(balance), 'HBAR');
      
      const factory = new ethers.Contract(
        this.factoryAddress,
        this.factoryABI,
        this.signer
      );
      
      console.log('🏭 Factory contract initialized at:', this.factoryAddress);

      // Check if factory is paused before attempting creation
      try {
        const isFactoryPaused = await factory.isFactoryPaused();
        console.log('🔍 Factory paused status:', isFactoryPaused);
        if (isFactoryPaused) {
          throw new Error('Market factory is currently paused');
        }
      } catch (pauseError) {
        console.warn('⚠️ Could not check factory pause status:', pauseError.message);
      }

      console.log('📊 Proceeding with market creation');

      // Use proper time utilities to handle timezone issues AND blockchain clock drift
      const {
        dateToUnixTimestamp,
        getCurrentUnixTimestamp,
        debugTimeComparison,
        adjustDateForBlockchainDrift,
        BLOCKCHAIN_CLOCK_DRIFT_SECONDS
      } = await import('./timeUtils');

      console.log('📅 User selected expiration:', expirationDate.toISOString());
      debugTimeComparison(expirationDate, 'User Selected Time');

      // CRITICAL: Adjust for blockchain clock drift to improve UX
      // User selects the REAL time they want, we add drift behind the scenes
      const adjustedDate = adjustDateForBlockchainDrift(expirationDate);
      console.log('⚡ Adjusted for blockchain drift (+3 hours):', adjustedDate.toISOString());
      debugTimeComparison(adjustedDate, 'Blockchain Adjusted Time');

      const endTime = dateToUnixTimestamp(adjustedDate); // Use adjusted date for blockchain
      const currentTime = getCurrentUnixTimestamp();

      const diffSeconds = endTime - currentTime;
      const diffHours = diffSeconds / 3600;

      console.log('⏰ Final blockchain timestamps:');
      console.log(`   End time: ${endTime} (${adjustedDate.toISOString()})`);
      console.log(`   Current time: ${currentTime} (${new Date().toISOString()})`);
      console.log(`   Difference: ${diffSeconds} seconds (${diffHours.toFixed(2)} hours)`);
      console.log(`   🎯 Market will expire at USER'S time: ${expirationDate.toISOString()}`);
      console.log(`   🔧 But blockchain thinks it expires at: ${adjustedDate.toISOString()}`);

      if (endTime <= currentTime) {
        throw new Error(`Expiration date must be in the future. Current diff: ${diffSeconds} seconds`);
      }

      console.log(`✅ Time validation passed - market expires in ${diffHours.toFixed(2)} hours (blockchain time)`);

      
      console.log('🚀 About to call factory.createMarket with params:', {
        claim: claim.substring(0, 50) + '...',
        endTime,
        gasLimit: 15000000
      });

      // Estimate gas first
      let estimatedGas;
      try {
        console.log('⛽ Attempting gas estimation...');
        estimatedGas = await factory.createMarket.estimateGas(claim, endTime);
        console.log('⛽ Estimated gas:', estimatedGas.toString());
      } catch (gasError: any) {
        console.error('❌ Gas estimation failed!');
        console.error('Error details:', {
          message: gasError?.message,
          reason: gasError?.reason,
          code: gasError?.code,
          data: gasError?.data,
          error: gasError?.error
        });

        // If gas estimation fails, the transaction will likely revert
        // Check if it's a contract revert
        if (gasError?.reason) {
          throw new Error(`Contract will revert: ${gasError.reason}`);
        }
        if (gasError?.data) {
          console.error('Revert data:', gasError.data);
        }

        console.warn('⚠️ Using fallback gas limit: 15000000');
        console.warn('⚠️ WARNING: Transaction may fail on-chain!');
      }

      // Use 150% of estimated gas, or fallback to 15M
      const gasLimit = estimatedGas ? Math.floor(Number(estimatedGas) * 1.5) : 15000000;
      console.log('⛽ Using gas limit:', gasLimit);

      // Get current gas price from network
      let gasPrice;
      try {
        const feeData = await this.provider.getFeeData();
        gasPrice = feeData.gasPrice;
        console.log('⛽ Current network gas price:', gasPrice?.toString());
      } catch (gasPriceError) {
        console.warn('⚠️ Could not fetch gas price, using default');
      }

      // Proceed directly to createMarket call
      let tx;
      try {
        console.log('🔍 Calling factory.createMarket...');
        const txOptions: any = {
          gasLimit
        };

        // Add gas price if we got it from the network
        if (gasPrice) {
          txOptions.gasPrice = gasPrice;
        }

        tx = await factory.createMarket(claim, endTime, txOptions);
        console.log('✅ Transaction object created');
        console.log('🔍 Transaction hash:', tx.hash);
        console.log('🔍 Transaction details:', {
          from: tx.from,
          to: tx.to,
          gasLimit: tx.gasLimit?.toString(),
          nonce: tx.nonce,
          chainId: tx.chainId,
          data: tx.data ? tx.data.substring(0, 66) + '...' : 'no data'
        });

        // CRITICAL: Verify the transaction was actually broadcast
        console.log('🔍 Verifying transaction was broadcast to network...');
        try {
          const txFromNetwork = await this.provider.getTransaction(tx.hash);
          if (txFromNetwork) {
            console.log('✅ Transaction confirmed on network!');
            console.log('🔍 Network tx details:', {
              blockNumber: txFromNetwork.blockNumber,
              blockHash: txFromNetwork.blockHash,
              confirmations: txFromNetwork.confirmations
            });
          } else {
            console.warn('⚠️ Transaction not yet visible on network (might be in mempool)');
          }
        } catch (networkCheckError) {
          console.warn('⚠️ Could not verify transaction on network:', networkCheckError);
        }

      } catch (txError) {
        console.error('❌ Transaction failed to send:', txError);
        console.error('❌ Full error object:', JSON.stringify(txError, null, 2));

        // Check if it's a revert error
        if ((txError as any).reason) {
          throw new Error(`Contract reverted: ${(txError as any).reason}`);
        }
        if ((txError as any).message?.includes('insufficient funds')) {
          throw new Error('Insufficient HBAR balance to pay for gas');
        }
        if ((txError as any).code === 'NONCE_EXPIRED') {
          throw new Error('Transaction nonce expired. Please try again.');
        }
        if ((txError as any).code === 'REPLACEMENT_UNDERPRICED') {
          throw new Error('Gas price too low. Please try again with higher gas.');
        }
        throw txError;
      }

      console.log('⏳ Waiting for transaction confirmation...');
      console.log('🔍 About to wait for receipt...');

      let receipt;

      // First, try immediate lookup (sometimes tx is already mined)
      try {
        console.log('🔍 Attempting immediate receipt lookup...');
        const immediateReceipt = await this.provider.getTransactionReceipt(tx.hash);
        if (immediateReceipt && immediateReceipt.status !== null) {
          receipt = immediateReceipt;
          console.log('✅ Immediate receipt found! Status:', receipt.status);
        }
      } catch (immediateError) {
        console.log('📋 No immediate receipt, will wait...');
      }

      if (!receipt) {
        try {
          // Strategy: Race between tx.wait() and aggressive polling
          console.log('⏰ Starting dual-strategy receipt confirmation at:', new Date().toISOString());

          const receiptPromise = tx.wait();

          // Aggressive polling strategy - check every 2 seconds
          const pollingPromise = new Promise<any>(async (resolve, reject) => {
            const maxAttempts = 30; // 30 attempts × 2s = 60 seconds max
            for (let i = 0; i < maxAttempts; i++) {
              await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
              try {
                const polledReceipt = await this.provider.getTransactionReceipt(tx.hash);
                if (polledReceipt && polledReceipt.status !== null) {
                  console.log(`✅ Polling found receipt on attempt ${i + 1}`);
                  resolve(polledReceipt);
                  return;
                }
                console.log(`🔄 Polling attempt ${i + 1}/${maxAttempts}...`);
              } catch (pollError) {
                // Continue polling even on errors
              }
            }
            reject(new Error('Polling timed out after 60 seconds'));
          });

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              console.log('⏰ Final timeout triggered at:', new Date().toISOString());
              reject(new Error('Receipt timeout after 90 seconds'));
            }, 90000);
          });

          receipt = await Promise.race([receiptPromise, pollingPromise, timeoutPromise]);
          console.log('⏰ Receipt received at:', new Date().toISOString());

          if (receipt.status === 0) {
            throw new Error('Transaction failed on blockchain');
          }

          console.log('✅ Transaction confirmed:', receipt.hash);
          console.log('📋 Receipt status:', receipt.status);
          console.log('📋 Gas used:', receipt.gasUsed?.toString());
          console.log('📋 Receipt logs count:', receipt.logs?.length || 0);

        } catch (receiptError) {
          console.error('❌ Receipt confirmation error:', receiptError);
          console.error('Error details:', {
            message: receiptError instanceof Error ? receiptError.message : 'Unknown',
            txHash: tx.hash
          });

          // Try manual lookup with multiple attempts
          console.log('🔄 Attempting manual receipt lookup for tx:', tx.hash);

          for (let attempt = 1; attempt <= 8; attempt++) {
          try {
            const delay = Math.min(3000 * attempt, 15000); // Cap at 15 seconds
            console.log(`🔍 Manual lookup attempt ${attempt}/8 (waiting ${delay}ms)...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            const manualReceipt = await this.provider.getTransactionReceipt(tx.hash);
            console.log(`📋 Attempt ${attempt} receipt:`, manualReceipt ? 'Found' : 'Not found', manualReceipt?.status);

            if (manualReceipt && manualReceipt.status !== null) {
              receipt = manualReceipt;
              console.log('✅ Manual receipt obtained on attempt', attempt);
              console.log('📋 Manual receipt status:', receipt.status);

              // Add detailed debugging for failed transactions
              if (receipt.status === 0) {
                console.error('❌ TRANSACTION FAILED - DETAILED DEBUG:');
                console.error('Receipt:', receipt);
                
                let revertReason = 'Unknown reason';
                
                try {
                  // Try to get revert reason by calling the transaction again
                  const tx = await this.provider.getTransaction(receipt.hash);
                  console.error('Transaction data:', tx);
                  
                  // Try to simulate the failed call to get revert reason
                  const result = await this.provider.call({
                    to: tx.to,
                    data: tx.data,
                    from: tx.from,
                    gasLimit: tx.gasLimit,
                    gasPrice: tx.gasPrice,
                    value: tx.value
                  });
                  console.error('Call result:', result);
                } catch (simulationError) {
                  console.error('🎯 REVERT REASON:', simulationError.message);
                  revertReason = simulationError.message;
                }
                
                throw new Error('Transaction failed on blockchain: ' + revertReason);
              }
              break;
            }
          } catch (manualError) {
            console.log(`⚠️ Manual attempt ${attempt} failed:`, (manualError as Error).message);
          }
          }

          if (!receipt) {
            console.error('❌ Could not get receipt after multiple attempts');
            console.error('📋 Transaction hash:', tx.hash);
            console.error('🔗 Check transaction on HashScan:', `https://hashscan.io/testnet/transaction/${tx.hash}`);

            // Throw error with helpful info
            const error = new Error(
              `Transaction sent but confirmation timed out. ` +
              `Transaction hash: ${tx.hash}. ` +
              `Check status at: https://hashscan.io/testnet/transaction/${tx.hash}`
            );
            (error as any).txHash = tx.hash;
            throw error;
          }
        }
      }

      // Parse MarketCreated event
      let marketAddress: string | null = null;

      console.log('🔍 Raw logs from receipt:');
      receipt.logs?.forEach((log, index) => {
        console.log(`Log ${index}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        });
      });

      for (const log of receipt.logs) {
        try {
          console.log('🔍 Attempting to parse log from address:', log.address);
          console.log('🔍 Factory address:', this.factoryAddress);
          console.log('🔍 Addresses match:', log.address.toLowerCase() === this.factoryAddress.toLowerCase());
          
          const parsed = factory.interface.parseLog(log);
          console.log('🔍 Parsed successfully:', parsed?.name, parsed?.args);
          console.log('🔍 Log topics:', log.topics);
          console.log('🔍 Log data:', log.data);

          if (parsed?.name === "MarketCreated") {
            console.log('✅ MarketCreated event found via normal parsing!');
            console.log('📍 Parsed args:', parsed.args);
            console.log('📍 Args keys:', Object.keys(parsed.args));
            console.log('📍 Args[0] (id):', parsed.args[0]);
            console.log('📍 Args[1] (market):', parsed.args[1]);
            console.log('📍 Args[2] (question):', parsed.args[2]);

            // The market address should be args[1] based on the contract event
            marketAddress = parsed.args[1];
            console.log('📍 Market address extracted:', marketAddress);
            break;
          } else if (!parsed || !parsed.name) {
            // If parsing failed (returned undefined), throw error to trigger manual parsing
            throw new Error('Event parsing returned undefined');
          }
        } catch (parseError) {
          console.log('❌ Failed to parse log:', parseError.message);

          // Manual decoding attempt for MarketCreated event
          console.log('🔍 Manual decoding attempt...');

          // Check if this is the MarketCreated event by comparing event signature
          // MarketCreated(bytes32,address,string) signature
          const marketCreatedSignature = ethers.id('MarketCreated(bytes32,address,string)');

          if (log.topics && log.topics[0] === marketCreatedSignature) {
            console.log('✅ Confirmed MarketCreated event signature match');

            try {
              // Event: MarketCreated(bytes32 indexed id, address market, string question)
              // topics[0] = event signature
              // topics[1] = id (indexed)
              // data contains: address market (32 bytes padded) + string question (offset + length + data)

              console.log('🔍 Event signature match! Topics:', log.topics);
              console.log('🔍 Data:', log.data);

              // Decode the data part which contains: address market, string question
              const abiCoder = ethers.AbiCoder.defaultAbiCoder();
              const decoded = abiCoder.decode(['address', 'string'], log.data);

              const extractedAddress = decoded[0];
              const question = decoded[1];

              console.log('🎯 Manually decoded market address:', extractedAddress);
              console.log('🎯 Manually decoded question:', question);

              if (extractedAddress && extractedAddress !== '0x0000000000000000000000000000000000000000') {
                console.log('✅ Found valid market address via manual parsing!');
                marketAddress = extractedAddress; // Set the outer scope variable
                break;
              }
            } catch (extractError) {
              console.log('❌ Failed to manually extract address:', extractError.message);
            }
          }
        }
      }

      if (!marketAddress) {
        console.error('❌ Could not find MarketCreated event in transaction logs');
        console.error('📋 Available logs:', receipt.logs?.map((log, i) => ({
          index: i,
          address: log.address,
          topics: log.topics?.length || 0
        })));
        throw new Error("Could not extract market address from MarketCreated event");
      }

      console.log('🎉 Market created successfully at address:', marketAddress);

      // Auto-approve the market so users can start betting immediately
      let approvalTxHash: string | undefined;
      try {
        console.log('🎯 Auto-approving market to make it Open for betting...');
        approvalTxHash = await this.approveMarket(marketAddress);
        console.log('✅ Market auto-approved:', approvalTxHash);
      } catch (approvalError) {
        console.error('⚠️ Auto-approval failed, market will need manual approval:', approvalError);
        // Don't fail the entire creation, just log the error
      }

      // Persist to Supabase if available
      try {
        const supabaseUrl = (globalThis as any)?.import?.meta?.env?.VITE_SUPABASE_URL
          || (typeof window !== 'undefined' ? (window as any).VITE_SUPABASE_URL : undefined);
        const supabaseAnon = (globalThis as any)?.import?.meta?.env?.VITE_SUPABASE_ANON_KEY
          || (typeof window !== 'undefined' ? (window as any).VITE_SUPABASE_ANON_KEY : undefined);

        if (supabaseUrl && supabaseAnon) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseAnon);

          const updateData: any = {
            contract_address: marketAddress,
            status: approvalTxHash && approvalTxHash !== 'already_approved' ? 'open' : 'submitted'
          };

          if (marketId) {
            // Use market ID for unique identification (preferred)
            await supabase
              .from('approved_markets')
              .update(updateData)
              .eq('id', marketId);
            console.log('✅ Contract address persisted to Supabase using market ID:', marketAddress);
          } else {
            // Fallback to claim for backward compatibility
            await supabase
              .from('approved_markets')
              .update(updateData)
              .eq('claim', claim);
            console.log('✅ Contract address persisted to Supabase using claim:', marketAddress);
          }
        }
      } catch (persistErr) {
        console.warn('⚠️ Supabase persistence failed:', persistErr);
      }

      return {
        contractId: marketAddress,
        topicId: `market-${marketAddress.slice(0, 10)}`,
        createdAt: new Date(),
        status: approvalTxHash ? 'active' : 'submitted'
      };

    } catch (error: any) {
      console.error('❌ MARKET CREATION FAILED - DETAILED ERROR:');
      console.error('Full error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error reason:', error?.reason);
      
      // Re-throw the error - don't return mock data
      throw new Error(`Market creation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Places a bet on a market using the deployed PredictionMarket contract
   */
  async placeBet(
    marketAddress: string,
    position: 'yes' | 'no',
    amount: number
  ): Promise<{ txHash: string; nftTokenId: number | null }> {
    try {
      console.log('🎯 HederaEVMService.placeBet called:', { marketAddress, position, amount });

      // Validate market address
      if (!marketAddress || !marketAddress.startsWith('0x') || marketAddress.length !== 42) {
        throw new Error(`Invalid market address: ${marketAddress}`);
      }

      // NOTE: Bypassing market authorization check as per constants.ts comment
      // "FACTORY_CONTRACT: working without betNFT authorization"
      console.log('🔐 Skipping market authorization check (bypass enabled)');
      console.log('✅ Proceeding with bet without authorization check');

      // PredictionMarket contract ABI (from your Solidity code)
      const marketABI = [
        "function buyYes(uint256 shares) external",
        "function buyNo(uint256 shares) external", 
        "function getPriceYes(uint256 sharesToBuy) external view returns (uint256)",
        "function getPriceNo(uint256 sharesToBuy) external view returns (uint256)",
        "function collateral() external view returns (address)",
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)"
      ];

      // ERC20 ABI for approvals
      const erc20ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function balanceOf(address account) external view returns (uint256)"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.signer);
      
      // Get the collateral token address from the market contract
      const collateralAddress = await market.collateral();
      console.log('🪙 Collateral token address:', collateralAddress);
      
      const collateral = new ethers.Contract(collateralAddress, erc20ABI, this.signer);

      // Convert amount to shares (1:1 ratio for simplicity)
      const shares = ethers.parseEther(amount.toString());
      console.log('📊 Shares to buy:', ethers.formatEther(shares));
      
      // Get the cost for these shares
      const cost = position === 'yes' 
        ? await market.getPriceYes(shares)
        : await market.getPriceNo(shares);
      
      console.log(`💰 Cost for ${amount} ${position.toUpperCase()} shares: ${ethers.formatEther(cost)} tokens`);

      // IMPROVED: Check real balance and handle insufficient balance
      console.log('🔍 Checking balance for address:', this.signer.address);
      console.log('🔍 Collateral contract address:', collateralAddress);

      let userBalance: bigint;
      let hasBalance = false;
      let balanceCheckAttempts = 0;
      const maxBalanceCheckAttempts = 3;

      // Retry balance check to handle potential race conditions
      while (!hasBalance && balanceCheckAttempts < maxBalanceCheckAttempts) {
        try {
          balanceCheckAttempts++;
          userBalance = await collateral.balanceOf(this.signer.address);
          const balanceFormatted = ethers.formatEther(userBalance);
          console.log(`💳 User CAST balance (attempt ${balanceCheckAttempts}):`, balanceFormatted, 'tokens');
          console.log('💰 Required cost:', ethers.formatEther(cost), 'tokens');

          hasBalance = userBalance >= cost;
          console.log('✅ Balance check result:', hasBalance ? 'SUFFICIENT' : 'INSUFFICIENT');

          if (!hasBalance && balanceCheckAttempts < maxBalanceCheckAttempts) {
            console.log('⏳ Retrying balance check in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (balanceError) {
          console.error(`❌ Failed to check balance (attempt ${balanceCheckAttempts}):`, balanceError);
          userBalance = BigInt(0);
          hasBalance = false;

          if (balanceCheckAttempts < maxBalanceCheckAttempts) {
            console.log('⏳ Retrying balance check in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // If insufficient balance, attempt to mint tokens for testing
      if (!hasBalance) {
        console.log('⚠️ Insufficient CAST balance - attempting to mint tokens for testing...');

        // Since BuyCAST contract is now deployed, direct users to buy CAST instead of trying to mint
        console.log('⚠️ Insufficient CAST balance - user needs to buy CAST tokens');
        const requiredAmount = parseFloat(ethers.formatEther(cost));
        const requiredHBAR = Math.ceil(requiredAmount); // 1:1 exchange rate

        throw new Error(`Insufficient CAST balance. You have ${ethers.formatEther(userBalance || BigInt(0))} CAST but need ${ethers.formatEther(cost)} CAST. Please buy ${requiredHBAR} HBAR worth of CAST tokens using the "Buy CAST" button.`);
      }

      if (!hasBalance) {
        throw new Error(`Insufficient CAST balance. You have ${ethers.formatEther(userBalance || 0)} CAST but need ${ethers.formatEther(cost)} CAST. Please buy CAST tokens using the "Buy CAST" button.`);
      }

      console.log('✅ Balance check passed - proceeding with bet...');

      // Check and approve collateral if needed
      const currentAllowance = await collateral.allowance(this.signer.address, marketAddress);
      console.log('🔒 Current allowance:', ethers.formatEther(currentAllowance));
      
      if (currentAllowance < cost) {
        console.log('📝 Approving collateral...');
        const approveTx = await collateral.approve(marketAddress, ethers.MaxUint256, { gasLimit: 200000 });
        await approveTx.wait();
        console.log('✅ Collateral approved with unlimited allowance');
      }

      // Place the bet with proper gas estimation
      console.log(`🎲 Placing ${position.toUpperCase()} bet...`);

      let tx: any;
      try {
        // Estimate gas first
        const gasEstimate = position === 'yes'
          ? await market.buyYes.estimateGas(shares)
          : await market.buyNo.estimateGas(shares);

        console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
        console.log(`⛽ Using gas limit: ${gasLimit.toString()}`);

        tx = position === 'yes'
          ? await market.buyYes(shares, { gasLimit })
          : await market.buyNo(shares, { gasLimit });

        console.log('📤 Bet transaction sent:', tx.hash);

      } catch (gasError: any) {
        console.error('❌ Gas estimation failed:', gasError);

        // Extract revert reason if available
        let revertReason = 'Unknown error';
        if (gasError.reason) {
          revertReason = gasError.reason;
        } else if (gasError.message) {
          // Try to extract revert reason from error message
          const reasonMatch = gasError.message.match(/reason="([^"]+)"/);
          if (reasonMatch) {
            revertReason = reasonMatch[1];
          } else {
            revertReason = gasError.message;
          }
        }

        console.error('🚨 Revert reason:', revertReason);
        throw new Error(`Transaction would fail: ${revertReason}`);
      }

      // Wait for transaction confirmation with proper error handling
      console.log('⏳ Waiting for transaction confirmation...');

      try {
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Transaction confirmation timeout after 60s')), 60000)
          )
        ]);

        console.log('✅ Transaction confirmed:', receipt.hash);
        console.log('📊 Gas used:', receipt.gasUsed?.toString());

        // Check if transaction was successful
        if (receipt.status === 0) {
          console.error('❌ Transaction failed during execution');
          throw new Error('Transaction was mined but failed during execution');
        }

        // Parse BetNFTMinted event to get NFT token ID
        let nftTokenId: number | null = null;

        try {
          console.log('🔍 Parsing receipt logs for BetNFTMinted event...');

          const betNFTAddress = TOKEN_ADDRESSES.BET_NFT_CONTRACT;
          if (betNFTAddress && betNFTAddress !== '0x0000000000000000000000000000000000000000') {
            const betNFTABI = [
              "event BetNFTMinted(uint256 indexed tokenId, address indexed market, address indexed owner, uint256 shares, bool isYes)"
            ];

            const betNFTInterface = new ethers.Interface(betNFTABI);

            // Look for BetNFTMinted event in receipt logs
            for (const log of receipt.logs) {
              // Check if log is from BetNFT contract
              if (log.address.toLowerCase() === betNFTAddress.toLowerCase()) {
                try {
                  const parsedLog = betNFTInterface.parseLog({
                    topics: log.topics as string[],
                    data: log.data
                  });

                  if (parsedLog && parsedLog.name === 'BetNFTMinted') {
                    nftTokenId = Number(parsedLog.args.tokenId);
                    console.log('✅ NFT Token ID extracted from event:', nftTokenId);
                    break;
                  }
                } catch (parseError) {
                  // This log might not be a BetNFTMinted event, continue
                  continue;
                }
              }
            }

            if (nftTokenId === null) {
              console.warn('⚠️ Could not find BetNFTMinted event in transaction receipt');
            }
          } else {
            console.warn('⚠️ BetNFT contract address not configured, cannot extract NFT token ID');
          }
        } catch (eventParseError) {
          console.error('❌ Error parsing BetNFTMinted event:', eventParseError);
          // Continue without NFT token ID
        }

        return {
          txHash: tx.hash,
          nftTokenId
        };

      } catch (confirmError: any) {
        console.error('❌ Transaction confirmation failed:', confirmError);

        // If it's a timeout, the transaction might still be pending
        if (confirmError.message.includes('timeout')) {
          console.warn('⚠️ Transaction confirmation timed out but may still succeed');
          console.warn('🔍 Check transaction status manually:', tx.hash);
          throw new Error(`Transaction sent but confirmation timed out. Hash: ${tx.hash}. Please check manually.`);
        }

        throw new Error(`Transaction failed: ${confirmError.message}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to place bet on Hedera EVM:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        reason: error?.reason
      });
      throw new Error(`Failed to place bet: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get market contract address from factory using market ID
   */
  async getMarketAddressFromFactory(marketId: string): Promise<string | null> {
    try {
      if (!this.factoryContract) {
        console.warn('⚠️ Factory contract not initialized');
        return null;
      }

      // Convert market ID to bytes32 format
      const marketIdBytes32 = ethers.encodeBytes32String(marketId);
      console.log(`🔍 Querying factory for market ID: ${marketId} (${marketIdBytes32})`);

      // Query the markets mapping
      const marketAddress = await this.factoryContract.markets(marketIdBytes32);

      if (marketAddress && marketAddress !== '0x0000000000000000000000000000000000000000') {
        console.log(`✅ Found market address: ${marketAddress} for ID: ${marketId}`);
        return marketAddress;
      } else {
        console.warn(`❌ No market found for ID: ${marketId}`);
        return null;
      }
    } catch (error) {
      console.error('Error querying factory for market address:', error);
      return null;
    }
  }

  async getMarketPrices(marketAddress: string): Promise<{
    yesPrice: number;
    noPrice: number;
    yesOdds: number;
    noOdds: number;
    yesProb: number;
    noProb: number;
  }> {
    console.log('🔍 Getting market prices for contract:', marketAddress);

    // Validate market address
    if (!marketAddress || !marketAddress.startsWith('0x') || marketAddress.length !== 42) {
      console.warn('⚠️ Invalid market address, returning default values:', marketAddress);
      return {
        yesPrice: 0.5,
        noPrice: 0.5,
        yesOdds: 2.0,
        noOdds: 2.0,
        yesProb: 0.5,
        noProb: 0.5
      };
    }

    try {
      const marketABI = [
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
        "function getProbabilities() external view returns (uint256 probYes, uint256 probNo)",
        "function yesShares() external view returns (uint256)",
        "function noShares() external view returns (uint256)"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.provider);

      // Get current prices from the contract
      console.log('📞 Calling getCurrentPrice()...');
      const [priceYesWei, priceNoWei] = await market.getCurrentPrice();
      
      console.log('📊 Raw prices from contract:', {
        priceYesWei: priceYesWei.toString(),
        priceNoWei: priceNoWei.toString()
      });

      // Convert from wei to decimal (0.0 to 1.0)
      const yesPrice = parseFloat(ethers.formatEther(priceYesWei));
      const noPrice = parseFloat(ethers.formatEther(priceNoWei));

      // Get probabilities (should be percentage 0-100)
      let yesProb, noProb;
      try {
        const [probYes, probNo] = await market.getProbabilities();
        yesProb = parseInt(probYes.toString()) / 100; // Convert from 0-100 to 0.0-1.0
        noProb = parseInt(probNo.toString()) / 100;
      } catch (probError) {
        // Fallback: use prices as probabilities
        console.log('📊 Using prices as probabilities (getProbabilities not available)');
        yesProb = yesPrice;
        noProb = noPrice;
      }

      // Calculate odds (odds = 1 / probability)
      const yesOdds = yesProb > 0 ? 1 / yesProb : 2.0;
      const noOdds = noProb > 0 ? 1 / noProb : 2.0;

      const result = {
        yesPrice,
        noPrice,
        yesOdds,
        noOdds,
        yesProb,
        noProb
      };

      console.log('✅ Market prices calculated:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Error getting market prices:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        reason: error?.reason
      });

      // Return default values instead of throwing
      console.log('🔄 Returning default values due to error');
      return {
        yesPrice: 0.5,
        noPrice: 0.5,
        yesOdds: 2.0,
        noOdds: 2.0,
        yesProb: 0.5,
        noProb: 0.5
      };
    }
  }

  /**
   * Gets the balance of the signer account
   */
  async getBalance(): Promise<string> {
    try {
      const address = await this.getAddress();
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  /**
   * Gets the signer address
   */
  async getAddress(): Promise<string> {
    if (this.useConnectedWallet && 'getAddress' in this.signer) {
      return await this.signer.getAddress();
    }
    return (this.signer as ethers.Wallet).address;
  }

  /**
   * Gets CastToken balance for the user
   */
  async getCastTokenBalance(): Promise<string> {
    try {
      const castTokenAddress = TOKEN_ADDRESSES.CAST_TOKEN;
      const erc20ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)"
      ];

      const castToken = new ethers.Contract(castTokenAddress, erc20ABI, this.provider);
      const address = await this.getAddress();
      const balance = await castToken.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get CastToken balance:', error);
      return '0';
    }
  }

  /**
   * Gets the total volume (reserve) for a market
   */
  async getMarketVolume(marketAddress: string): Promise<number> {
    try {
      console.log('🔍 Getting market volume for contract:', marketAddress);

      // Use PredictionMarket contract ABI
      const predictionMarketABI = [
        "function reserve() external view returns (uint256)",
        "function getCurrentPrice() external view returns (uint256 priceYes, uint256 priceNo)",
        "function yesShares() external view returns (uint256)",
        "function noShares() external view returns (uint256)"
      ];
      const market = new ethers.Contract(marketAddress, predictionMarketABI, this.provider);

      // Get reserve (total volume)
      const reserve = await market.reserve();
      const volumeInCAST = parseFloat(ethers.formatEther(reserve));

      console.log('💰 Market volume:', volumeInCAST, 'CAST');
      return volumeInCAST;

    } catch (error: any) {
      console.error('❌ Error getting market volume:', error);
      return 0;
    }
  }

  /**
   * Mint CastTokens for testing (if user is authorized)
   */
  async mintCastTokensForTesting(amount: number): Promise<string> {
    try {
      const castTokenAddress = TOKEN_ADDRESSES.CAST_TOKEN;
      const castTokenABI = [
        "function mint(address to, uint256 amount) external"
      ];

      const castToken = new ethers.Contract(castTokenAddress, castTokenABI, this.signer);
      const address = await this.getAddress();
      const tx = await castToken.mint(address, ethers.parseEther(amount.toString()));
      await tx.wait();
      
      console.log(`Minted ${amount} CAST tokens for testing`);
      return tx.hash;
    } catch (error: any) {
      console.warn('Failed to mint CastTokens (not authorized):', error);
      throw new Error('WALLET_NOT_AUTHORIZED_FOR_MINTING');
    }
  }

  /**
   * Check if a market is authorized in the BetNFT contract
   */
  async isMarketAuthorized(marketAddress: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if market is authorized:', marketAddress);

      const betNFTAddress = TOKEN_ADDRESSES.BET_NFT_CONTRACT;
      if (!betNFTAddress || betNFTAddress === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ BetNFT contract address not configured');
        return false;
      }

      const betNFTABI = [
        "function authorizedMarkets(address) external view returns (bool)"
      ];

      const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, this.provider);
      const isAuthorized = await betNFT.authorizedMarkets(marketAddress);

      console.log(`🔐 Market ${marketAddress} authorization status:`, isAuthorized);
      return isAuthorized;

    } catch (error: any) {
      console.error('❌ Error checking market authorization:', error);
      return false;
    }
  }

  /**
   * Authorize a market in the BetNFT contract (admin only)
   */
  async authorizeMarket(marketAddress: string): Promise<string> {
    try {
      console.log('🔐 Authorizing market:', marketAddress);

      const betNFTAddress = TOKEN_ADDRESSES.BET_NFT_CONTRACT;
      if (!betNFTAddress || betNFTAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('BetNFT contract address not configured');
      }

      const betNFTABI = [
        "function authorizeMarket(address market) external",
        "function owner() external view returns (address)"
      ];

      const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, this.signer);

      // Check if current signer is the owner
      const owner = await betNFT.owner();
      const signerAddress = await this.getAddress();

      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        console.warn(`⚠️ Current signer ${signerAddress} is not the BetNFT owner ${owner}`);
        throw new Error('Only the BetNFT contract owner can authorize markets');
      }

      const tx = await betNFT.authorizeMarket(marketAddress, {
        gasLimit: 100000
      });

      console.log('📤 Authorization transaction sent:', tx.hash);
      await tx.wait();

      console.log('✅ Market authorized successfully');
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Error authorizing market:', error);
      throw new Error(`Failed to authorize market: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Approve a market (change status from Submited to Open)
   * This must be called after market creation for users to be able to bet
   */
  async approveMarket(marketAddress: string): Promise<string> {
    try {
      console.log('📋 Approving market:', marketAddress);

      const marketABI = [
        "function approveMarket() external",
        "function marketInfo() external view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.signer);

      // Check current status
      const info = await market.marketInfo();
      console.log('📊 Current market status:', info.status); // 0=Submited, 1=Open

      if (info.status === 1) {
        console.log('✅ Market already approved');
        return 'already_approved';
      }

      // Approve the market
      const tx = await market.approveMarket({
        gasLimit: 200000
      });

      console.log('📤 Approval transaction sent:', tx.hash);
      await tx.wait();

      console.log('✅ Market approved successfully');
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Error approving market:', error);
      throw new Error(`Failed to approve market: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Preliminary resolve a market (sets outcome but starts 7-day dispute period)
   * Market status changes to PendingResolution
   */
  async preliminaryResolve(marketAddress: string, outcome: 'yes' | 'no'): Promise<string> {
    try {
      console.log(`🔍 Preliminary resolving market ${marketAddress} to ${outcome.toUpperCase()}`);

      const marketABI = [
        "function preliminaryResolve(uint8 outcome) external"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.signer);

      // Convert outcome to contract format (1=Yes, 2=No)
      const outcomeValue = outcome === 'yes' ? 1 : 2;

      const tx = await market.preliminaryResolve(outcomeValue, {
        gasLimit: 300000
      });

      console.log('📤 Preliminary resolution transaction sent:', tx.hash);
      await tx.wait();

      console.log('✅ Market preliminarily resolved, dispute period started');
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Error in preliminary resolution:', error);
      throw new Error(`Failed to preliminary resolve market: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Final resolve a market (after dispute period, executes payouts)
   * Market status changes to Resolved
   */
  async finalResolve(marketAddress: string, outcome: 'yes' | 'no', confidence: number): Promise<string> {
    try {
      console.log(`✅ Final resolving market ${marketAddress} to ${outcome.toUpperCase()} with ${confidence}% confidence`);

      const marketABI = [
        "function finalResolve(uint8 outcome, uint256 confidenceScore) external"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.signer);

      // Convert outcome to contract format (1=Yes, 2=No)
      const outcomeValue = outcome === 'yes' ? 1 : 2;

      // Confidence should be 0-100
      const confidenceScore = Math.min(100, Math.max(0, confidence));

      const tx = await market.finalResolve(outcomeValue, confidenceScore, {
        gasLimit: 500000
      });

      console.log('📤 Final resolution transaction sent:', tx.hash);
      await tx.wait();

      console.log('✅ Market finally resolved, payouts available');
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Error in final resolution:', error);
      throw new Error(`Failed to final resolve market: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Refund all bets (for markets that never reached confidence threshold)
   * Can only be called when market is in PendingResolution or Open status
   */
  async refundAllBets(marketAddress: string): Promise<string> {
    try {
      console.log(`💸 Refunding all bets for market ${marketAddress}`);

      const marketABI = [
        "function refundAllBets() external"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.signer);

      const tx = await market.refundAllBets({
        gasLimit: 300000
      });

      console.log('📤 Refund transaction sent:', tx.hash);
      await tx.wait();

      console.log('✅ Market refunded, users can now claim their refunds');
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Error refunding market:', error);
      throw new Error(`Failed to refund market: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get market resolution info
   */
  async getMarketResolutionInfo(marketAddress: string): Promise<{
    status: number;
    isPendingResolution: boolean;
    preliminaryOutcome: number;
    resolvedOutcome: number;
    confidenceScore: number;
  }> {
    try {
      const marketABI = [
        "function marketInfo() external view returns (tuple(bytes32 id, string question, address creator, uint256 endTime, uint8 status))",
        "function isPendingResolution() external view returns (bool)",
        "function getPreliminaryOutcome() external view returns (uint8)",
        "function resolvedOutcome() external view returns (uint8)",
        "function getConfidenceScore() external view returns (uint256)"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.provider);

      const [info, isPending, prelimOutcome, resolvedOut, confidence] = await Promise.all([
        market.marketInfo(),
        market.isPendingResolution(),
        market.getPreliminaryOutcome().catch(() => 0),
        market.resolvedOutcome().catch(() => 0),
        market.getConfidenceScore().catch(() => 0)
      ]);

      return {
        status: info.status,
        isPendingResolution: isPending,
        preliminaryOutcome: prelimOutcome,
        resolvedOutcome: resolvedOut,
        confidenceScore: Number(confidence)
      };

    } catch (error: any) {
      console.error('❌ Error getting resolution info:', error);
      throw new Error(`Failed to get resolution info: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Check transaction status and receipt
   */
  async checkTransactionStatus(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      return {
        tx,
        receipt,
        found: !!tx,
        confirmed: !!receipt,
        status: receipt?.status,
        gasUsed: receipt?.gasUsed?.toString(),
        logsCount: receipt?.logs?.length || 0
      };
    } catch (error) {
      console.error('❌ Failed to check transaction status:', error);
      return null;
    }
  }

  /**
   * Buy CAST with HBAR - Automatically uses real contract if available, falls back to mock
   * Uses 1:1 ratio which matches the real contract ratio
   */
  async buyCastWithHbar(hbarAmount: number): Promise<string> {
    // First, try the real BuyCAST contract if it's deployed
    const buyCastAddress = TOKEN_ADDRESSES.BUYCAST_CONTRACT;

    if (buyCastAddress && buyCastAddress !== '0x0000000000000000000000000000000000000000') {
      console.log(`🏭 Using REAL BuyCAST contract at ${buyCastAddress}`);
      try {
        return await this.buyCastWithHbarReal(hbarAmount);
      } catch (error: any) {
        console.error('❌ Real BuyCAST contract failed, falling back to mock:', error.message);
        // Don't fall back - if real contract exists, we should use it or fail
        throw error;
      }
    }

    // Fallback to mock implementation (for development/testing when contract not deployed)
    console.log(`🏭 Using MOCK implementation (BuyCAST contract not deployed)`);
    try {
      console.log(`💱 Mock buying ${hbarAmount} HBAR worth of CAST tokens (1:1 ratio)`);

      // Check HBAR balance first
      const hbarBalance = await this.getBalance();
      const balanceNum = parseFloat(hbarBalance);

      if (balanceNum < hbarAmount) {
        throw new Error(`Insufficient HBAR balance. You have ${hbarBalance} HBAR but trying to spend ${hbarAmount} HBAR`);
      }

      // For testing, use 1:1 ratio (1 HBAR = 1 CAST)
      const castAmount = hbarAmount;
      console.log(`💱 Converting ${hbarAmount} HBAR to ${castAmount} CAST tokens (1:1 test ratio)`);

      // Use the existing minting function for testing
      const txHash = await this.mintCastTokensForTesting(castAmount);

      console.log(`✅ Successfully mocked CAST purchase: ${castAmount} CAST tokens`);
      return txHash;

    } catch (error: any) {
      console.error('❌ Failed to buy CAST with HBAR (mock):', error);

      // Provide helpful error messages based on error type
      if (error.message.includes('Insufficient HBAR')) {
        throw error; // Pass through balance errors
      } else if (error.message.includes('WALLET_NOT_AUTHORIZED_FOR_MINTING') ||
                 error.message.includes('not authorized') ||
                 error.message.includes('Ownable')) {
        throw new Error('not authorized to mint tokens for testing');
      } else {
        throw new Error(`Failed to buy CAST tokens: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Real BuyCAST implementation (to be used when contract is deployed)
   * Uses the same 1:1 HBAR to CAST ratio
   */
  async buyCastWithHbarReal(hbarAmount: number): Promise<string> {
    try {
      console.log(`🏭 Buying ${hbarAmount} HBAR worth of CAST tokens via BuyCAST contract`);

      // Check if BuyCAST contract is deployed
      const buyCastAddress = TOKEN_ADDRESSES.BUYCAST_CONTRACT;
      if (!buyCastAddress || buyCastAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('BuyCAST contract not deployed yet - using mock implementation');
      }

      const buyCastABI = [
        "function buyCAST() external payable", // Use the simpler version
        "function getExchangeRate() external view returns (uint256)" // Returns CAST tokens per HBAR
      ];

      const buyCast = new ethers.Contract(buyCastAddress, buyCastABI, this.signer);

      // Get current exchange rate (should be 1:1 based on tokenomics)
      let exchangeRate: bigint;
      try {
        exchangeRate = await buyCast.getExchangeRate();
        console.log('📊 Current exchange rate:', ethers.formatEther(exchangeRate), 'CAST per HBAR');
      } catch (error) {
        console.warn('Could not fetch exchange rate, assuming 1:1 ratio');
        exchangeRate = ethers.parseEther('1'); // 1:1 fallback
      }

      // Convert HBAR to wei (HBAR uses 18 decimals on EVM)
      const amountInWei = ethers.parseEther(hbarAmount.toString());

      // Check HBAR balance
      const hbarBalance = await this.getBalance();
      if (parseFloat(hbarBalance) < hbarAmount) {
        throw new Error(`Insufficient HBAR balance. You have ${hbarBalance} HBAR but trying to spend ${hbarAmount} HBAR`);
      }

      console.log(`💰 Purchasing with ${hbarAmount} HBAR (${ethers.formatEther(amountInWei)} ETH equivalent)`);

      // Use the simpler buyCAST() function that just uses msg.value
      const tx = await buyCast.buyCAST({
        value: amountInWei, // Send HBAR as payment
        gasLimit: 200000
      });

      console.log('📤 BuyCAST transaction sent:', tx.hash);
      await tx.wait();

      console.log(`✅ Successfully bought CAST tokens with ${hbarAmount} HBAR via BuyCAST contract`);
      return tx.hash;

    } catch (error: any) {
      console.error('❌ Failed to buy CAST with HBAR (real):', error);

      if (error.message.includes('BuyCAST contract not deployed')) {
        // Fall back to mock implementation
        console.log('🔄 Falling back to mock implementation...');
        return await this.buyCastWithHbar(hbarAmount);
      }

      throw new Error(`Failed to buy CAST tokens: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Fetch all bets (BetNFTMinted events) for a specific market
   */
  async getMarketBetHistory(marketAddress: string): Promise<any[]> {
    try {
      console.log('📊 Fetching bet history for market:', marketAddress);

      const betNFTAddress = TOKEN_ADDRESSES.BET_NFT_CONTRACT;
      if (!betNFTAddress || betNFTAddress === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ BetNFT contract address not configured');
        return [];
      }

      const betNFTABI = [
        "event BetNFTMinted(uint256 indexed tokenId, address indexed market, address indexed owner, uint256 shares, bool isYes)",
        "function betMetadata(uint256) external view returns (address market, uint256 shares, bool isYes, uint256 timestamp)"
      ];

      const betNFT = new ethers.Contract(betNFTAddress, betNFTABI, this.provider);

      // Query for BetNFTMinted events filtered by this market
      // We use the 'market' parameter which is the 2nd indexed parameter
      const filter = betNFT.filters.BetNFTMinted(null, marketAddress, null);

      // Get events from the last 100,000 blocks (adjust as needed)
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100000);

      console.log(`🔍 Querying BetNFTMinted events from block ${fromBlock} to ${currentBlock}`);
      const events = await betNFT.queryFilter(filter, fromBlock, currentBlock);

      console.log(`📊 Found ${events.length} bet events for market ${marketAddress}`);

      // Transform events into bet objects
      const bets = await Promise.all(events.map(async (event: any) => {
        const tokenId = event.args.tokenId;
        const owner = event.args.owner;
        const shares = event.args.shares;
        const isYes = event.args.isYes;

        // Get block to extract timestamp
        const block = await event.getBlock();
        const timestamp = block.timestamp * 1000; // Convert to milliseconds

        // Convert shares from wei to CAST
        const amount = parseFloat(ethers.formatEther(shares));

        return {
          id: `bet-${event.transactionHash}-${tokenId}`,
          marketId: marketAddress,
          position: isYes ? 'yes' : 'no',
          amount: amount,
          walletAddress: owner,
          placedAt: new Date(timestamp).toISOString(),
          transactionHash: event.transactionHash,
          tokenId: tokenId.toString(),
          shares: shares.toString()
        };
      }));

      console.log(`✅ Processed ${bets.length} bets from blockchain`);
      return bets;

    } catch (error: any) {
      console.error('❌ Error fetching bet history:', error);
      return [];
    }
  }

}

/**
 * Gets configuration for Hedera EVM service
 */
export const getHederaEVMConfig = (): HederaEVMConfig => {
  return {
    rpcUrl: 'https://testnet.hashio.io/api',
    privateKey: (import.meta.env as any).VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9',
    factoryAddress: TOKEN_ADDRESSES.FACTORY_CONTRACT
  };
};

// Singleton instance for easy access
let globalHederaEVMService: HederaEVMService | null = null;

/**
 * Get or create the global HederaEVMService instance
 */
export const getHederaEVMServiceInstance = (): HederaEVMService => {
  if (!globalHederaEVMService) {
    const config = getHederaEVMConfig();
    globalHederaEVMService = new HederaEVMService(config);
  }
  return globalHederaEVMService;
};
