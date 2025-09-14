import { z } from 'zod';
import { Context, Tool } from 'hedera-agent-kit';
import { Client, TopicMessageQuery } from '@hashgraph/sdk';

// Define parameter schema for multi-language evidence analysis
const analyzeMultiLangEvidenceParameters = (context: Context = {}) =>
  z.object({
    marketId: z.string().describe('Market ID to analyze evidence for'),
    languages: z.array(z.string()).describe('Languages to process: ["en", "fr", "sw", "ar"]'),
    evidenceTopics: z.array(z.string()).describe('HCS topic IDs containing evidence'),
    culturalContext: z.string().optional().describe('Regional context (e.g., "Kenya", "Morocco", "Nigeria")'),
    timeWindowStart: z.string().optional().describe('Start time for evidence collection (ISO string)'),
    timeWindowEnd: z.string().optional().describe('End time for evidence collection (ISO string)')
  });

// Cultural context configurations for African markets
const culturalConfigurations = {
  kenya: {
    sources: ['Nation', 'Standard', 'KBC', 'Parliament.go.ke', 'Citizen Digital'],
    languages: ['en', 'sw'],
    politicalContext: 'Parliamentary system, county governments, tribal considerations',
    timeZone: 'Africa/Nairobi',
    governmentDomains: ['go.ke', 'parliament.go.ke']
  },
  morocco: {
    sources: ['MAP', '2M', 'Le Matin', 'Government.ma', 'Hespress'],
    languages: ['ar', 'fr'],
    culturalContext: 'Islamic calendar, Berber traditions, monarchical system',
    timeZone: 'Africa/Casablanca',
    governmentDomains: ['gov.ma', 'government.ma']
  },
  nigeria: {
    sources: ['Premium Times', 'Punch', 'ThisDay', 'NAN', 'Channels TV'],
    languages: ['en', 'ha', 'yo', 'ig'],
    regionalDynamics: 'Federal system, ethnic considerations, religious diversity',
    timeZone: 'Africa/Lagos',
    governmentDomains: ['gov.ng', 'nass.gov.ng']
  },
  ghana: {
    sources: ['GNA', 'Daily Graphic', 'Joy News', 'Citi FM'],
    languages: ['en'],
    politicalContext: 'Multi-party democracy, chieftaincy system',
    timeZone: 'Africa/Accra',
    governmentDomains: ['gov.gh', 'parliament.gh']
  }
};

// Multi-language evidence analysis prompt
const analyzeMultiLangEvidencePrompt = (context: Context = {}) => {
  return `
  This tool analyzes evidence submitted to BlockCast markets across multiple African languages.
  
  It performs comprehensive multi-language evidence synthesis:
  - Processes evidence in English, French, Swahili, and Arabic
  - Evaluates source credibility with regional context
  - Performs cross-language correlation analysis
  - Considers cultural and political factors
  - Generates confidence scoring for each language
  
  Parameters:
  - marketId (string, required): The market to analyze evidence for
  - languages (array, required): Languages to process ["en", "fr", "sw", "ar"]
  - evidenceTopics (array, required): HCS topic IDs containing evidence submissions
  - culturalContext (string, optional): Regional context for cultural understanding
  - timeWindowStart (string, optional): Start time for evidence collection
  - timeWindowEnd (string, optional): End time for evidence collection
  
  Returns comprehensive analysis including confidence scores, contradictions, and cultural considerations.
  `;
};

// Helper function to filter evidence by language
const filterEvidenceByLanguage = (evidence: any[], language: string) => {
  return evidence.filter(item => {
    const content = item.contents?.toString() || item.message || '';
    const metadata = item.metadata || {};
    
    // Simple language detection based on common patterns
    if (language === 'en') {
      return /^[a-zA-Z\s.,!?'"()-]+$/.test(content) && 
             !/(le|la|les|de|du|des|et|à|que|qui|pour)/i.test(content) &&
             !/(na|ni|ya|wa|kwa|kutoka|hadi)/i.test(content) &&
             !/(في|من|إلى|على|هذا|ذلك)/i.test(content);
    }
    if (language === 'fr') {
      return /(le|la|les|de|du|des|et|à|que|qui|pour|avec|dans|sur|par|ce|cette|ces|un|une)/i.test(content);
    }
    if (language === 'sw') {
      return /(na|ni|ya|wa|kwa|kutoka|hadi|lakini|pia|au|kama|hivyo|sana|kabisa)/i.test(content);
    }
    if (language === 'ar') {
      return /(في|من|إلى|على|هذا|ذلك|التي|الذي|وقد|كان|كانت|يكون|تكون)/i.test(content);
    }
    
    return metadata.language === language;
  });
};

// Source credibility evaluation
const evaluateSourceCredibility = async (sources: string[], language: string, region?: string) => {
  const credibilityScores: { [key: string]: number } = {};
  const regionalConfig = region ? culturalConfigurations[region.toLowerCase()] : null;
  
  sources.forEach(source => {
    let score = 0.5; // Default credibility
    
    // Government sources get highest credibility
    if (regionalConfig?.governmentDomains.some(domain => source.includes(domain))) {
      score = 0.95;
    }
    // Established media gets high credibility
    else if (regionalConfig?.sources.some(trusted => source.toLowerCase().includes(trusted.toLowerCase()))) {
      score = 0.85;
    }
    // Social media gets lower credibility
    else if (/twitter|facebook|instagram|tiktok/i.test(source)) {
      score = 0.3;
    }
    // News domains get moderate credibility
    else if (/news|media|press|journal/i.test(source)) {
      score = 0.7;
    }
    
    credibilityScores[source] = score;
  });
  
  const average = Object.values(credibilityScores).reduce((a, b) => a + b, 0) / Object.values(credibilityScores).length;
  return { scores: credibilityScores, average };
};

// Cross-language correlation analysis
const crossLanguageCorrelation = async (analysisResults: any[]) => {
  const outcomes = analysisResults.map(result => ({
    language: result.language,
    supportingCount: result.supportingEvidence.length,
    opposingCount: result.opposingEvidence.length,
    credibility: result.credibilityScore,
    sentiment: result.sentiment
  }));
  
  // Calculate weighted consensus
  const totalWeight = outcomes.reduce((sum, outcome) => 
    sum + (outcome.supportingCount + outcome.opposingCount) * outcome.credibility, 0);
  
  const supportingWeight = outcomes.reduce((sum, outcome) => 
    sum + outcome.supportingCount * outcome.credibility, 0);
  
  const opposingWeight = outcomes.reduce((sum, outcome) => 
    sum + outcome.opposingCount * outcome.credibility, 0);
  
  const consensusOutcome = supportingWeight > opposingWeight ? 'YES' : 'NO';
  const confidenceScore = Math.abs(supportingWeight - opposingWeight) / totalWeight;
  
  // Detect contradictions across languages
  const contradictions = [];
  for (let i = 0; i < outcomes.length; i++) {
    for (let j = i + 1; j < outcomes.length; j++) {
      const result1 = outcomes[i];
      const result2 = outcomes[j];
      
      const sentiment1 = result1.supportingCount > result1.opposingCount ? 'positive' : 'negative';
      const sentiment2 = result2.supportingCount > result2.opposingCount ? 'positive' : 'negative';
      
      if (sentiment1 !== sentiment2) {
        contradictions.push({
          languages: [result1.language, result2.language],
          description: `${result1.language} evidence suggests ${sentiment1} outcome while ${result2.language} evidence suggests ${sentiment2} outcome`
        });
      }
    }
  }
  
  return {
    consensus_outcome: consensusOutcome,
    weighted_confidence: Math.min(confidenceScore, 1.0),
    contradictions,
    language_breakdown: outcomes,
    cultural_considerations: analysisResults
      .filter(result => result.culturalFactors)
      .map(result => ({ language: result.language, factors: result.culturalFactors }))
  };
};

// Main execution function
const analyzeMultiLangEvidenceExecute = async (
  client: Client,
  context: Context,
  params: z.infer<ReturnType<typeof analyzeMultiLangEvidenceParameters>>
) => {
  try {
    console.log(`Starting multi-language evidence analysis for market ${params.marketId}`);
    
    // 1. Query HCS topics for evidence submissions
    const allEvidence: any[] = [];
    
    for (const topicId of params.evidenceTopics) {
      try {
        const query = new TopicMessageQuery().setTopicId(topicId);
        
        if (params.timeWindowStart) {
          query.setStartTime(new Date(params.timeWindowStart));
        }
        if (params.timeWindowEnd) {
          query.setEndTime(new Date(params.timeWindowEnd));
        }
        
        // For now, simulate evidence retrieval (in production, execute the query)
        // const messages = await query.execute(client);
        
        // Mock evidence for development
        const mockEvidence = [
          {
            contents: `Breaking: Market ${params.marketId} evidence in English - Government confirms policy change effective immediately.`,
            timestamp: new Date(),
            source: 'government.go.ke',
            supports_outcome: true
          },
          {
            contents: `Habari za uchaguzi: Serikali imethibitisha mabadiliko ya sera ya haraka.`,
            timestamp: new Date(),
            source: 'nation.co.ke',
            supports_outcome: true
          },
          {
            contents: `Nouvelles élections: Le gouvernement confirme les changements de politique.`,
            timestamp: new Date(),
            source: 'government.ma',
            supports_outcome: false
          }
        ];
        
        allEvidence.push(...mockEvidence);
        
      } catch (error) {
        console.warn(`Failed to query topic ${topicId}:`, error);
      }
    }
    
    // 2. Process each language separately
    const analysisResults = await Promise.all(
      params.languages.map(async (lang) => {
        const langEvidence = filterEvidenceByLanguage(allEvidence, lang);
        
        // Simple NLP analysis simulation
        const nlpAnalysis = {
          sentiment: langEvidence.filter(e => e.supports_outcome).length > langEvidence.filter(e => !e.supports_outcome).length ? 'positive' : 'negative',
          contradictions: langEvidence.filter(e => e.supports_outcome).length > 0 && langEvidence.filter(e => !e.supports_outcome).length > 0
        };
        
        // Source credibility evaluation
        const sources = langEvidence.map(e => e.source);
        const sourceCredibility = await evaluateSourceCredibility(sources, lang, params.culturalContext);
        
        return {
          language: lang,
          evidenceCount: langEvidence.length,
          sentiment: nlpAnalysis.sentiment,
          credibilityScore: sourceCredibility.average,
          contradictions: nlpAnalysis.contradictions,
          supportingEvidence: langEvidence.filter(e => e.supports_outcome),
          opposingEvidence: langEvidence.filter(e => !e.supports_outcome),
          sources: sources,
          culturalFactors: params.culturalContext ? culturalConfigurations[params.culturalContext?.toLowerCase()] : null
        };
      })
    );
    
    // 3. Cross-language synthesis
    const synthesis = await crossLanguageCorrelation(analysisResults);
    
    const result = {
      marketId: params.marketId,
      analysisResults,
      synthesis,
      recommendedOutcome: synthesis.consensus_outcome,
      confidenceScore: synthesis.weighted_confidence,
      culturalFactors: synthesis.cultural_considerations,
      timestamp: new Date().toISOString(),
      totalEvidenceCount: allEvidence.length,
      languagesAnalyzed: params.languages
    };
    
    console.log(`Multi-language analysis complete for market ${params.marketId}:`, {
      outcome: result.recommendedOutcome,
      confidence: result.confidenceScore,
      evidenceCount: result.totalEvidenceCount
    });
    
    return result;
    
  } catch (error) {
    console.error('Multi-language evidence analysis failed:', error);
    if (error instanceof Error) {
      return { error: error.message, marketId: params.marketId };
    }
    return { error: 'Multi-language evidence analysis failed', marketId: params.marketId };
  }
};

export const ANALYZE_MULTILANG_EVIDENCE = 'analyze_multilang_evidence';

const tool = (context: Context): Tool => ({
  method: ANALYZE_MULTILANG_EVIDENCE,
  name: 'Analyze Multi-Language Evidence',
  description: analyzeMultiLangEvidencePrompt(context),
  parameters: analyzeMultiLangEvidenceParameters(context),
  execute: analyzeMultiLangEvidenceExecute,
});

export default tool;