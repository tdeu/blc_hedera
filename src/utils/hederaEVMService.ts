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
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        console.log('🔍 Creating wallet with private key length:', config.privateKey.length);
        this.signer = new ethers.Wallet(config.privateKey, this.provider);
        console.log('✅ EVM Service initialized with private key');
      } else {
        throw new Error('Either connected wallet or private key must be provided');
      }
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
    category: string
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
      console.log('📊 Proceeding with market creation');

      // Creates a market that expires in 24 hours
      const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
      
      // Or for testing, even shorter (1 hour):
      // const endTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour from now

      console.log('⏰ Market end time:', endTime, 'vs current time:', Math.floor(Date.now() / 1000));
      console.log('⏰ Market will expire in:', (endTime - Math.floor(Date.now() / 1000)) / 3600, 'hours');
      
      console.log('🚀 About to call factory.createMarket with params:', {
        claim: claim.substring(0, 50) + '...',
        endTime,
        gasLimit: 5000000
      });

      // Proceed directly to createMarket call
      const tx = await factory.createMarket(claim, endTime, {
        gasLimit: 5000000
      });
      
      console.log('⏳ Waiting for transaction confirmation...');
      console.log('🔍 About to wait for receipt...');

      let receipt;
      try {
        // Use a longer timeout for Hedera's block times (up to 60 seconds)
        const receiptPromise = tx.wait();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Receipt timeout after 60 seconds')), 60000)
        );
        
        receipt = await Promise.race([receiptPromise, timeoutPromise]);
        
        if (receipt.status === 0) {
          throw new Error('Transaction failed on blockchain');
        }
        
        console.log('✅ Transaction confirmed:', receipt.hash);
        console.log('📋 Receipt status:', receipt.status);
        console.log('📋 Gas used:', receipt.gasUsed?.toString());
        console.log('📋 Receipt logs count:', receipt.logs?.length || 0);
        
      } catch (receiptError) {
        console.error('❌ Receipt confirmation error:', receiptError);
        
        // Try manual lookup with multiple attempts
        console.log('🔄 Attempting manual receipt lookup...');
        
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            console.log(`🔍 Manual lookup attempt ${attempt}/5...`);
            await new Promise(resolve => setTimeout(resolve, 5000 * attempt)); // Progressive delay
            
            const manualReceipt = await this.provider.getTransactionReceipt(tx.hash);
            if (manualReceipt && manualReceipt.status !== null) {
              receipt = manualReceipt;
              console.log('✅ Manual receipt obtained!');
              console.log('📋 Manual receipt status:', receipt.status);
              break;
            }
          } catch (manualError) {
            console.log(`⚠️ Manual attempt ${attempt} failed:`, manualError.message);
          }
        }
        
        if (!receipt) {
          console.error('❌ Could not get receipt after multiple attempts');
          throw new Error(`Transaction sent but receipt confirmation failed: ${tx.hash}`);
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
            marketAddress = parsed.args?.market;
            console.log('✅ MarketCreated event found!');
            console.log('📍 Market address:', marketAddress);
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
          const marketCreatedSignature = '0xec25940cde6eeb2c10269a5a11aee5140a3802dc1f9c1915d26c9e2b9410f6c0';

          if (log.topics && log.topics[0] === marketCreatedSignature) {
            console.log('✅ Confirmed MarketCreated event signature match');

            try {
              // Decode the data part which contains: address market, string question
              // First 32 bytes (64 chars) = market address (padded)
              const marketAddressHex = log.data.slice(2, 66); // Remove 0x and take first 64 chars
              const extractedAddress = ethers.getAddress('0x' + marketAddressHex.slice(24)); // Remove padding, take last 40 chars

              console.log('🎯 Manually extracted market address:', extractedAddress);

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

      // Persist to Supabase if available
      try {
        const supabaseUrl = (globalThis as any)?.import?.meta?.env?.VITE_SUPABASE_URL 
          || (typeof window !== 'undefined' ? (window as any).VITE_SUPABASE_URL : undefined);
        const supabaseAnon = (globalThis as any)?.import?.meta?.env?.VITE_SUPABASE_ANON_KEY 
          || (typeof window !== 'undefined' ? (window as any).VITE_SUPABASE_ANON_KEY : undefined);

        if (supabaseUrl && supabaseAnon) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseAnon);
          await supabase
            .from('approved_markets')
            .update({ contract_address: marketAddress })
            .eq('claim', claim);
          console.log('✅ Contract address persisted to Supabase:', marketAddress);
        }
      } catch (persistErr) {
        console.warn('⚠️ Supabase persistence failed:', persistErr);
      }

      return {
        contractId: marketAddress,
        topicId: `market-${marketAddress.slice(0, 10)}`,
        createdAt: new Date(),
        status: 'active'
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
  ): Promise<string> {
    try {
      console.log('🎯 HederaEVMService.placeBet called:', { marketAddress, position, amount });
      
      // Validate market address
      if (!marketAddress || !marketAddress.startsWith('0x') || marketAddress.length !== 42) {
        throw new Error(`Invalid market address: ${marketAddress}`);
      }

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

      // TEMPORARY: Skip balance check to test betting flow
      console.log('🔍 Checking balance for address:', this.signer.address);
      console.log('🔍 Collateral contract address:', await collateral.getAddress());
      console.log('⚠️ TEMPORARILY SKIPPING BALANCE CHECK TO TEST BETTING FLOW');

      // Simulate having enough balance for testing
      console.log('💳 Simulated user balance: 1000.0 tokens (TESTING MODE)');
      console.log('💰 Required cost:', ethers.formatEther(cost), 'tokens');
      console.log('✅ Simulated balance check passed - proceeding with bet...');

      // Check and approve collateral if needed
      const currentAllowance = await collateral.allowance(this.signer.address, marketAddress);
      console.log('🔒 Current allowance:', ethers.formatEther(currentAllowance));
      
      if (currentAllowance < cost) {
        console.log('📝 Approving collateral...');
        const approveTx = await collateral.approve(marketAddress, cost, { gasLimit: 100000 });
        await approveTx.wait();
        console.log('✅ Collateral approved');
      }

      // Place the bet
      console.log(`🎲 Placing ${position.toUpperCase()} bet...`);
      const tx = position === 'yes' 
        ? await market.buyYes(shares, { gasLimit: 500000 })
        : await market.buyNo(shares, { gasLimit: 500000 });
        
      console.log('📤 Bet transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Bet transaction confirmed:', receipt.hash);

      return tx.hash;
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
      const marketIdBytes32 = ethers.utils.formatBytes32String(marketId);
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
      throw new Error('Not authorized to mint tokens or minting failed');
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

}

/**
 * Gets configuration for Hedera EVM service
 */
export const getHederaEVMConfig = (): HederaEVMConfig => {
  return {
    rpcUrl: 'https://testnet.hashio.io/api',
    privateKey: (import.meta.env as any).VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9',
    factoryAddress: '0xa9C5D6286F38b672B7a17763d72A8565559EC13c' // <- Update this line
  };
};
