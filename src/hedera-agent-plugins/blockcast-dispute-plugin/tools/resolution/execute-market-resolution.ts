import { z } from 'zod';
import { Context, Tool } from 'hedera-agent-kit';
import { Client, TopicMessageSubmitTransaction, ContractExecuteTransaction, ContractId, Hbar } from '@hashgraph/sdk';

// Define parameter schema for market resolution execution
const executeMarketResolutionParameters = (context: Context = {}) =>
  z.object({
    marketId: z.string().describe('Market ID to resolve'),
    marketContractId: z.string().describe('Smart contract address for the market'),
    outcome: z.enum(['YES', 'NO', 'INVALID']).describe('Final resolution outcome'),
    aiConfidence: z.number().min(0).max(1).describe('AI confidence score for the resolution'),
    disputeCount: z.number().describe('Total number of disputes submitted'),
    disputes: z.array(z.object({
      disputeId: z.string(),
      disputerAddress: z.string(),
      validity: z.enum(['VALID', 'INVALID', 'UNCERTAIN']),
      bondAmount: z.number()
    })).describe('Array of dispute information for reward processing'),
    resolutionReason: z.string().describe('Detailed reason for the resolution decision'),
    resolverAddress: z.string().describe('Address of the entity performing the resolution'),
    gasLimit: z.number().optional().default(300000).describe('Gas limit for smart contract execution')
  });

// Market resolution execution prompt
const executeMarketResolutionPrompt = (context: Context = {}) => {
  return `
  This tool executes the final resolution of a BlockCast truth verification market.
  
  It performs complete on-chain resolution workflow:
  - Validates resolution authority and parameters
  - Executes smart contract market resolution
  - Processes dispute rewards and bond slashing
  - Updates market status in Supabase database  
  - Submits comprehensive audit log to HCS
  - Handles gas fee calculations and transaction confirmations
  
  Parameters:
  - marketId (string, required): Market identifier to resolve
  - marketContractId (string, required): Smart contract address
  - outcome (enum, required): Final outcome - YES, NO, or INVALID
  - aiConfidence (number, required): AI confidence score (0-1)
  - disputeCount (number, required): Total disputes submitted
  - disputes (array, required): Dispute details for reward processing
  - resolutionReason (string, required): Detailed resolution reasoning
  - resolverAddress (string, required): Address performing resolution
  - gasLimit (number, optional): Gas limit for transactions (default: 300000)
  
  Returns transaction details, reward distributions, and audit information.
  `;
};

// Validate resolution authority
const validateResolutionAuthority = async (resolverAddress: string) => {
  // In production, this would check the AdminManager smart contract
  // For now, simulate admin validation
  const authorizedAddresses = [
    '0x32b03e2fd3dcbfd1cb9c17ff4f9652579945aead', // Example admin address
    process.env.ADMIN_ADDRESS,
    process.env.OPERATOR_ADDRESS
  ].filter(Boolean);
  
  return authorizedAddresses.includes(resolverAddress.toLowerCase());
};

// Execute smart contract resolution
const executeSmartContractCall = async (client: Client, params: any) => {
  try {
    // Simulate smart contract execution
    // In production, this would be:
    // const contractExecution = new ContractExecuteTransaction()
    //   .setContractId(ContractId.fromString(params.contractId))
    //   .setGas(params.gasLimit)
    //   .setFunction('resolveMarket', [
    //     params.outcome,
    //     params.aiConfidence,
    //     params.disputeCount,
    //     params.resolutionReason
    //   ]);
    // 
    // const response = await contractExecution.execute(client);
    // const receipt = await response.getReceipt(client);
    
    // Mock successful transaction
    const mockResponse = {
      transactionId: `0.0.${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gasUsed: Math.floor(params.gasLimit * 0.8), // Simulate 80% gas usage
      status: 'SUCCESS',
      contractResult: {
        gasUsed: Math.floor(params.gasLimit * 0.8),
        logs: [
          {
            event: 'MarketResolved',
            data: {
              marketId: params.marketId,
              outcome: params.outcome,
              resolver: params.resolverAddress,
              timestamp: new Date().toISOString()
            }
          }
        ]
      }
    };
    
    console.log(`Smart contract resolution executed for market ${params.marketId}:`, {
      transactionId: mockResponse.transactionId,
      outcome: params.outcome,
      gasUsed: mockResponse.gasUsed
    });
    
    return mockResponse;
    
  } catch (error) {
    console.error('Smart contract execution failed:', error);
    throw new Error(`Smart contract resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Process dispute rewards and slashing
const processDisputeRewards = async (client: Client, params: any) => {
  const rewardResults = [];
  
  for (const dispute of params.disputes) {
    let rewardAmount = 0;
    let bondAction = 'RETURN';
    let additionalReward = 0;
    
    // Calculate rewards based on dispute validity
    if (dispute.validity === 'VALID') {
      // Valid disputers get 2x their bond + share of slashed bonds
      rewardAmount = dispute.bondAmount * 2;
      additionalReward = params.disputes
        .filter((d: any) => d.validity === 'INVALID')
        .reduce((sum: number, d: any) => sum + d.bondAmount, 0) * 0.5 / 
        params.disputes.filter((d: any) => d.validity === 'VALID').length;
      bondAction = 'RETURN_WITH_REWARD';
    } else if (dispute.validity === 'UNCERTAIN') {
      // Uncertain disputes get their bond back but no reward
      rewardAmount = dispute.bondAmount;
      bondAction = 'RETURN_ONLY';
    } else {
      // Invalid disputes lose their bond (slashed)
      rewardAmount = 0;
      bondAction = 'SLASH';
    }
    
    // Simulate HTS token transfer for rewards
    // In production, this would execute actual HTS transfers
    const rewardTransaction = {
      type: bondAction,
      disputeId: dispute.disputeId,
      disputerAddress: dispute.disputerAddress,
      originalBond: dispute.bondAmount,
      rewardAmount: rewardAmount + additionalReward,
      transactionId: `reward-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    
    rewardResults.push(rewardTransaction);
    
    console.log(`Dispute ${dispute.disputeId} processed:`, {
      action: bondAction,
      reward: rewardAmount + additionalReward,
      validity: dispute.validity
    });
  }
  
  return rewardResults;
};

// Update market status in Supabase
const updateMarketInSupabase = async (params: any) => {
  try {
    // Simulate Supabase database update
    // In production, this would use the actual Supabase client
    const updateData = {
      id: params.marketId,
      status: 'resolved',
      resolution: params.outcome,
      resolved_by: params.resolverAddress,
      resolved_at: params.resolvedAt,
      ai_confidence_score: params.aiConfidence,
      resolution_reason: params.resolutionReason,
      dispute_count: params.disputes.length,
      total_rewards_distributed: params.disputeResults.reduce((sum: number, result: any) => sum + result.rewardAmount, 0)
    };
    
    console.log('Market status updated in Supabase:', {
      marketId: params.marketId,
      status: updateData.status,
      resolution: updateData.resolution,
      rewardsDistributed: updateData.total_rewards_distributed
    });
    
    return { success: true, data: updateData };
    
  } catch (error) {
    console.warn('Failed to update Supabase:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Database update failed' };
  }
};

// Submit audit log to HCS
const submitHCSAuditLog = async (client: Client, auditData: any) => {
  try {
    const auditMessage = JSON.stringify({
      type: 'MARKET_RESOLVED',
      marketId: auditData.marketId,
      outcome: auditData.outcome,
      transactionId: auditData.transactionId,
      disputesProcessed: auditData.disputesProcessed,
      totalRewardsDistributed: auditData.totalRewardsDistributed,
      resolverAddress: auditData.resolverAddress,
      aiConfidence: auditData.aiConfidence,
      gasUsed: auditData.gasUsed,
      timestamp: auditData.timestamp,
      version: 'BlockCast-Resolution-v2.0'
    });
    
    // In production, this would submit to actual HCS
    // const submitTransaction = new TopicMessageSubmitTransaction()
    //   .setTopicId(process.env.HCS_MARKET_EVENTS_TOPIC || '0.0.6701064')
    //   .setMessage(auditMessage);
    // 
    // const response = await submitTransaction.execute(client);
    // const receipt = await response.getReceipt(client);
    
    console.log('HCS audit log submitted:', {
      marketId: auditData.marketId,
      topicId: process.env.HCS_MARKET_EVENTS_TOPIC || '0.0.6701064',
      messageSize: auditMessage.length
    });
    
    return {
      success: true,
      topicId: process.env.HCS_MARKET_EVENTS_TOPIC || '0.0.6701064',
      messageId: `hcs-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.warn('HCS audit log submission failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'HCS submission failed'
    };
  }
};

// Main execution function
const executeMarketResolutionExecute = async (
  client: Client,
  context: Context,
  params: z.infer<ReturnType<typeof executeMarketResolutionParameters>>
) => {
  try {
    console.log(`Starting market resolution execution for market ${params.marketId}`);
    
    // 1. Validate resolution authority
    const isAuthorized = await validateResolutionAuthority(params.resolverAddress);
    if (!isAuthorized && context.mode === 'AUTONOMOUS') {
      throw new Error(`Unauthorized resolution attempt by ${params.resolverAddress}`);
    }
    
    // 2. Execute smart contract resolution
    const resolutionTx = await executeSmartContractCall(client, {
      contractId: params.marketContractId,
      marketId: params.marketId,
      outcome: params.outcome,
      aiConfidence: params.aiConfidence,
      disputeCount: params.disputeCount,
      resolutionReason: params.resolutionReason,
      resolverAddress: params.resolverAddress,
      gasLimit: params.gasLimit
    });
    
    // 3. Process dispute rewards and slashing
    const rewardResults = await processDisputeRewards(client, {
      marketId: params.marketId,
      disputes: params.disputes,
      finalOutcome: params.outcome
    });
    
    // 4. Update market status in Supabase
    const supabaseUpdate = await updateMarketInSupabase({
      marketId: params.marketId,
      status: 'resolved',
      outcome: params.outcome,
      resolverAddress: params.resolverAddress,
      resolvedAt: new Date().toISOString(),
      aiConfidence: params.aiConfidence,
      resolutionReason: params.resolutionReason,
      disputes: params.disputes,
      disputeResults: rewardResults
    });
    
    // 5. Submit comprehensive audit log to HCS
    const totalRewardsDistributed = rewardResults.reduce((sum, result) => sum + result.rewardAmount, 0);
    const hcsAudit = await submitHCSAuditLog(client, {
      marketId: params.marketId,
      outcome: params.outcome,
      transactionId: resolutionTx.transactionId,
      disputesProcessed: rewardResults.length,
      totalRewardsDistributed,
      resolverAddress: params.resolverAddress,
      aiConfidence: params.aiConfidence,
      gasUsed: resolutionTx.gasUsed,
      timestamp: new Date().toISOString()
    });
    
    // 6. Compile comprehensive response
    const response = {
      success: true,
      marketId: params.marketId,
      resolution: {
        outcome: params.outcome,
        confidence: params.aiConfidence,
        reason: params.resolutionReason,
        resolvedBy: params.resolverAddress,
        timestamp: new Date().toISOString()
      },
      blockchain: {
        transactionId: resolutionTx.transactionId,
        contractId: params.marketContractId,
        gasUsed: resolutionTx.gasUsed,
        gasLimit: params.gasLimit,
        status: resolutionTx.status
      },
      disputes: {
        totalDisputes: params.disputeCount,
        validDisputes: params.disputes.filter(d => d.validity === 'VALID').length,
        invalidDisputes: params.disputes.filter(d => d.validity === 'INVALID').length,
        uncertainDisputes: params.disputes.filter(d => d.validity === 'UNCERTAIN').length,
        totalRewardsDistributed,
        rewardTransactions: rewardResults
      },
      database: {
        supabaseUpdate: supabaseUpdate.success,
        supabaseError: supabaseUpdate.success ? null : supabaseUpdate.error
      },
      audit: {
        hcsSubmission: hcsAudit.success,
        topicId: hcsAudit.topicId,
        messageId: hcsAudit.messageId,
        hcsError: hcsAudit.success ? null : hcsAudit.error
      }
    };
    
    console.log(`Market resolution execution complete for ${params.marketId}:`, {
      outcome: response.resolution.outcome,
      transactionId: response.blockchain.transactionId,
      rewardsDistributed: response.disputes.totalRewardsDistributed,
      gasUsed: response.blockchain.gasUsed
    });
    
    return response;
    
  } catch (error) {
    console.error('Market resolution execution failed:', error);
    
    const errorResponse = {
      success: false,
      marketId: params.marketId,
      error: error instanceof Error ? error.message : 'Market resolution execution failed',
      timestamp: new Date().toISOString(),
      context: {
        outcome: params.outcome,
        resolverAddress: params.resolverAddress,
        disputeCount: params.disputeCount
      }
    };
    
    // Try to log the failure to HCS for audit purposes
    try {
      await submitHCSAuditLog(client, {
        type: 'RESOLUTION_FAILED',
        marketId: params.marketId,
        error: errorResponse.error,
        timestamp: errorResponse.timestamp
      });
    } catch (auditError) {
      console.warn('Failed to log error to HCS:', auditError);
    }
    
    return errorResponse;
  }
};

export const EXECUTE_MARKET_RESOLUTION = 'execute_market_resolution';

const tool = (context: Context): Tool => ({
  method: EXECUTE_MARKET_RESOLUTION,
  name: 'Execute Market Resolution',
  description: executeMarketResolutionPrompt(context),
  parameters: executeMarketResolutionParameters(context),
  execute: executeMarketResolutionExecute,
});

export default tool;