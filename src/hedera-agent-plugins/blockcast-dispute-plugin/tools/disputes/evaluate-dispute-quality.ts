import { z } from 'zod';
import { Context, Tool } from 'hedera-agent-kit';
import { Client } from '@hashgraph/sdk';

// Define parameter schema for dispute quality evaluation
const evaluateDisputeQualityParameters = (context: Context = {}) =>
  z.object({
    disputeId: z.string().describe('Unique dispute ID'),
    marketId: z.string().describe('Market ID this dispute relates to'),
    disputerAddress: z.string().describe('Wallet address of the disputer'),
    ipfsHash: z.string().describe('IPFS hash containing dispute evidence'),
    language: z.string().describe('Primary language of the dispute evidence'),
    aiResolution: z.object({
      primaryOutcome: z.string(),
      confidence: z.number(),
      reasoning: z.string()
    }).describe('Original AI resolution being disputed'),
    marketCloseTime: z.string().describe('When the market officially closed (ISO string)'),
    bondAmount: z.number().describe('Amount of CAST tokens staked as dispute bond')
  });

// Dispute quality evaluation prompt
const evaluateDisputeQualityPrompt = (context: Context = {}) => {
  return `
  This tool evaluates the quality and validity of disputes submitted against AI market resolutions.
  
  It performs comprehensive multi-dimensional quality analysis:
  - Evaluates source credibility of dispute evidence
  - Checks temporal relevance (evidence must predate market closure)
  - Analyzes evidence authenticity and document quality
  - Assesses language quality and consistency
  - Measures strength of contradiction to AI resolution
  - Considers disputer's historical reputation
  - Generates overall quality score and validity recommendation
  
  Parameters:
  - disputeId (string, required): Unique dispute identifier
  - marketId (string, required): Related market ID
  - disputerAddress (string, required): Disputer's wallet address
  - ipfsHash (string, required): IPFS hash of dispute evidence
  - language (string, required): Primary language of evidence
  - aiResolution (object, required): Original AI resolution being disputed
  - marketCloseTime (string, required): Market closure timestamp
  - bondAmount (number, required): Staked bond amount
  
  Returns quality metrics, validity assessment, and admin recommendations.
  `;
};

// Mock IPFS evidence fetching
const fetchIPFSEvidence = async (ipfsHash: string) => {
  // Simulate IPFS content retrieval
  const mockEvidence = {
    files: [
      {
        name: 'dispute_evidence.pdf',
        size: '2.5MB',
        type: 'application/pdf',
        content_hash: 'QmX7yR9vM3kN2pL5wQ8zF4',
        authenticity_score: 0.85
      },
      {
        name: 'supporting_document.jpg',
        size: '1.2MB', 
        type: 'image/jpeg',
        content_hash: 'QmA3bC8dE7fG9hI1jK',
        authenticity_score: 0.75
      }
    ],
    description: 'Government official statement contradicting the AI resolution with photographic evidence from official ceremony.',
    sources: ['government.go.ke', 'nation.co.ke', 'twitter.com/officialgovke'],
    timestamp: '2024-09-14T10:30:00Z',
    metadata: {
      location: 'Nairobi, Kenya',
      author: 'Citizen Journalist',
      verification_attempts: 3
    }
  };
  
  return mockEvidence;
};

// Source credibility evaluation
const evaluateSourceCredibility = async (sources: string[], language: string) => {
  const credibilityScores: { [key: string]: number } = {};
  
  sources.forEach(source => {
    let score = 0.5; // Default credibility
    
    // Government domains
    if (/\.gov\.|government\.|official/i.test(source)) {
      score = 0.95;
    }
    // Established news media
    else if (/bbc|reuters|ap|afp|nation|standard|punch|premium/i.test(source)) {
      score = 0.85;
    }
    // Academic institutions
    else if (/\.edu|university|institute/i.test(source)) {
      score = 0.8;
    }
    // General news sites
    else if (/news|media|journal|press/i.test(source)) {
      score = 0.7;
    }
    // Social media
    else if (/twitter|facebook|instagram|tiktok/i.test(source)) {
      score = 0.3;
    }
    // Personal blogs/websites
    else if (/blog|personal|individual/i.test(source)) {
      score = 0.4;
    }
    
    credibilityScores[source] = score;
  });
  
  const average = Object.values(credibilityScores).reduce((a, b) => a + b, 0) / Object.values(credibilityScores).length;
  return { scores: credibilityScores, average };
};

// Temporal relevance evaluation
const evaluateTimestamp = (evidenceTimestamp: string, marketCloseTime: string) => {
  const evidenceTime = new Date(evidenceTimestamp).getTime();
  const closeTime = new Date(marketCloseTime).getTime();
  
  if (evidenceTime < closeTime) {
    return 1.0; // Perfect temporal relevance
  } else {
    // Evidence after market close gets reduced score based on delay
    const delayHours = (evidenceTime - closeTime) / (1000 * 60 * 60);
    return Math.max(0, 1 - (delayHours / 168)); // Linear decay over 168 hours (7 days)
  }
};

// Evidence authenticity analysis
const analyzeEvidenceAuthenticity = async (files: any[]) => {
  const authenticityScores = files.map(file => {
    // Simulate document/image authenticity verification
    let score = 0.7; // Default authenticity
    
    // PDF documents get higher base authenticity
    if (file.type === 'application/pdf') {
      score = 0.8;
    }
    // Images get medium authenticity
    else if (file.type.startsWith('image/')) {
      score = 0.7;
    }
    // Video files get lower base score due to deepfake concerns
    else if (file.type.startsWith('video/')) {
      score = 0.6;
    }
    
    // Apply file-specific authenticity score if available
    if (file.authenticity_score) {
      score = (score + file.authenticity_score) / 2;
    }
    
    return { file: file.name, score };
  });
  
  const overallAuthenticity = authenticityScores.reduce((sum, item) => sum + item.score, 0) / authenticityScores.length;
  return { individual: authenticityScores, overall: overallAuthenticity };
};

// Language quality evaluation
const evaluateLanguageQuality = async (description: string, language: string) => {
  // Simple language quality metrics
  const wordCount = description.split(/\s+/).length;
  const hasProperPunctuation = /[.!?]/.test(description);
  const hasCapitalization = /[A-Z]/.test(description);
  const notAllCaps = description !== description.toUpperCase();
  
  let score = 0.5;
  
  // Word count scoring
  if (wordCount >= 50) score += 0.15;
  else if (wordCount >= 20) score += 0.1;
  
  // Grammar and punctuation
  if (hasProperPunctuation) score += 0.15;
  if (hasCapitalization && notAllCaps) score += 0.1;
  
  // Language-specific patterns
  if (language === 'en') {
    // Check for common English patterns
    if (/\b(the|and|or|but|with|for|at|by|from|to|of|in|on|is|are|was|were)\b/i.test(description)) {
      score += 0.1;
    }
  } else if (language === 'sw') {
    // Check for common Swahili patterns
    if (/\b(na|ni|ya|wa|kwa|kutoka|hadi|lakini|pia|au|kama)\b/i.test(description)) {
      score += 0.1;
    }
  } else if (language === 'fr') {
    // Check for common French patterns
    if (/\b(le|la|les|de|du|des|et|à|que|qui|pour|avec|dans|sur|par)\b/i.test(description)) {
      score += 0.1;
    }
  }
  
  return Math.min(score, 1.0);
};

// Contradiction strength evaluation
const evaluateContradiction = async (disputeEvidence: any, aiResolution: any) => {
  // Analyze how strongly the dispute evidence contradicts the AI resolution
  let contradictionStrength = 0.5; // Default
  
  // Check if dispute directly addresses AI reasoning
  const aiReasoningLower = aiResolution.reasoning.toLowerCase();
  const disputeDescLower = disputeEvidence.description.toLowerCase();
  
  // Look for direct contradictions of key terms
  const contradictoryTerms = ['false', 'incorrect', 'wrong', 'mistake', 'error', 'contradicts', 'disputes', 'refutes'];
  const hasContradictoryLanguage = contradictoryTerms.some(term => disputeDescLower.includes(term));
  
  if (hasContradictoryLanguage) {
    contradictionStrength += 0.2;
  }
  
  // Check if dispute provides alternative evidence
  const hasAlternativeEvidence = disputeEvidence.files.length > 0;
  if (hasAlternativeEvidence) {
    contradictionStrength += 0.15;
  }
  
  // Check source authority
  const hasAuthoritative = disputeEvidence.sources.some((source: string) => 
    /\.gov|government|official|parliament/i.test(source)
  );
  if (hasAuthoritative) {
    contradictionStrength += 0.15;
  }
  
  return Math.min(contradictionStrength, 1.0);
};

// Mock disputer reputation retrieval
const getDisputerReputation = async (disputerAddress: string) => {
  // Simulate reputation lookup from blockchain/database
  const mockReputation = {
    totalDisputes: 12,
    validDisputes: 8,
    invalidDisputes: 4,
    successRate: 0.67,
    averageBondAmount: 25.5,
    accountAge: 156, // days
    lastDisputeDate: '2024-09-10T15:22:00Z'
  };
  
  // Calculate reputation score (0-1)
  let score = 0.5;
  
  // Success rate component (40% weight)
  score += (mockReputation.successRate - 0.5) * 0.4;
  
  // Experience component (30% weight) - more disputes = more experience
  const experienceScore = Math.min(mockReputation.totalDisputes / 20, 1) * 0.3;
  score += experienceScore;
  
  // Account age component (20% weight) - older accounts more trusted
  const ageScore = Math.min(mockReputation.accountAge / 365, 1) * 0.2;
  score += ageScore;
  
  // Recent activity component (10% weight)
  const daysSinceLastDispute = (Date.now() - new Date(mockReputation.lastDisputeDate).getTime()) / (1000 * 60 * 60 * 24);
  const activityScore = daysSinceLastDispute < 30 ? 0.1 : daysSinceLastDispute < 90 ? 0.05 : 0;
  score += activityScore;
  
  return {
    ...mockReputation,
    reputationScore: Math.min(Math.max(score, 0), 1)
  };
};

// Calculate weighted quality score
const calculateWeightedScore = (qualityMetrics: any, weights: any) => {
  const totalWeight = Object.values(weights).reduce((sum: number, weight: number) => sum + weight, 0);
  
  let weightedSum = 0;
  for (const [metric, weight] of Object.entries(weights)) {
    weightedSum += qualityMetrics[metric] * (weight as number);
  }
  
  return weightedSum / totalWeight;
};

// Main execution function
const evaluateDisputeQualityExecute = async (
  client: Client,
  context: Context,
  params: z.infer<ReturnType<typeof evaluateDisputeQualityParameters>>
) => {
  try {
    console.log(`Starting dispute quality evaluation for dispute ${params.disputeId}`);
    
    // 1. Fetch dispute evidence from IPFS
    const disputeEvidence = await fetchIPFSEvidence(params.ipfsHash);
    
    // 2. Multi-dimensional quality analysis
    const [
      sourceCredibility,
      evidenceAuthenticity,
      disputerReputation
    ] = await Promise.all([
      evaluateSourceCredibility(disputeEvidence.sources, params.language),
      analyzeEvidenceAuthenticity(disputeEvidence.files),
      getDisputerReputation(params.disputerAddress)
    ]);
    
    const temporalRelevance = evaluateTimestamp(disputeEvidence.timestamp, params.marketCloseTime);
    const languageQuality = await evaluateLanguageQuality(disputeEvidence.description, params.language);
    const contradictionStrength = await evaluateContradiction(disputeEvidence, params.aiResolution);
    
    const qualityMetrics = {
      sourceCredibility: sourceCredibility.average,
      temporalRelevance,
      evidenceStrength: evidenceAuthenticity.overall,
      languageQuality,
      contradictionStrength,
      disputerReputation: disputerReputation.reputationScore
    };
    
    // 3. Calculate overall quality score
    const weights = {
      sourceCredibility: 0.25,
      temporalRelevance: 0.20,
      evidenceStrength: 0.25,
      contradictionStrength: 0.20,
      disputerReputation: 0.10
    };
    
    const overallQuality = calculateWeightedScore(qualityMetrics, weights);
    
    // 4. Generate recommendation
    const recommendation = {
      disputeId: params.disputeId,
      marketId: params.marketId,
      quality: overallQuality,
      validity: overallQuality > 0.6 ? 'LIKELY_VALID' : overallQuality > 0.4 ? 'UNCERTAIN' : 'LIKELY_INVALID',
      autoResolve: overallQuality > 0.85 || overallQuality < 0.2,
      adminPriority: overallQuality > 0.6 ? 'HIGH' : overallQuality > 0.4 ? 'MEDIUM' : 'LOW',
      bondRecommendation: overallQuality > 0.6 ? 'RETURN_WITH_REWARD' : overallQuality > 0.4 ? 'RETURN_ONLY' : 'SLASH',
      detailedAnalysis: {
        ...qualityMetrics,
        sourceDetails: sourceCredibility.scores,
        evidenceFiles: evidenceAuthenticity.individual,
        disputerStats: disputerReputation
      },
      reasoning: [
        `Source credibility: ${(qualityMetrics.sourceCredibility * 100).toFixed(0)}% (${disputeEvidence.sources.length} sources)`,
        `Temporal relevance: ${(qualityMetrics.temporalRelevance * 100).toFixed(0)}% (evidence ${temporalRelevance === 1 ? 'predates' : 'postdates'} market closure)`,
        `Evidence authenticity: ${(qualityMetrics.evidenceStrength * 100).toFixed(0)}% (${disputeEvidence.files.length} files analyzed)`,
        `Language quality: ${(qualityMetrics.languageQuality * 100).toFixed(0)}% (${params.language} analysis)`,
        `Contradiction strength: ${(qualityMetrics.contradictionStrength * 100).toFixed(0)}% vs AI resolution`,
        `Disputer reputation: ${(qualityMetrics.disputerReputation * 100).toFixed(0)}% (${disputerReputation.successRate * 100}% success rate)`
      ],
      timestamp: new Date().toISOString(),
      metadata: {
        bondAmount: params.bondAmount,
        evaluationVersion: 'BlockCast-DisputeEval-v2.0',
        ipfsHash: params.ipfsHash
      }
    };
    
    console.log(`Dispute quality evaluation complete for ${params.disputeId}:`, {
      quality: recommendation.quality.toFixed(3),
      validity: recommendation.validity,
      priority: recommendation.adminPriority,
      bondAction: recommendation.bondRecommendation
    });
    
    return recommendation;
    
  } catch (error) {
    console.error('Dispute quality evaluation failed:', error);
    if (error instanceof Error) {
      return {
        error: error.message,
        disputeId: params.disputeId,
        timestamp: new Date().toISOString()
      };
    }
    return {
      error: 'Dispute quality evaluation failed',
      disputeId: params.disputeId,
      timestamp: new Date().toISOString()
    };
  }
};

export const EVALUATE_DISPUTE_QUALITY = 'evaluate_dispute_quality';

const tool = (context: Context): Tool => ({
  method: EVALUATE_DISPUTE_QUALITY,
  name: 'Evaluate Dispute Quality',
  description: evaluateDisputeQualityPrompt(context),
  parameters: evaluateDisputeQualityParameters(context),
  execute: evaluateDisputeQualityExecute,
});

export default tool;