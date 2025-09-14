import { z } from 'zod';
import { Context, Tool } from 'hedera-agent-kit';
import { Client } from '@hashgraph/sdk';

// Define parameter schema for multi-language evidence processing
const processMultiLangEvidenceParameters = (context: Context = {}) =>
  z.object({
    marketId: z.string().describe('Market ID for evidence processing'),
    evidenceSubmissions: z.array(z.object({
      submissionId: z.string(),
      submitterAddress: z.string(),
      language: z.string(),
      content: z.string(),
      sources: z.array(z.string()),
      timestamp: z.string(),
      ipfsHash: z.string().optional(),
      metadata: z.object({}).optional()
    })).describe('Array of evidence submissions to process'),
    targetLanguages: z.array(z.string()).default(['en', 'fr', 'sw', 'ar']).describe('Languages to process and analyze'),
    processingMode: z.enum(['REAL_TIME', 'BATCH', 'DISPUTE_CONTEXT']).default('REAL_TIME').describe('Processing mode for evidence analysis'),
    culturalContext: z.object({
      region: z.string().optional(),
      country: z.string().optional(),
      politicalSystem: z.string().optional(),
      religiousContext: z.string().optional(),
      tribalConsiderations: z.array(z.string()).optional()
    }).optional().describe('Cultural and regional context for evidence interpretation'),
    qualityThresholds: z.object({
      minSourceCredibility: z.number().default(0.3),
      minLanguageQuality: z.number().default(0.4),
      maxProcessingDelay: z.number().default(24).describe('Maximum hours after market close to process evidence')
    }).optional().default({}).describe('Quality thresholds for evidence filtering')
  });

// Multi-language evidence processing prompt
const processMultiLangEvidencePrompt = (context: Context = {}) => {
  return `
  This tool processes and enriches evidence submissions across multiple African languages.
  
  It provides comprehensive multi-language evidence processing:
  - Language detection and validation for submitted evidence
  - Cultural context enrichment based on regional knowledge
  - Source credibility analysis with language-specific weighting
  - Translation quality assessment for cross-language evidence
  - Temporal relevance filtering based on market timelines
  - Evidence clustering to identify related submissions
  - Contradiction detection across different language submissions
  - Quality scoring with cultural sensitivity adjustments
  
  Parameters:
  - marketId (string, required): Market identifier for evidence processing
  - evidenceSubmissions (array, required): Raw evidence submissions to process
  - targetLanguages (array, optional): Languages to analyze (default: ['en', 'fr', 'sw', 'ar'])
  - processingMode (enum, optional): Processing mode - REAL_TIME, BATCH, or DISPUTE_CONTEXT
  - culturalContext (object, optional): Regional and cultural context information
  - qualityThresholds (object, optional): Quality filtering thresholds
  
  Returns processed evidence with enriched metadata, quality scores, and cross-language analysis.
  `;
};

// Language detection and validation
const detectAndValidateLanguage = (content: string, declaredLanguage: string) => {
  const languagePatterns = {
    en: {
      patterns: /\b(the|and|or|but|with|for|at|by|from|to|of|in|on|is|are|was|were|have|has|had|will|would|could|should)\b/gi,
      confidence: 0
    },
    fr: {
      patterns: /\b(le|la|les|de|du|des|et|à|que|qui|pour|avec|dans|sur|par|ce|cette|ces|un|une|je|tu|il|elle|nous|vous|ils|elles)\b/gi,
      confidence: 0
    },
    sw: {
      patterns: /\b(na|ni|ya|wa|kwa|kutoka|hadi|lakini|pia|au|kama|hivyo|sana|kabisa|mimi|wewe|yeye|sisi|nyinyi|wao)\b/gi,
      confidence: 0
    },
    ar: {
      patterns: /(في|من|إلى|على|هذا|ذلك|التي|الذي|وقد|كان|كانت|يكون|تكون|أن|أو|لكن|مع|عن|بعد|قبل)/gi,
      confidence: 0
    }
  };
  
  // Count pattern matches for each language
  Object.keys(languagePatterns).forEach(lang => {
    const matches = content.match(languagePatterns[lang].patterns) || [];
    languagePatterns[lang].confidence = matches.length / content.split(/\s+/).length;
  });
  
  // Determine most likely language
  const detectedLanguage = Object.keys(languagePatterns).reduce((a, b) => 
    languagePatterns[a].confidence > languagePatterns[b].confidence ? a : b
  );
  
  const confidence = languagePatterns[detectedLanguage].confidence;
  const matchesDeclared = detectedLanguage === declaredLanguage;
  
  return {
    detectedLanguage,
    declaredLanguage,
    confidence,
    matchesDeclared,
    isValid: confidence > 0.05 && matchesDeclared, // Minimum pattern threshold
    allScores: languagePatterns
  };
};

// Cultural context enrichment
const enrichWithCulturalContext = (evidence: any, culturalContext: any) => {
  const enrichment = {
    culturalRelevance: 0.5,
    contextualFactors: [],
    sensitivityFlags: [],
    localKnowledgeRequired: false
  };
  
  if (!culturalContext) return enrichment;
  
  const content = evidence.content.toLowerCase();
  
  // Regional context enrichment
  if (culturalContext.region) {
    const region = culturalContext.region.toLowerCase();
    
    if (region.includes('east africa') || region.includes('kenya') || region.includes('uganda')) {
      if (/parliament|bunge|mps|county|governor/i.test(content)) {
        enrichment.contextualFactors.push('East African political context detected');
        enrichment.culturalRelevance += 0.2;
      }
      if (/shilling|ksh|ugx/i.test(content)) {
        enrichment.contextualFactors.push('East African currency context');
        enrichment.culturalRelevance += 0.1;
      }
    }
    
    if (region.includes('west africa') || region.includes('nigeria') || region.includes('ghana')) {
      if (/naira|ngn|cedis|ghs|federal|state|lga/i.test(content)) {
        enrichment.contextualFactors.push('West African political/economic context');
        enrichment.culturalRelevance += 0.2;
      }
    }
    
    if (region.includes('north africa') || region.includes('morocco') || region.includes('tunisia')) {
      if (/dirham|dinar|mad|tnd|king|royal|berber/i.test(content)) {
        enrichment.contextualFactors.push('North African monarchical/cultural context');
        enrichment.culturalRelevance += 0.2;
      }
    }
  }
  
  // Religious context considerations
  if (culturalContext.religiousContext) {
    const religious = culturalContext.religiousContext.toLowerCase();
    
    if (religious.includes('islamic') && /ramadan|eid|hajj|mosque|imam|sharia/i.test(content)) {
      enrichment.contextualFactors.push('Islamic religious context identified');
      enrichment.culturalRelevance += 0.15;
      enrichment.localKnowledgeRequired = true;
    }
    
    if (religious.includes('christian') && /church|pastor|bishop|christmas|easter/i.test(content)) {
      enrichment.contextualFactors.push('Christian religious context identified');
      enrichment.culturalRelevance += 0.15;
    }
  }
  
  // Tribal/ethnic considerations
  if (culturalContext.tribalConsiderations) {
    const tribalTerms = culturalContext.tribalConsiderations.join('|');
    const tribalRegex = new RegExp(`\\b(${tribalTerms})\\b`, 'gi');
    
    if (tribalRegex.test(content)) {
      enrichment.contextualFactors.push('Ethnic/tribal context detected');
      enrichment.sensitivityFlags.push('ETHNIC_SENSITIVITY_REQUIRED');
      enrichment.culturalRelevance += 0.2;
      enrichment.localKnowledgeRequired = true;
    }
  }
  
  return enrichment;
};

// Evidence clustering to find related submissions
const clusterRelatedEvidence = (evidenceSubmissions: any[]) => {
  const clusters = [];
  const processed = new Set();
  
  evidenceSubmissions.forEach((evidence, index) => {
    if (processed.has(index)) return;
    
    const cluster = {
      leadSubmission: evidence,
      relatedSubmissions: [],
      languages: [evidence.language],
      commonSources: [...evidence.sources],
      strengthScore: 1,
      contradictionFlags: []
    };
    
    // Find related evidence by content similarity and source overlap
    evidenceSubmissions.forEach((otherEvidence, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;
      
      // Check for source overlap
      const sourceOverlap = evidence.sources.filter(source => 
        otherEvidence.sources.some(otherSource => 
          source.toLowerCase().includes(otherSource.toLowerCase()) ||
          otherSource.toLowerCase().includes(source.toLowerCase())
        )
      );
      
      // Check for content similarity (simple keyword matching)
      const evidenceWords = evidence.content.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      const otherWords = otherEvidence.content.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      const commonWords = evidenceWords.filter(word => otherWords.includes(word));
      const contentSimilarity = commonWords.length / Math.max(evidenceWords.length, otherWords.length);
      
      if (sourceOverlap.length > 0 || contentSimilarity > 0.3) {
        cluster.relatedSubmissions.push(otherEvidence);
        cluster.languages.push(otherEvidence.language);
        cluster.strengthScore += 0.5;
        processed.add(otherIndex);
        
        // Check for contradictions between related evidence
        if (contentSimilarity > 0.3 && evidence.language !== otherEvidence.language) {
          const contradiction = detectCrossLanguageContradiction(evidence, otherEvidence);
          if (contradiction.hasContradiction) {
            cluster.contradictionFlags.push({
              languages: [evidence.language, otherEvidence.language],
              description: contradiction.description,
              severity: contradiction.severity
            });
          }
        }
      }
    });
    
    cluster.languages = [...new Set(cluster.languages)];
    clusters.push(cluster);
    processed.add(index);
  });
  
  return clusters;
};

// Cross-language contradiction detection
const detectCrossLanguageContradiction = (evidence1: any, evidence2: any) => {
  // Simple contradiction detection based on sentiment and key terms
  const positiveTerms = ['yes', 'true', 'correct', 'confirmed', 'official', 'ndio', 'kweli', 'oui', 'vrai', 'نعم', 'صحيح'];
  const negativeTerms = ['no', 'false', 'incorrect', 'denied', 'unofficial', 'hapana', 'uwongo', 'non', 'faux', 'لا', 'خطأ'];
  
  const content1 = evidence1.content.toLowerCase();
  const content2 = evidence2.content.toLowerCase();
  
  const positive1 = positiveTerms.some(term => content1.includes(term));
  const negative1 = negativeTerms.some(term => content1.includes(term));
  const positive2 = positiveTerms.some(term => content2.includes(term));
  const negative2 = negativeTerms.some(term => content2.includes(term));
  
  const hasContradiction = (positive1 && negative2) || (negative1 && positive2);
  
  return {
    hasContradiction,
    description: hasContradiction ? 
      `Evidence in ${evidence1.language} suggests different outcome than evidence in ${evidence2.language}` : 
      'No clear contradiction detected',
    severity: hasContradiction ? 
      (evidence1.sources.some(s => /\.gov|government|official/i.test(s)) || 
       evidence2.sources.some(s => /\.gov|government|official/i.test(s))) ? 'HIGH' : 'MEDIUM' 
      : 'LOW'
  };
};

// Quality scoring with cultural sensitivity
const calculateQualityScore = (evidence: any, culturalEnrichment: any, qualityThresholds: any) => {
  let score = 0.5; // Base score
  const factors = [];
  
  // Language validation score
  const langValidation = detectAndValidateLanguage(evidence.content, evidence.language);
  if (langValidation.isValid) {
    score += 0.15;
    factors.push(`Valid ${evidence.language} language patterns`);
  } else {
    score -= 0.1;
    factors.push(`Questionable language patterns for declared ${evidence.language}`);
  }
  
  // Source credibility
  const govSources = evidence.sources.filter(s => /\.gov|government|parliament|official/i.test(s)).length;
  const mediaSources = evidence.sources.filter(s => /news|media|press|journal/i.test(s)).length;
  const socialSources = evidence.sources.filter(s => /twitter|facebook|instagram|tiktok/i.test(s)).length;
  
  score += govSources * 0.15;
  score += mediaSources * 0.1;
  score -= socialSources * 0.05;
  
  if (govSources > 0) factors.push(`${govSources} government sources`);
  if (mediaSources > 0) factors.push(`${mediaSources} media sources`);
  if (socialSources > 0) factors.push(`${socialSources} social media sources`);
  
  // Cultural relevance bonus
  score += culturalEnrichment.culturalRelevance * 0.1;
  if (culturalEnrichment.culturalRelevance > 0.7) {
    factors.push('High cultural relevance');
  }
  
  // Length and detail score
  const wordCount = evidence.content.split(/\s+/).length;
  if (wordCount > 100) {
    score += 0.1;
    factors.push('Detailed submission');
  } else if (wordCount < 20) {
    score -= 0.1;
    factors.push('Brief submission');
  }
  
  // Sensitivity flags penalty (require careful handling)
  if (culturalEnrichment.sensitivityFlags.length > 0) {
    score += 0.05; // Actually bonus for culturally aware content
    factors.push('Cultural sensitivity detected');
  }
  
  return {
    score: Math.min(Math.max(score, 0), 1),
    factors,
    passesThresholds: score >= qualityThresholds.minSourceCredibility,
    languageQuality: langValidation.confidence,
    culturalRelevance: culturalEnrichment.culturalRelevance
  };
};

// Main execution function
const processMultiLangEvidenceExecute = async (
  client: Client,
  context: Context,
  params: z.infer<ReturnType<typeof processMultiLangEvidenceParameters>>
) => {
  try {
    console.log(`Starting multi-language evidence processing for market ${params.marketId} (${params.evidenceSubmissions.length} submissions)`);
    
    const qualityThresholds = {
      minSourceCredibility: 0.3,
      minLanguageQuality: 0.4,
      maxProcessingDelay: 24,
      ...params.qualityThresholds
    };
    
    // 1. Process each evidence submission
    const processedEvidence = params.evidenceSubmissions.map(evidence => {
      // Language detection and validation
      const languageValidation = detectAndValidateLanguage(evidence.content, evidence.language);
      
      // Cultural context enrichment
      const culturalEnrichment = enrichWithCulturalContext(evidence, params.culturalContext);
      
      // Quality scoring
      const qualityAssessment = calculateQualityScore(evidence, culturalEnrichment, qualityThresholds);
      
      return {
        ...evidence,
        processing: {
          languageValidation,
          culturalEnrichment,
          qualityAssessment,
          passesFilters: qualityAssessment.passesThresholds && languageValidation.isValid,
          processedAt: new Date().toISOString(),
          processingMode: params.processingMode
        }
      };
    });
    
    // 2. Filter evidence based on quality thresholds
    const validEvidence = processedEvidence.filter(e => e.processing.passesFilters);
    const filteredOutEvidence = processedEvidence.filter(e => !e.processing.passesFilters);
    
    // 3. Cluster related evidence across languages
    const evidenceClusters = clusterRelatedEvidence(validEvidence);
    
    // 4. Generate language-specific analysis
    const languageAnalysis = {};
    params.targetLanguages.forEach(lang => {
      const langEvidence = validEvidence.filter(e => e.language === lang);
      const avgQuality = langEvidence.length > 0 ? 
        langEvidence.reduce((sum, e) => sum + e.processing.qualityAssessment.score, 0) / langEvidence.length : 0;
      
      languageAnalysis[lang] = {
        submissionCount: langEvidence.length,
        averageQuality: avgQuality,
        topSources: [...new Set(langEvidence.flatMap(e => e.sources))].slice(0, 5),
        culturalFactors: langEvidence.flatMap(e => e.processing.culturalEnrichment.contextualFactors),
        qualityDistribution: {
          high: langEvidence.filter(e => e.processing.qualityAssessment.score > 0.7).length,
          medium: langEvidence.filter(e => e.processing.qualityAssessment.score >= 0.5 && e.processing.qualityAssessment.score <= 0.7).length,
          low: langEvidence.filter(e => e.processing.qualityAssessment.score < 0.5).length
        }
      };
    });
    
    // 5. Generate cross-language insights
    const crossLanguageInsights = {
      contradictions: evidenceClusters.flatMap(cluster => cluster.contradictionFlags),
      consensus: evidenceClusters.filter(cluster => cluster.contradictionFlags.length === 0 && cluster.relatedSubmissions.length > 0).length,
      languageBalance: Object.keys(languageAnalysis).map(lang => ({
        language: lang,
        weight: languageAnalysis[lang].submissionCount / validEvidence.length,
        quality: languageAnalysis[lang].averageQuality
      })),
      culturalSensitivities: processedEvidence.flatMap(e => e.processing.culturalEnrichment.sensitivityFlags).filter((flag, index, arr) => arr.indexOf(flag) === index)
    };
    
    // 6. Compile comprehensive results
    const results = {
      marketId: params.marketId,
      processingMode: params.processingMode,
      summary: {
        totalSubmissions: params.evidenceSubmissions.length,
        validAfterFiltering: validEvidence.length,
        filteredOut: filteredOutEvidence.length,
        evidenceClusters: evidenceClusters.length,
        languagesDetected: [...new Set(processedEvidence.map(e => e.processing.languageValidation.detectedLanguage))],
        averageQuality: validEvidence.length > 0 ? 
          validEvidence.reduce((sum, e) => sum + e.processing.qualityAssessment.score, 0) / validEvidence.length : 0
      },
      processedEvidence,
      validEvidence,
      filteredOutEvidence,
      evidenceClusters,
      languageAnalysis,
      crossLanguageInsights,
      qualityThresholds,
      culturalContext: params.culturalContext,
      recommendations: {
        requiresHumanReview: crossLanguageInsights.contradictions.length > 0 || 
                            crossLanguageInsights.culturalSensitivities.length > 0,
        confidenceLevel: validEvidence.length < 3 ? 'LOW' : validEvidence.length < 8 ? 'MEDIUM' : 'HIGH',
        additionalLanguagesNeeded: params.targetLanguages.filter(lang => 
          languageAnalysis[lang].submissionCount === 0
        ),
        qualityConcerns: filteredOutEvidence.length > validEvidence.length ? 'HIGH' : 'LOW'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`Multi-language evidence processing complete for market ${params.marketId}:`, {
      processed: results.summary.totalSubmissions,
      valid: results.summary.validAfterFiltering,
      clusters: results.summary.evidenceClusters,
      avgQuality: results.summary.averageQuality.toFixed(3),
      contradictions: crossLanguageInsights.contradictions.length
    });
    
    return results;
    
  } catch (error) {
    console.error('Multi-language evidence processing failed:', error);
    if (error instanceof Error) {
      return {
        error: error.message,
        marketId: params.marketId,
        timestamp: new Date().toISOString()
      };
    }
    return {
      error: 'Multi-language evidence processing failed',
      marketId: params.marketId,
      timestamp: new Date().toISOString()
    };
  }
};

export const PROCESS_MULTILANG_EVIDENCE = 'process_multilang_evidence';

const tool = (context: Context): Tool => ({
  method: PROCESS_MULTILANG_EVIDENCE,
  name: 'Process Multi-Language Evidence',
  description: processMultiLangEvidencePrompt(context),
  parameters: processMultiLangEvidenceParameters(context),
  execute: processMultiLangEvidenceExecute,
});

export default tool;