import { useState, useEffect, useCallback } from 'react';
import { HederaService, getHederaConfig, VerificationEvidence } from './hederaService';
import { HederaEVMService, getHederaEVMConfig, MarketContract } from './hederaEVMService';
import { BettingMarket } from '../components/BettingMarkets';
import { WalletConnection } from './walletService';
import { toast } from 'sonner';
import { ethers } from 'ethers';

interface UseHederaReturn {
  hederaService: HederaService | null;
  hederaEVMService: HederaEVMService | null;
  isConnected: boolean;
  isLoading: boolean;
  createMarket: (market: Partial<BettingMarket>) => Promise<MarketContract | null>;
  placeBet: (marketId: string, position: 'yes' | 'no', amount: number) => Promise<string | null>;
  placeBetWithAddress: (marketAddress: string, position: 'yes' | 'no', amount: number) => Promise<string | null>;
  submitEvidence: (topicId: string, evidence: string, source: string) => Promise<string | null>;
  getMarketEvidence: (topicId: string) => Promise<VerificationEvidence[]>;
  resolveMarket: (contractId: string, outcome: 'yes' | 'no') => Promise<string | null>;
}

export const useHedera = (walletConnection?: WalletConnection | null): UseHederaReturn => {
  const [hederaService, setHederaService] = useState<HederaService | null>(null);
  const [hederaEVMService, setHederaEVMService] = useState<HederaEVMService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeHedera = async () => {
      try {
        setIsLoading(true);
        
        // Get configuration based on environment
        const config = getHederaConfig(import.meta.env.MODE === 'production' ? 'production' : 'development');
        
        // Check if configuration is valid
        if (!config.operatorAccountId || !config.operatorPrivateKey) {
          console.warn('Hedera configuration not found. Running in mock mode.');
          setIsLoading(false);
          return;
        }

        const service = new HederaService(config);
        setHederaService(service);
        
        // Initialize EVM service for contract interactions
        const evmConfig = getHederaEVMConfig();
        
        // Initialize EVM service for contract interactions
        let evmService: HederaEVMService;
        
        try {
          // Always initialize with private key first, then update with wallet later
          console.log('🔄 Initializing HederaEVMService with private key (will update with wallet if connected)...');
          console.log('🔍 EVM Config details:', {
            rpcUrl: evmConfig.rpcUrl,
            factoryAddress: evmConfig.factoryAddress,
            hasPrivateKey: !!evmConfig.privateKey,
            privateKeyLength: evmConfig.privateKey?.length || 0
          });
          
          evmService = new HederaEVMService(evmConfig);
          console.log('✅ HederaEVMService initialized successfully');
          
          setHederaEVMService(evmService);
        } catch (evmError) {
          console.error('❌ Failed to initialize HederaEVMService:', evmError);
          console.error('EVM Config:', evmConfig);
          console.error('Error details:', {
            message: evmError?.message,
            stack: evmError?.stack,
            name: evmError?.name
          });
          // Don't re-throw, just log and continue without EVM service
          console.warn('⚠️ Continuing without HederaEVMService - will use mock mode');
        }
        
        setIsConnected(true);
        console.log('Connected to Hedera network (HCS + EVM)');
      } catch (error) {
        console.error('Failed to initialize Hedera service:', error);
        console.warn('Failed to connect to Hedera network. Running in mock mode.');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeHedera();
  }, []); // Remove walletConnection dependency to prevent constant re-initialization

  // Update EVM service when wallet connection changes (but not when EVM service changes)
  useEffect(() => {
    if (hederaService && walletConnection && walletConnection.provider && walletConnection.signer) {
      console.log('🔄 Updating HederaEVMService with connected wallet...');
      const evmConfig = getHederaEVMConfig();
      
      try {
        const evmService = new HederaEVMService(evmConfig, {
          provider: walletConnection.provider,
          signer: walletConnection.signer
        });
        setHederaEVMService(evmService);
        console.log('✅ HederaEVMService updated with connected wallet address:', walletConnection.address);
      } catch (error) {
        console.error('❌ Failed to update HederaEVMService with wallet:', error);
        console.error('Wallet connection details:', walletConnection);
      }
    } else if (walletConnection) {
      console.log('⏳ Wallet connected but Hedera service not ready yet');
    }
  }, [walletConnection?.address]); // Only depend on wallet address, not the entire connection object

  const createMarket = useCallback(async (market: Partial<BettingMarket>): Promise<MarketContract | null> => {
    console.log('🏗️ createMarket called with:', { 
      hederaEVMService: !!hederaEVMService,
      isConnected,
      isLoading,
      marketClaim: market.claim
    });
    
    if (!hederaEVMService) {
      console.warn('Hedera EVM service not available. Attempting to create service on-demand...');
      
      // Try to create the service on-demand
      try {
        const { HederaEVMService, getHederaEVMConfig } = await import('./hederaEVMService');
        const evmConfig = getHederaEVMConfig();
        const tempService = new HederaEVMService(evmConfig);
        
        console.log('✅ On-demand HederaEVMService created successfully');
        setHederaEVMService(tempService);
        // Continue with the real service
      } catch (error) {
        console.error('❌ Failed to create HederaEVMService on-demand:', error);
        console.log('🔍 Debug info:', {
          hederaEVMService: !!hederaEVMService,
          isConnected,
          isLoading
        });
        throw new Error('Failed to create HederaEVMService');
      }
    }

    try {
      setIsLoading(true);
      
      console.log('🚀 Calling hederaEVMService.createMarket...');
      console.log('📋 Market details:', {
        claim: market.claim,
        description: market.description,
        expiresAt: market.expiresAt,
        category: market.category
      });
      
      const marketContract = await hederaEVMService.createMarket(
        market.claim || '',
        market.description || '',
        market.expiresAt || new Date(),
        market.category || 'General',
        market.id // Pass market ID for unique identification
      );

      console.log('✅ Market created on Hedera EVM:', marketContract.contractId);
      console.log('📋 Market contract details:', marketContract);
      console.log('🔍 Contract ID validation:', {
        isString: typeof marketContract.contractId === 'string',
        length: marketContract.contractId?.length,
        startsWith0x: marketContract.contractId?.startsWith('0x'),
        isMock: marketContract.contractId?.startsWith('mock-'),
        isValid: marketContract.contractId && marketContract.contractId.startsWith('0x') && marketContract.contractId.length === 42
      });
      return marketContract;
    } catch (error) {
      console.error('❌ EVM market creation failed - FULL ERROR:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Instead of returning mock data, re-throw the error
      throw new Error(`Failed to create market: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [hederaEVMService]);

  const placeBet = useCallback(async (
    marketId: string, 
    position: 'yes' | 'no', 
    amount: number
  ): Promise<string | null> => {
    console.log('🎯 placeBet called with:', { marketId, position, amount });
    console.log('📊 HederaEVMService status:', hederaEVMService ? 'AVAILABLE' : 'NULL');
    
    if (!hederaEVMService) {
      console.warn('❌ Hedera EVM service not available. Processing mock bet.');
      console.log('🔍 Debug info:', {
        hederaEVMService: !!hederaEVMService,
        isConnected,
        isLoading
      });
      // Return mock transaction ID for development
      return `mock-tx-${Date.now()}`;
    }
    
    console.log('🚀 Starting real bet placement with HederaEVMService...');

    try {
      setIsLoading(true);
      
      const transactionId = await hederaEVMService.placeBet(marketId, position, amount);
      
      console.log(`Position placed on blockchain: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.warn('EVM bet placement failed (running in mock mode):', error);
      // Return mock transaction ID for development - app continues to work normally
      return `mock-tx-${Date.now()}`;
    } finally {
      setIsLoading(false);
    }
  }, [hederaEVMService]);

  const placeBetWithAddress = useCallback(async (
    marketAddress: string, 
    position: 'yes' | 'no', 
    amount: number
  ): Promise<string | null> => {
    console.log('🎯 placeBetWithAddress called with:', { marketAddress, position, amount });
    console.log('📊 HederaEVMService status:', hederaEVMService ? 'AVAILABLE' : 'NULL');
    console.log('🔍 Market address validation:', {
      isString: typeof marketAddress === 'string',
      length: marketAddress?.length,
      startsWith0x: marketAddress?.startsWith('0x'),
      isValid: marketAddress && marketAddress.startsWith('0x') && marketAddress.length === 42
    });
    
    if (!hederaEVMService) {
      console.warn('❌ Hedera EVM service not available. Processing mock bet.');
      console.log('🔍 Debug info:', {
        hederaEVMService: !!hederaEVMService,
        isConnected,
        isLoading
      });
      // Return mock transaction ID for development
      return `mock-tx-${Date.now()}`;
    }
    
    console.log('🚀 Starting real bet placement with HederaEVMService...');

    try {
      setIsLoading(true);

      console.log('🎯 About to call hederaEVMService.placeBet...');
      const transactionId = await hederaEVMService.placeBet(marketAddress, position, amount);
      console.log('✅ hederaEVMService.placeBet completed successfully');

      console.log(`Position placed on blockchain: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error('❌ EVM bet placement failed:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error details:', {
        name: error?.name,
        code: error?.code,
        reason: error?.reason
      });

      // Only return mock for specific errors - insufficient balance should throw
      if (error?.message?.includes('Insufficient CAST balance')) {
        // Re-throw balance errors to show user the error message
        throw error;
      }

      // For other errors (network issues, etc.), return mock transaction ID for development
      console.warn('❌ Non-balance error, returning mock transaction for development');
      return `mock-tx-${Date.now()}`;
    } finally {
      setIsLoading(false);
    }
  }, [hederaEVMService]);

  const submitEvidence = useCallback(async (
    topicId: string, 
    evidence: string, 
    source: string
  ): Promise<string | null> => {
    if (!hederaService) {
      console.warn('Hedera service not available. Processing mock evidence submission.');
      return `mock-evidence-${Date.now()}`;
    }

    try {
      setIsLoading(true);
      
      const evidenceData: VerificationEvidence = {
        evidence,
        source,
        timestamp: new Date(),
        submitter: 'current-user' // This would be the actual user account ID
      };

      const transactionId = await hederaService.submitEvidence(topicId, evidenceData);
      
      console.log('Evidence submitted to Hedera Consensus Service:', transactionId);
      return transactionId;
    } catch (error) {
      console.warn('Failed to submit evidence to blockchain (mock mode):', error);
      return `mock-evidence-${Date.now()}`;
    } finally {
      setIsLoading(false);
    }
  }, [hederaService]);

  const getMarketEvidence = useCallback(async (topicId: string): Promise<VerificationEvidence[]> => {
    if (!hederaService) {
      console.warn('Hedera service not available. Returning mock evidence.');
      return [];
    }

    try {
      setIsLoading(true);
      
      const evidence = await hederaService.getMarketEvidence(topicId);
      return evidence;
    } catch (error) {
      console.warn('Failed to retrieve evidence from blockchain (mock mode):', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [hederaService]);

  const resolveMarket = useCallback(async (
    contractId: string, 
    outcome: 'yes' | 'no'
  ): Promise<string | null> => {
    if (!hederaService) {
      console.warn('Hedera service not available. Processing mock resolution.');
      return `mock-resolution-${Date.now()}`;
    }

    try {
      setIsLoading(true);
      
      // In a real implementation, you'd compute the evidence hash
      const evidenceHash = 'evidence-hash-placeholder';
      
      const transactionId = await hederaService.resolveMarket(contractId, outcome, evidenceHash);
      
      console.log(`Market resolved on blockchain: ${outcome.toUpperCase()}`);
      return transactionId;
    } catch (error) {
      console.warn('Failed to resolve market on blockchain (mock mode):', error);
      return `mock-resolution-${Date.now()}`;
    } finally {
      setIsLoading(false);
    }
  }, [hederaService]);

  return {
    hederaService,
    hederaEVMService,
    isConnected,
    isLoading,
    createMarket,
    placeBet,
    placeBetWithAddress,
    submitEvidence,
    getMarketEvidence,
    resolveMarket
  };
};