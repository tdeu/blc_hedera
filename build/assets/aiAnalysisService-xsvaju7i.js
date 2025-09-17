import{A as N}from"./index-B9SXQ9fs.js";class S{anthropicClient;constructor(){this.anthropicClient=new N}async analyzeContent(n,s){const t=Date.now();try{if(console.log(`🤖 Analyzing ${s.length} pieces of content for: "${n}"`),s.length===0)return{recommendation:"INCONCLUSIVE",confidence:0,reasoning:"No external content found to analyze.",keyFactors:[],sourceAnalysis:{},processingTimeMs:Date.now()-t};const e=this.buildAnalysisPrompt(n,s),o=await this.anthropicClient.generateAnalysis(e),r=this.parseAIResponse(o,s,t);return console.log(`✅ AI analysis complete: ${r.recommendation} (${(r.confidence*100).toFixed(0)}% confidence)`),r}catch(e){return console.error("❌ Error during AI analysis:",e),{recommendation:"INCONCLUSIVE",confidence:0,reasoning:`Analysis failed due to error: ${e instanceof Error?e.message:"Unknown error"}`,keyFactors:["Technical error during analysis"],sourceAnalysis:{},processingTimeMs:Date.now()-t}}}buildAnalysisPrompt(n,s){const t=s.map((o,r)=>`## Source ${r+1}: ${o.source}
**URL**: ${o.url}
**Title**: ${o.title}
**Content**: ${o.content}
**Relevance Score**: ${(o.relevanceScore||0).toFixed(0)}%
`).join(`

`),e=[...new Set(s.map(o=>o.source))].join(", ");return`You are an expert fact-checker analyzing news content to answer a specific market prediction question.

**MARKET QUESTION**: "${n}"

**YOUR TASK**:
Analyze the following content from trusted news sources and provide a definitive YES or NO answer to the market question.

**ANALYSIS CRITERIA**:
1. Focus only on factual, verifiable information
2. Weight sources by credibility (BBC, Reuters = very high; others = high)
3. Look for direct evidence that supports or contradicts the market question
4. Consider recency of information
5. Identify any contradictions between sources

**CONTENT TO ANALYZE**:
Sources: ${e}

${t}

**REQUIRED OUTPUT FORMAT** (respond exactly in this format):

RECOMMENDATION: [YES/NO/INCONCLUSIVE]
CONFIDENCE: [number between 0.0 and 1.0]
REASONING: [2-3 sentences explaining your decision based on the evidence]

KEY_FACTORS:
- [Most important supporting fact 1]
- [Most important supporting fact 2]
- [Most important supporting fact 3]

SOURCE_ANALYSIS:
${s.map(o=>`${o.source}: [YES/NO/NEUTRAL] - [Brief summary of this source's position]`).join(`
`)}

**IMPORTANT GUIDELINES**:
- Only answer YES if there is clear, recent evidence supporting the market question
- Only answer NO if there is clear, recent evidence contradicting the market question
- Answer INCONCLUSIVE if evidence is mixed, outdated, or insufficient
- Base confidence on strength and consistency of evidence across sources
- Be conservative with confidence scores - prefer lower confidence when uncertain`}parseAIResponse(n,s,t){try{const e=n.rawResponse||n.content||n.toString(),r=e.match(/RECOMMENDATION:\s*(YES|NO|INCONCLUSIVE)/i)?.[1]?.toUpperCase()||"INCONCLUSIVE",l=e.match(/CONFIDENCE:\s*([\d.]+)/),m=l?parseFloat(l[1]):.5,f=e.match(/REASONING:\s*([^\n\r]+(?:\s*[^\n\r]+)*?)(?=\n\s*KEY_FACTORS|\n\s*SOURCE_ANALYSIS|$)/s)?.[1]?.trim()||"Unable to parse reasoning from AI response.",h=(e.match(/KEY_FACTORS:\s*([\s\S]*?)(?=SOURCE_ANALYSIS:|$)/)?.[1]||"").split(`
`).map(c=>c.replace(/^[\s\-•*]+/,"").trim()).filter(c=>c.length>5).slice(0,5),u={},d=e.match(/SOURCE_ANALYSIS:\s*([\s\S]*?)$/);if(d){const c=d[1].split(`
`).filter(a=>a.trim());for(const a of c){const i=a.match(/^([^:]+):\s*(YES|NO|NEUTRAL)\s*-\s*(.+)$/i);if(i){const A=i[1].trim(),p=i[2].toUpperCase(),y=i[3].trim();u[A]={position:p,confidence:p==="NEUTRAL"?.5:m*.8,summary:y}}}}return{recommendation:r,confidence:Math.max(0,Math.min(1,m)),reasoning:f,keyFactors:h,sourceAnalysis:u,processingTimeMs:Date.now()-t}}catch(e){return console.error("❌ Error parsing AI response:",e),{recommendation:"INCONCLUSIVE",confidence:0,reasoning:"Failed to parse AI analysis response.",keyFactors:["Response parsing error"],sourceAnalysis:{},processingTimeMs:Date.now()-t}}}generateAggregateSummary(n){const s=(n.confidence*100).toFixed(0);return`AI Engine analyzed ${Object.keys(n.sourceAnalysis).length} external sources and recommends: **${n.recommendation}** with ${s}% confidence. ${n.reasoning}`}}const R=new S;export{S as AIAnalysisService,R as aiAnalysisService};
