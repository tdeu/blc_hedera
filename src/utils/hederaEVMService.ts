import { ethers } from 'ethers';
import { toast } from 'sonner';

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
    "function createMarket(string memory question, uint256 endTime) external returns (bytes32)",
    "function markets(bytes32) external view returns (address)",
    "event MarketCreated(bytes32 indexed id, address market, string question)"
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

    if (connectedWallet) {
      // Use connected wallet (MetaMask)
      this.provider = connectedWallet.provider;
      this.signer = connectedWallet.signer;
      console.log('✅ EVM Service initialized with connected wallet');
    } else if (config.privateKey) {
      // Fallback to hardcoded private key for development
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
      console.log('✅ EVM Service initialized with private key');
    } else {
      throw new Error('Either connected wallet or private key must be provided');
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
      
      // First, let's test basic connectivity
      console.log('🔍 Testing connectivity...');
      const balance = await this.provider.getBalance(this.signer.address);
      console.log('✅ Signer balance:', ethers.formatEther(balance), 'HBAR');
      
      const factory = new ethers.Contract(
        this.factoryAddress,
        this.factoryABI,
        this.signer
      );
      
      console.log('🏭 Factory contract initialized at:', this.factoryAddress);

      // Skip the test and go directly to market creation
      console.log('📊 Proceeding with market creation (skipping status check)');

      const endTime = Math.floor(expirationDate.getTime() / 1000);
      const currentTime = Math.floor(Date.now() / 1000);
      console.log('⏰ Market end time:', endTime, 'vs current time:', currentTime);
      console.log('✅ End time validation:', endTime > currentTime ? 'VALID' : 'INVALID');
      
      // Call createMarket function with sufficient gas
      console.log('🚀 About to call factory.createMarket with params:', {
        claim: claim.substring(0, 50) + '...',
        endTime,
        gasLimit: 5000000
      });
      
      let tx;
      try {
        tx = await factory.createMarket(claim, endTime, {
          gasLimit: 5000000 // Set high gas limit for contract creation
        });
        console.log('✅ Transaction sent successfully:', tx.hash);
      } catch (txError) {
        console.error('❌ Transaction creation failed:', txError);
        throw txError;
      }
      
      let receipt;
      try {
        console.log('⏳ Waiting for transaction confirmation (with extended timeout)...');
        // Wait longer for Hedera's block times
        receipt = await tx.wait(); // Let it use default wait behavior
        
        // Check if transaction was successful
        if (receipt.status === 0) {
          console.error('❌ Transaction reverted on-chain. Status:', receipt.status);
          console.error('Receipt details:', {
            hash: receipt.hash,
            gasUsed: receipt.gasUsed?.toString(),
            logs: receipt.logs?.length || 0
          });
          throw new Error('Transaction reverted on blockchain');
        }
        
        console.log('✅ Transaction confirmed:', receipt.hash);
        console.log('📋 Receipt logs count:', receipt.logs?.length || 0);
      } catch (receiptError) {
        console.error('❌ Transaction confirmation failed after extended wait:', receiptError);
        console.error('Receipt error details:', receiptError?.message);
        console.error('Receipt error code:', receiptError?.code);
        console.error('Receipt error data:', receiptError?.data);
        throw receiptError;
      }

      // Log all events for debugging
      console.log('🔍 Parsing all transaction logs...');
      receipt.logs?.forEach((log, index) => {
        console.log(`Log ${index}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        });
        
        try {
          const parsed = factory.interface.parseLog(log);
          console.log(`✅ Parsed log ${index}:`, parsed?.name, parsed?.args);
        } catch (parseError) {
          console.log(`❌ Cannot parse log ${index}:`, parseError?.message);
        }
      });

      // Find the MarketCreated event
      const marketCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === 'MarketCreated';
        } catch {
          return false;
        }
      });

      console.log('🎯 MarketCreated event found:', !!marketCreatedEvent);

      if (marketCreatedEvent) {
        const parsedEvent = factory.interface.parseLog(marketCreatedEvent);
        const marketId = parsedEvent?.args?.id;
        const marketAddress = parsedEvent?.args?.market;
        
        console.log('🏆 Market created successfully:', { marketId, marketAddress });

        try {
          // Persist contract address to approved_markets if available in browser env
          const supabaseUrl = (globalThis as any)?.import?.meta?.env?.VITE_SUPABASE_URL || (typeof window !== 'undefined' ? (window as any).VITE_SUPABASE_URL : undefined);
          const supabaseAnon = (globalThis as any)?.import?.meta?.env?.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? (window as any).VITE_SUPABASE_ANON_KEY : undefined);
          // Fallback: call backend if you have one. For now, we will skip direct write if env not present.
          if (supabaseUrl && supabaseAnon) {
            // dynamic import to avoid bundling if not used
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseAnon);
            // 1) Try by exact market ID (bytes32 as string)
            let { data, error } = await supabase
              .from('approved_markets')
              .update({ contract_address: marketAddress })
              .eq('id', String(marketId))
              .select('id');
            if (error) {
              console.warn('⚠️ Failed to persist by id:', error.message);
            }
            if (!error && (!data || data.length === 0)) {
              // 2) Fallback by claim (if IDs don't match pre-chain/chain ids)
              const { data: byClaim, error: claimErr } = await supabase
                .from('approved_markets')
                .update({ contract_address: marketAddress })
                .eq('claim', claim)
                .is('contract_address', null)
                .select('id');
              if (claimErr) console.warn('⚠️ Fallback persist by claim failed:', claimErr.message);
              else if (byClaim && byClaim.length > 0) console.log('✅ Persisted contract address to approved_markets by claim');
              else console.log('ℹ️ No matching approved market found to persist contract address');
            } else {
              console.log('✅ Persisted contract address to approved_markets by id');
            }
          } else {
            console.log('ℹ️ Supabase env not available in this context; skip persistence');
          }
        } catch (persistErr) {
          console.warn('⚠️ Could not persist contract address to Supabase:', persistErr);
        }

        return {
          contractId: marketAddress,
          topicId: `market-${marketId}`, // Use market ID as topic reference
          createdAt: new Date(),
          status: 'active'
        };
      }

      // If we can't find the event, let's check if we can calculate the contract address
      console.log('⚠️ MarketCreated event not found, trying alternative approach...');
      
      // For now, we know the transaction succeeded, so return the transaction hash as a proxy
      // In a production system, you'd query the factory to get the market address
      console.log('🔄 Using transaction hash as temporary identifier until event parsing is fixed');
      
      return {
        contractId: tx.hash, // Use transaction hash temporarily 
        topicId: `market-tx-${tx.hash.slice(0, 10)}`,
        createdAt: new Date(),
        status: 'active'
      };
    } catch (error: any) {
      console.error('❌ MARKET CREATION FAILED - DETAILED ERROR:');
      console.error('Full error object:', error);
      console.error('Error code:', error?.code);
      console.error('Error reason:', error?.reason);
      console.error('Error message:', error?.message);
      console.error('Error data:', error?.data);
      console.error('Transaction data:', error?.transaction);
      console.error('Error stack:', error?.stack);
      
      // Re-throw the error with more context
      throw new Error(`❌ MARKET CREATION FAILED: ${error?.message || 'Unknown error'}`);
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
      console.log('Placing bet on Hedera EVM:', { marketAddress, position, amount });
      
      // CastToken is used as collateral based on deployment
      const castTokenAddress = '0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c';
      const erc20ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)"
      ];

      // PredictionMarket contract ABI
      const marketABI = [
        "function buyYes(uint256 shares) external",
        "function buyNo(uint256 shares) external", 
        "function getPriceYes(uint256 sharesToBuy) external view returns (uint256)",
        "function getPriceNo(uint256 sharesToBuy) external view returns (uint256)",
        "function collateral() external view returns (address)"
      ];

      const market = new ethers.Contract(marketAddress, marketABI, this.signer);
      
      // Get the actual collateral token address from the contract
      const actualCollateralAddress = await market.collateral();
      const collateral = new ethers.Contract(actualCollateralAddress, erc20ABI, this.signer);

      // Convert amount to wei (assuming collateral is 18 decimals like HBAR)
      const shares = ethers.parseEther(amount.toString());
      
      // Get the price for the shares
      const price = position === 'yes' 
        ? await market.getPriceYes(shares)
        : await market.getPriceNo(shares);

      console.log(`Cost for ${amount} shares: ${ethers.formatEther(price)} tokens`);

      // Check and approve collateral if needed
      const currentAllowance = await collateral.allowance(this.signer.address, marketAddress);
      if (currentAllowance < price) {
        console.log('Approving collateral...');
        const approveTx = await collateral.approve(marketAddress, price, { gasLimit: 100000 });
        await approveTx.wait();
        console.log('Collateral approved');
      }

      // Place the bet with sufficient gas
      const tx = position === 'yes' 
        ? await market.buyYes(shares, { gasLimit: 500000 })
        : await market.buyNo(shares, { gasLimit: 500000 });
        
      console.log('Bet transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Bet transaction confirmed:', receipt.hash);

      return tx.hash;
    } catch (error: any) {
      console.error('Failed to place bet on Hedera EVM:', error);
      throw new Error(`Failed to place bet: ${error.message}`);
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
      const castTokenAddress = '0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c';
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
      const castTokenAddress = '0xF6CbeE28F6B652b09c18b6aF5ACEC57B4840b54c';
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
}

/**
 * Gets configuration for Hedera EVM service
 */
export const getHederaEVMConfig = (): HederaEVMConfig => {
  return {
    rpcUrl: 'https://testnet.hashio.io/api',
    privateKey: import.meta.env.VITE_HEDERA_PRIVATE_KEY_EVM || '0xf8ba79af7c966d32d2f19e8d0a33dea8bb46347089c5cf9dc3ba6f84a30812b9',
    factoryAddress: '0x2122f101576b05635C16c0Cbc29Fe72a6172f5Fa' // Updated factory with correct collateral
  };
};