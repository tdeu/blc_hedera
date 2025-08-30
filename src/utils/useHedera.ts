import { useState, useEffect, useCallback } from 'react';
import { HederaService, getHederaConfig, VerificationEvidence } from './hederaService';
import { HederaEVMService, getHederaEVMConfig, MarketContract } from './hederaEVMService';
import { BettingMarket } from '../components/BettingMarkets';
import { toast } from 'sonner';

interface UseHederaReturn {
  hederaService: HederaService | null;
  isConnected: boolean;
  isLoading: boolean;
  createMarket: (market: Partial<BettingMarket>) => Promise<MarketContract | null>;
  placeBet: (marketId: string, position: 'yes' | 'no', amount: number) => Promise<string | null>;
  submitEvidence: (topicId: string, evidence: string, source: string) => Promise<string | null>;
  getMarketEvidence: (topicId: string) => Promise<VerificationEvidence[]>;
  resolveMarket: (contractId: string, outcome: 'yes' | 'no') => Promise<string | null>;
}

export const useHedera = (): UseHederaReturn => {
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
        const evmService = new HederaEVMService(evmConfig);
        setHederaEVMService(evmService);
        
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
  }, []);

  const createMarket = useCallback(async (market: Partial<BettingMarket>): Promise<MarketContract | null> => {
    if (!hederaEVMService) {
      console.warn('Hedera EVM service not available. Creating mock market.');
      // Return mock data for development
      return {
        contractId: `mock-${Date.now()}`,
        topicId: `mock-topic-${Date.now()}`,
        createdAt: new Date(),
        status: 'active'
      };
    }

    try {
      setIsLoading(true);
      
      const marketContract = await hederaEVMService.createMarket(
        market.claim || '',
        market.description || '',
        market.expiresAt || new Date(),
        market.category || 'General'
      );

      console.log('Market created on Hedera EVM:', marketContract.contractId);
      return marketContract;
    } catch (error) {
      console.error('EVM market creation failed - FULL ERROR:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      // Return mock data for development - app continues to work normally
      return {
        contractId: `mock-${Date.now()}`,
        topicId: `mock-topic-${Date.now()}`,
        createdAt: new Date(),
        status: 'active'
      };
    } finally {
      setIsLoading(false);
    }
  }, [hederaEVMService]);

  const placeBet = useCallback(async (
    marketId: string, 
    position: 'yes' | 'no', 
    amount: number
  ): Promise<string | null> => {
    if (!hederaEVMService) {
      console.warn('Hedera EVM service not available. Processing mock bet.');
      // Return mock transaction ID for development
      return `mock-tx-${Date.now()}`;
    }

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
    isConnected,
    isLoading,
    createMarket,
    placeBet,
    submitEvidence,
    getMarketEvidence,
    resolveMarket
  };
};