import { useState, useEffect, useCallback } from 'react';
import { HederaService, getHederaConfig, MarketContract, VerificationEvidence } from './hederaService';
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
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeHedera = async () => {
      try {
        setIsLoading(true);
        
        // Get configuration based on environment
        const config = getHederaConfig(process.env.NODE_ENV === 'production' ? 'production' : 'development');
        
        // Check if configuration is valid
        if (!config.operatorAccountId || !config.operatorPrivateKey) {
          console.warn('Hedera configuration not found. Running in mock mode.');
          setIsLoading(false);
          return;
        }

        const service = new HederaService(config);
        setHederaService(service);
        setIsConnected(true);
        
        toast.success('Connected to Hedera network');
      } catch (error) {
        console.error('Failed to initialize Hedera service:', error);
        toast.error('Failed to connect to Hedera network. Running in mock mode.');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeHedera();
  }, []);

  const createMarket = useCallback(async (market: Partial<BettingMarket>): Promise<MarketContract | null> => {
    if (!hederaService) {
      console.warn('Hedera service not available. Creating mock market.');
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
      
      const marketContract = await hederaService.createMarket(
        market.claim || '',
        market.description || '',
        market.expiresAt || new Date(),
        market.category || 'General'
      );

      toast.success('Market created on Hedera blockchain');
      return marketContract;
    } catch (error) {
      console.error('Failed to create market:', error);
      toast.error('Failed to create market on blockchain');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hederaService]);

  const placeBet = useCallback(async (
    marketId: string, 
    position: 'yes' | 'no', 
    amount: number
  ): Promise<string | null> => {
    if (!hederaService) {
      console.warn('Hedera service not available. Processing mock bet.');
      // Return mock transaction ID for development
      return `mock-tx-${Date.now()}`;
    }

    try {
      setIsLoading(true);
      
      const transactionId = await hederaService.placeBet(marketId, position, amount);
      
      toast.success(`Position placed on blockchain: ${transactionId.substring(0, 20)}...`);
      return transactionId;
    } catch (error) {
      console.error('Failed to place bet:', error);
      toast.error('Failed to place position on blockchain');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hederaService]);

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
      
      toast.success('Evidence submitted to Hedera Consensus Service');
      return transactionId;
    } catch (error) {
      console.error('Failed to submit evidence:', error);
      toast.error('Failed to submit evidence to blockchain');
      return null;
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
      console.error('Failed to get market evidence:', error);
      toast.error('Failed to retrieve evidence from blockchain');
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
      
      toast.success(`Market resolved on blockchain: ${outcome.toUpperCase()}`);
      return transactionId;
    } catch (error) {
      console.error('Failed to resolve market:', error);
      toast.error('Failed to resolve market on blockchain');
      return null;
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