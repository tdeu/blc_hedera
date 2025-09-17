import { AnthropicClient } from './anthropicClient';
import { ScrapedContent } from './webScrapingService';

export interface AIAnalysisResult {
  recommendation: 'YES' | 'NO' | 'INCONCLUSIVE';
  confidence: number; // 0-1 scale
  reasoning: string;
  keyFactors: string[];
  sourceAnalysis: {
    [sourceName: string]: {
      position: 'YES' | 'NO' | 'NEUTRAL';
      confidence: number;
      summary: string;
    };
  };
  processingTimeMs: number;
}

export class AIAnalysisService {
  private anthropicClient: AnthropicClient;

  constructor() {
    this.anthropicClient = new AnthropicClient();
  }

  /**
   * Analyze scraped content and generate Y/N recommendation
   */
  async analyzeContent(
    marketQuestion: string,
    scrapedContent: ScrapedContent[]
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      console.log(`🤖 Analyzing ${scrapedContent.length} pieces of content for: "${marketQuestion}"`);

      if (scrapedContent.length === 0) {
        return {
          recommendation: 'INCONCLUSIVE',
          confidence: 0,
          reasoning: 'No external content found to analyze.',
          keyFactors: [],
          sourceAnalysis: {},
          processingTimeMs: Date.now() - startTime
        };
      }

      // Create comprehensive analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(marketQuestion, scrapedContent);

      // Get AI analysis
      const aiResponse = await this.anthropicClient.generateAnalysis(analysisPrompt);

      // Parse the AI response
      const analysisResult = this.parseAIResponse(aiResponse, scrapedContent, startTime);

      console.log(`✅ AI analysis complete: ${analysisResult.recommendation} (${(analysisResult.confidence * 100).toFixed(0)}% confidence)`);

      return analysisResult;

    } catch (error) {
      console.error('❌ Error during AI analysis:', error);

      return {
        recommendation: 'INCONCLUSIVE',
        confidence: 0,
        reasoning: `Analysis failed due to error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        keyFactors: ['Technical error during analysis'],
        sourceAnalysis: {},
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Build comprehensive prompt for AI analysis
   */
  private buildAnalysisPrompt(marketQuestion: string, scrapedContent: ScrapedContent[]): string {
    const contentSummary = scrapedContent.map((content, index) => {
      return `## Source ${index + 1}: ${content.source}
**URL**: ${content.url}
**Title**: ${content.title}
**Content**: ${content.content}
**Relevance Score**: ${(content.relevanceScore || 0 * 100).toFixed(0)}%
`;
    }).join('\n\n');

    const sourcesUsed = [...new Set(scrapedContent.map(c => c.source))].join(', ');

    return `You are an expert fact-checker analyzing news content to answer a specific market prediction question.

**MARKET QUESTION**: "${marketQuestion}"

**YOUR TASK**:
Analyze the following content from trusted news sources and provide a definitive YES or NO answer to the market question.

**ANALYSIS CRITERIA**:
1. Focus only on factual, verifiable information
2. Weight sources by credibility (BBC, Reuters = very high; others = high)
3. Look for direct evidence that supports or contradicts the market question
4. Consider recency of information
5. Identify any contradictions between sources

**CONTENT TO ANALYZE**:
Sources: ${sourcesUsed}

${contentSummary}

**REQUIRED OUTPUT FORMAT** (respond exactly in this format):

RECOMMENDATION: [YES/NO/INCONCLUSIVE]
CONFIDENCE: [number between 0.0 and 1.0]
REASONING: [2-3 sentences explaining your decision based on the evidence]

KEY_FACTORS:
- [Most important supporting fact 1]
- [Most important supporting fact 2]
- [Most important supporting fact 3]

SOURCE_ANALYSIS:
${scrapedContent.map(content =>
`${content.source}: [YES/NO/NEUTRAL] - [Brief summary of this source's position]`
).join('\n')}

**IMPORTANT GUIDELINES**:
- Only answer YES if there is clear, recent evidence supporting the market question
- Only answer NO if there is clear, recent evidence contradicting the market question
- Answer INCONCLUSIVE if evidence is mixed, outdated, or insufficient
- Base confidence on strength and consistency of evidence across sources
- Be conservative with confidence scores - prefer lower confidence when uncertain`;
  }

  /**
   * Parse AI response into structured result
   */
  private parseAIResponse(aiResponse: any, scrapedContent: ScrapedContent[], startTime: number): AIAnalysisResult {
    try {
      // Extract the raw response text
      const responseText = aiResponse.rawResponse || aiResponse.content || aiResponse.toString();

      // Parse recommendation
      const recommendationMatch = responseText.match(/RECOMMENDATION:\s*(YES|NO|INCONCLUSIVE)/i);
      const recommendation = (recommendationMatch?.[1]?.toUpperCase() as 'YES' | 'NO' | 'INCONCLUSIVE') || 'INCONCLUSIVE';

      // Parse confidence
      const confidenceMatch = responseText.match(/CONFIDENCE:\s*([\d.]+)/);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

      // Parse reasoning
      const reasoningMatch = responseText.match(/REASONING:\s*([^\n\r]+(?:\s*[^\n\r]+)*?)(?=\n\s*KEY_FACTORS|\n\s*SOURCE_ANALYSIS|$)/s);
      const reasoning = reasoningMatch?.[1]?.trim() || 'Unable to parse reasoning from AI response.';

      // Parse key factors
      const keyFactorsMatch = responseText.match(/KEY_FACTORS:\s*([\s\S]*?)(?=SOURCE_ANALYSIS:|$)/);
      const keyFactorsText = keyFactorsMatch?.[1] || '';
      const keyFactors = keyFactorsText
        .split('\n')
        .map(line => line.replace(/^[\s\-•*]+/, '').trim())
        .filter(line => line.length > 5)
        .slice(0, 5);

      // Parse source analysis
      const sourceAnalysis: { [sourceName: string]: { position: 'YES' | 'NO' | 'NEUTRAL'; confidence: number; summary: string } } = {};

      const sourceAnalysisMatch = responseText.match(/SOURCE_ANALYSIS:\s*([\s\S]*?)$/);
      if (sourceAnalysisMatch) {
        const sourceLines = sourceAnalysisMatch[1].split('\n').filter(line => line.trim());

        for (const line of sourceLines) {
          const sourceMatch = line.match(/^([^:]+):\s*(YES|NO|NEUTRAL)\s*-\s*(.+)$/i);
          if (sourceMatch) {
            const sourceName = sourceMatch[1].trim();
            const position = sourceMatch[2].toUpperCase() as 'YES' | 'NO' | 'NEUTRAL';
            const summary = sourceMatch[3].trim();

            sourceAnalysis[sourceName] = {
              position,
              confidence: position === 'NEUTRAL' ? 0.5 : (confidence * 0.8), // Slightly lower than overall confidence
              summary
            };
          }
        }
      }

      return {
        recommendation,
        confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0-1
        reasoning,
        keyFactors,
        sourceAnalysis,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Error parsing AI response:', error);

      return {
        recommendation: 'INCONCLUSIVE',
        confidence: 0,
        reasoning: 'Failed to parse AI analysis response.',
        keyFactors: ['Response parsing error'],
        sourceAnalysis: {},
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Generate a summary for the aggregate view
   */
  generateAggregateSummary(analysis: AIAnalysisResult): string {
    const confidencePercent = (analysis.confidence * 100).toFixed(0);
    const sourcesCount = Object.keys(analysis.sourceAnalysis).length;

    return `AI Engine analyzed ${sourcesCount} external sources and recommends: **${analysis.recommendation}** with ${confidencePercent}% confidence. ${analysis.reasoning}`;
  }
}

export const aiAnalysisService = new AIAnalysisService();