import { z } from 'zod';
import { Context, Tool } from 'hedera-agent-kit';
import { Client } from '@hashgraph/sdk';

// Define parameter schema for dispute reward calculation
const calculateDisputeRewardsParameters = (context: Context = {}) =>
  z.object({
    marketId: z.string().describe('Market ID for reward calculations'),
    finalOutcome: z.enum(['YES', 'NO', 'INVALID']).describe('Final resolved outcome of the market'),
    disputes: z.array(z.object({
      disputeId: z.string(),
      disputerAddress: z.string(),
      bondAmount: z.number(),
      validity: z.enum(['VALID', 'INVALID', 'UNCERTAIN']),
      qualityScore: z.number().min(0).max(1),
      submissionTime: z.string(),
      evidenceStrength: z.number().min(0).max(1).optional()
    })).describe('Array of all disputes with their validity assessments'),
    aiOriginalConfidence: z.number().min(0).max(1).describe('Original AI confidence before disputes'),
    protocolSettings: z.object({
      rewardMultiplier: z.number().default(2).describe('Base reward multiplier for valid disputes'),
      qualityBonusThreshold: z.number().default(0.8).describe('Quality threshold for bonus rewards'),
      qualityBonusMultiplier: z.number().default(0.5).describe('Additional multiplier for high-quality disputes'),
      treasuryFee: z.number().default(0.1).describe('Percentage of slashed bonds going to treasury'),
      gasRefundAmount: z.number().default(0.5).describe('HBAR amount for gas refund to valid disputers')
    }).optional().default({}).describe('Protocol reward settings')
  });

// Calculate dispute rewards prompt
const calculateDisputeRewardsPrompt = (context: Context = {}) => {
  return `
  This tool calculates comprehensive dispute rewards and slashing distributions for resolved BlockCast markets.
  
  It implements sophisticated reward economics:
  - Valid disputers receive 2x bond amount + quality bonuses + share of slashed bonds
  - High-quality disputes (>0.8 score) get additional bonus rewards
  - Invalid disputers lose their bonds to slashing pool
  - Uncertain disputes receive bond return with no penalties
  - Treasury receives percentage of slashed bonds for protocol sustainability
  - Gas fee refunds provided to valid disputers
  - Early submission bonuses for timely dispute filing
  
  Parameters:
  - marketId (string, required): Market identifier for reward calculations
  - finalOutcome (enum, required): Final market resolution (YES/NO/INVALID)
  - disputes (array, required): All disputes with validity and quality assessments
  - aiOriginalConfidence (number, required): AI's original confidence score
  - protocolSettings (object, optional): Reward calculation parameters
  
  Returns detailed reward distribution plan with transaction instructions.
  `;
};

// Calculate quality bonuses based on dispute characteristics
const calculateQualityBonuses = (dispute: any, protocolSettings: any) => {
  let qualityBonus = 0;
  let bonusReasons = [];
  
  // Base quality bonus for high-scoring disputes
  if (dispute.qualityScore >= protocolSettings.qualityBonusThreshold) {
    const baseBonus = dispute.bondAmount * protocolSettings.qualityBonusMultiplier;
    qualityBonus += baseBonus;
    bonusReasons.push(`High quality score (${(dispute.qualityScore * 100).toFixed(0)}%): +${baseBonus.toFixed(2)} CAST`);
  }
  
  // Evidence strength bonus
  if (dispute.evidenceStrength && dispute.evidenceStrength >= 0.9) {
    const evidenceBonus = dispute.bondAmount * 0.3;
    qualityBonus += evidenceBonus;
    bonusReasons.push(`Strong evidence (${(dispute.evidenceStrength * 100).toFixed(0)}%): +${evidenceBonus.toFixed(2)} CAST`);
  }
  
  // Early submission bonus (within first 12 hours of dispute window)
  const submissionTime = new Date(dispute.submissionTime);
  const now = new Date();
  const hoursFromSubmission = (now.getTime() - submissionTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursFromSubmission <= 12) {
    const earlyBonus = dispute.bondAmount * 0.2;
    qualityBonus += earlyBonus;
    bonusReasons.push(`Early submission (${hoursFromSubmission.toFixed(1)}h): +${earlyBonus.toFixed(2)} CAST`);
  }
  
  return { qualityBonus, bonusReasons };
};

// Calculate slashing distribution
const calculateSlashingDistribution = (disputes: any[], protocolSettings: any) => {
  const validDisputes = disputes.filter(d => d.validity === 'VALID');
  const invalidDisputes = disputes.filter(d => d.validity === 'INVALID');
  
  const totalSlashedAmount = invalidDisputes.reduce((sum, d) => sum + d.bondAmount, 0);
  const treasuryAmount = totalSlashedAmount * protocolSettings.treasuryFee;
  const redistributionAmount = totalSlashedAmount - treasuryAmount;
  
  // Distribute slashed bonds to valid disputers based on quality scores
  let qualityWeightedDistribution: { [key: string]: number } = {};
  
  if (validDisputes.length > 0) {
    const totalQualityWeight = validDisputes.reduce((sum, d) => sum + d.qualityScore, 0);
    
    validDisputes.forEach(dispute => {
      const share = (dispute.qualityScore / totalQualityWeight) * redistributionAmount;
      qualityWeightedDistribution[dispute.disputeId] = share;
    });
  }
  
  return {
    totalSlashedAmount,
    treasuryAmount,
    redistributionAmount,
    qualityWeightedDistribution,
    invalidDisputeIds: invalidDisputes.map(d => d.disputeId)
  };
};

// Generate reward transactions
const generateRewardTransactions = (disputes: any[], slashingDistribution: any, protocolSettings: any) => {
  const transactions = [];
  
  for (const dispute of disputes) {
    let transaction = {
      disputeId: dispute.disputeId,
      disputerAddress: dispute.disputerAddress,
      originalBond: dispute.bondAmount,
      validity: dispute.validity,
      qualityScore: dispute.qualityScore,
      baseReward: 0,
      qualityBonus: 0,
      slashingShare: 0,
      gasRefund: 0,
      totalReward: 0,
      action: 'UNKNOWN',
      bonusReasons: [],
      transactionType: 'HTS_TRANSFER'
    };
    
    if (dispute.validity === 'VALID') {
      // Valid disputers get full reward package
      transaction.baseReward = dispute.bondAmount * protocolSettings.rewardMultiplier;
      
      const qualityBonusCalc = calculateQualityBonuses(dispute, protocolSettings);
      transaction.qualityBonus = qualityBonusCalc.qualityBonus;
      transaction.bonusReasons = qualityBonusCalc.bonusReasons;
      
      transaction.slashingShare = slashingDistribution.qualityWeightedDistribution[dispute.disputeId] || 0;
      transaction.gasRefund = protocolSettings.gasRefundAmount;
      transaction.totalReward = transaction.baseReward + transaction.qualityBonus + transaction.slashingShare + transaction.gasRefund;
      transaction.action = 'REWARD_WITH_BONUSES';
      
    } else if (dispute.validity === 'UNCERTAIN') {
      // Uncertain disputes get bond back only
      transaction.baseReward = dispute.bondAmount;
      transaction.totalReward = transaction.baseReward;
      transaction.action = 'RETURN_BOND_ONLY';
      
    } else {
      // Invalid disputes get slashed
      transaction.totalReward = 0;
      transaction.action = 'SLASH_BOND';
      transaction.transactionType = 'BOND_SLASHING';
    }
    
    transactions.push(transaction);
  }
  
  // Add treasury transaction for slashed bonds
  if (slashingDistribution.totalSlashedAmount > 0) {
    transactions.push({
      disputeId: 'TREASURY_ALLOCATION',
      disputerAddress: process.env.TREASURY_ADDRESS || '0x2294B9B3dbD2A23206994294D4cd4599Fdd8BdDD',
      originalBond: 0,
      validity: 'N/A',
      qualityScore: 0,
      baseReward: 0,
      qualityBonus: 0,
      slashingShare: 0,
      gasRefund: 0,
      totalReward: slashingDistribution.treasuryAmount,
      action: 'TREASURY_DEPOSIT',
      bonusReasons: [`Protocol fee from ${slashingDistribution.invalidDisputeIds.length} slashed bonds`],
      transactionType: 'TREASURY_TRANSFER'
    });
  }
  
  return transactions;
};

// Generate gas estimates for all transactions
const estimateGasCosts = (transactions: any[]) => {
  const gasEstimates = {
    htsTransfers: 0,
    bondSlashing: 0,
    treasuryDeposit: 0,
    totalGasHBAR: 0,
    totalTransactions: transactions.length
  };
  
  transactions.forEach(tx => {
    switch (tx.transactionType) {
      case 'HTS_TRANSFER':
        gasEstimates.htsTransfers += 50000; // Estimated gas per HTS transfer
        break;
      case 'BOND_SLASHING':
        gasEstimates.bondSlashing += 30000; // Estimated gas per slashing
        break;
      case 'TREASURY_TRANSFER':
        gasEstimates.treasuryDeposit += 40000; // Estimated gas per treasury deposit
        break;
    }
  });
  
  const totalGasUnits = gasEstimates.htsTransfers + gasEstimates.bondSlashing + gasEstimates.treasuryDeposit;
  gasEstimates.totalGasHBAR = totalGasUnits * 0.00000001; // Approximate HBAR per gas unit
  
  return gasEstimates;
};

// Main execution function
const calculateDisputeRewardsExecute = async (
  client: Client,
  context: Context,
  params: z.infer<ReturnType<typeof calculateDisputeRewardsParameters>>
) => {
  try {
    console.log(`Starting dispute reward calculations for market ${params.marketId}`);
    
    const protocolSettings = {
      rewardMultiplier: 2,
      qualityBonusThreshold: 0.8,
      qualityBonusMultiplier: 0.5,
      treasuryFee: 0.1,
      gasRefundAmount: 0.5,
      ...params.protocolSettings
    };
    
    // 1. Calculate slashing distribution
    const slashingDistribution = calculateSlashingDistribution(params.disputes, protocolSettings);
    
    // 2. Generate individual reward transactions
    const rewardTransactions = generateRewardTransactions(params.disputes, slashingDistribution, protocolSettings);
    
    // 3. Calculate gas estimates
    const gasEstimates = estimateGasCosts(rewardTransactions);
    
    // 4. Generate summary statistics
    const validRewards = rewardTransactions.filter(tx => tx.validity === 'VALID');
    const invalidSlashed = rewardTransactions.filter(tx => tx.validity === 'INVALID');
    const uncertainReturns = rewardTransactions.filter(tx => tx.validity === 'UNCERTAIN');
    
    const summary = {
      totalDisputes: params.disputes.length,
      validDisputes: validRewards.length,
      invalidDisputes: invalidSlashed.length,
      uncertainDisputes: uncertainReturns.length,
      totalRewardsDistributed: rewardTransactions.reduce((sum, tx) => sum + tx.totalReward, 0),
      totalBonusesAwarded: rewardTransactions.reduce((sum, tx) => sum + tx.qualityBonus, 0),
      totalSlashedAmount: slashingDistribution.totalSlashedAmount,
      treasuryAllocation: slashingDistribution.treasuryAmount,
      averageQualityScore: params.disputes.reduce((sum, d) => sum + d.qualityScore, 0) / params.disputes.length,
      highQualityDisputes: params.disputes.filter(d => d.qualityScore >= protocolSettings.qualityBonusThreshold).length
    };
    
    // 5. Generate execution plan
    const executionPlan = {
      marketId: params.marketId,
      finalOutcome: params.finalOutcome,
      aiOriginalConfidence: params.aiOriginalConfidence,
      protocolSettings,
      summary,
      rewardTransactions,
      slashingDistribution,
      gasEstimates,
      executionOrder: [
        'Execute bond slashing for invalid disputes',
        'Transfer base rewards to valid disputers', 
        'Distribute quality bonuses',
        'Redistribute slashed bond shares',
        'Process gas fee refunds',
        'Transfer treasury allocation',
        'Update dispute statuses in database',
        'Submit reward distribution audit to HCS'
      ],
      estimatedExecutionTime: `${Math.ceil(rewardTransactions.length * 0.5)} seconds`,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Dispute reward calculation complete for market ${params.marketId}:`, {
      totalRewards: summary.totalRewardsDistributed.toFixed(2),
      validDisputes: summary.validDisputes,
      slashedAmount: summary.totalSlashedAmount.toFixed(2),
      transactions: rewardTransactions.length,
      estimatedGas: gasEstimates.totalGasHBAR.toFixed(6)
    });
    
    return executionPlan;
    
  } catch (error) {
    console.error('Dispute reward calculation failed:', error);
    if (error instanceof Error) {
      return {
        error: error.message,
        marketId: params.marketId,
        timestamp: new Date().toISOString()
      };
    }
    return {
      error: 'Dispute reward calculation failed',
      marketId: params.marketId,
      timestamp: new Date().toISOString()
    };
  }
};

export const CALCULATE_DISPUTE_REWARDS = 'calculate_dispute_rewards';

const tool = (context: Context): Tool => ({
  method: CALCULATE_DISPUTE_REWARDS,
  name: 'Calculate Dispute Rewards',
  description: calculateDisputeRewardsPrompt(context),
  parameters: calculateDisputeRewardsParameters(context),
  execute: calculateDisputeRewardsExecute,
});

export default tool;