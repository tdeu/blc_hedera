import{bO as c}from"./index-DokNjuN4.js";const l=new c;class d{async extractEntities(t,i){try{console.log("🔍 Extracting entities from claim:",t);const r=`Analyze this prediction market claim and extract key entities and keywords.

CLAIM: "${i?`${t}

Description: ${i}`:t}"

Extract the following in JSON format:
{
  "mainSubject": "The primary person, place, or thing this claim is about",
  "secondaryEntities": ["List of 2-4 related entities (people, places, organizations)"],
  "keywords": ["List of 3-5 important keywords for searching"],
  "context": "One sentence summary of what this claim is about",
  "searchQueries": ["3-5 optimized search queries to find relevant information"]
}

Guidelines:
- mainSubject should be the most important entity (person name, place, organization, event)
- secondaryEntities should include related names, places, roles, or concepts
- keywords should be terms that would help find relevant articles
- searchQueries should be natural search phrases (like you'd type in Google)

Examples:
Claim: "Alassane Ouattara is the legitimate president of Côte d'Ivoire"
{
  "mainSubject": "Alassane Ouattara",
  "secondaryEntities": ["Côte d'Ivoire", "president", "Ivory Coast government"],
  "keywords": ["Ouattara", "president", "Côte d'Ivoire", "legitimacy", "election"],
  "context": "Verification of Alassane Ouattara's legitimacy as president of Côte d'Ivoire",
  "searchQueries": [
    "Alassane Ouattara president Côte d'Ivoire",
    "Ivory Coast president legitimacy",
    "Ouattara election results",
    "Côte d'Ivoire current president",
    "Alassane Ouattara government"
  ]
}

Claim: "Bitcoin will reach $100,000 by end of 2024"
{
  "mainSubject": "Bitcoin",
  "secondaryEntities": ["cryptocurrency", "$100,000", "2024"],
  "keywords": ["Bitcoin", "price", "$100,000", "cryptocurrency", "2024"],
  "context": "Prediction about Bitcoin reaching a $100,000 price point by December 2024",
  "searchQueries": [
    "Bitcoin price prediction 2024",
    "Bitcoin $100,000",
    "cryptocurrency market 2024",
    "Bitcoin price forecast",
    "Bitcoin reaches $100k"
  ]
}

Return ONLY valid JSON, no markdown formatting.`,n=await l.generateAnalysis(r),s=n.rawResponse||n.content||JSON.stringify(n);let a;try{const o=s.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();a=JSON.parse(o)}catch(o){console.warn("⚠️ Failed to parse AI response, using fallback extraction:",o),a=this.fallbackExtraction(t)}return console.log("✅ Extracted entities:",a),a}catch(e){return console.error("❌ Entity extraction failed:",e),this.fallbackExtraction(t)}}fallbackExtraction(t){console.log("📋 Using fallback entity extraction");const e=t.split(/[\s,]+/).filter(r=>r.length>3);return{mainSubject:e[0]||t.substring(0,30),secondaryEntities:e.slice(1,4),keywords:e.slice(0,5),context:t.substring(0,100),searchQueries:[t,...e.slice(0,3).map(r=>`${r} ${e[0]}`)]}}async generateSourceSpecificQueries(t,i){const{mainSubject:e,secondaryEntities:r,keywords:n}=t;switch(i){case"NEWS":return[`${e} latest news`,`${e} ${r[0]} recent`,`breaking ${e}`,...n.slice(0,2).map(s=>`${s} news today`)];case"HISTORICAL":return[`${e} history`,`${e} ${r[0]} historical`,`${e} background`,`history of ${e}`];case"ACADEMIC":return[`${e} research`,`${e} study`,`${e} academic`,`scholarly ${e}`];case"GENERAL_KNOWLEDGE":default:return[e,`${e} ${r[0]}`,...r.slice(0,2),`what is ${e}`]}}}const y=new d;export{y as entityExtractionService};
