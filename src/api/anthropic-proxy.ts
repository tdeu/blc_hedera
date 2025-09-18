// Generic AI proxy (Anthropic or OpenAI) + Web Scraping
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

// Load environment variables
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3001;
const PROVIDER = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3003'], // Vite default ports + current port
  credentials: true,
}));
app.use(express.json());

// Unified AI proxy endpoint (keeps same URL for existing clients)
app.post('/api/anthropic-proxy', async (req, res) => {
  try {
    console.log('Backend received request:', req.body);

    const model = req.body?.model;
    const messages = req.body?.messages || [];
    const maxTokens = req.body?.max_tokens || req.body?.maxTokens || 1000;

    if (PROVIDER === 'openai') {
      console.log('AI provider:', PROVIDER);
      console.log('OPENAI_API_KEY present?', !!process.env.OPENAI_API_KEY);
      console.log('VITE_OPENAI_API_KEY present?', !!process.env.VITE_OPENAI_API_KEY);
      const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      if (!openaiKey) {
        console.error('❌ OPENAI_API_KEY not found in environment variables');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Force OpenAI model from env or default; ignore inbound Anthropic model name
      const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({ model: openaiModel, messages, temperature: 0.2, max_tokens: maxTokens })
      });

      console.log('OpenAI API response status:', response.status);
      const data = await response.json();
      if (!response.ok) {
        console.error('OpenAI API error:', data);
        return res.status(response.status).json({ error: data });
      }

      const text = data?.choices?.[0]?.message?.content || '';
      return res.json({ content: [{ text }] });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: model || 'claude-3-haiku-20240307', max_tokens: maxTokens, messages })
    });

    console.log('Anthropic API response status:', response.status);
    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data });
    }

    console.log('Sending response to frontend:', JSON.stringify(data, null, 2));
    return res.json(data);
  } catch (error) {
    console.error('Anthropic proxy error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', provider: PROVIDER, timestamp: new Date().toISOString() });
});

// Env check (no secrets exposed)
app.get('/env-check', (req, res) => {
  res.json({
    provider: PROVIDER,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasViteOpenAI: !!process.env.VITE_OPENAI_API_KEY
  });
});

// Simple search query generation from market questions
function generateSearchQueries(marketQuestion: string): string[] {
  console.log(`🎯 Generating search queries for: "${marketQuestion}"`);

  // Extract key terms using simple parsing
  const words = marketQuestion.toLowerCase()
    .replace(/[?!.]/g, '')
    .split(' ')
    .filter(word => word.length > 2)
    .filter(word => !['will', 'the', 'and', 'for', 'this', 'that', 'with', 'from', 'they', 'have', 'are', 'was', 'were', 'been', 'has'].includes(word));

  // Create different query combinations
  const queries = [];

  // Full question as one query
  queries.push(marketQuestion.replace(/[?!.]/g, '').trim());

  // Key terms combined
  if (words.length >= 3) {
    queries.push(words.slice(0, 3).join(' '));
  }

  // If it mentions specific entities, add them
  if (words.length >= 2) {
    queries.push(words.slice(0, 2).join(' '));
  }

  console.log(`📝 Generated queries:`, queries);
  return queries.slice(0, 3);
}

// Enhanced test news generation with more realistic content
function generateEnhancedTestResults(query: string): any[] {
  const searchQueries = generateSearchQueries(query);
  const results = [];

  searchQueries.forEach((searchQuery, index) => {
    // BBC News test result
    results.push({
      id: `bbc_${Date.now()}_${index}`,
      source: 'BBC News',
      url: `https://www.bbc.com/news/business-${Math.random().toString(36).substring(7)}`,
      title: `BBC Analysis: ${searchQuery}`,
      content: `Recent developments regarding ${searchQuery} have shown significant market movement. Industry experts suggest that key factors include economic indicators, regulatory changes, and consumer sentiment. This analysis is based on current market data and trending patterns.`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.8 + Math.random() * 0.2
    });

    // Reuters test result
    results.push({
      id: `reuters_${Date.now()}_${index}`,
      source: 'Reuters',
      url: `https://www.reuters.com/markets/${Math.random().toString(36).substring(7)}`,
      title: `Reuters Report: ${searchQuery}`,
      content: `Market analysis indicates significant developments in ${searchQuery}. Financial analysts point to various economic factors and industry trends that could impact future outcomes. Current data suggests mixed signals from different market sectors.`,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      relevanceScore: 0.7 + Math.random() * 0.2
    });
  });

  return results.slice(0, 6); // Limit to 6 enhanced articles
}

// Web scraping endpoint - enhanced with better test data
app.post('/api/scrape', async (req, res) => {
  try {
    const { query } = req.body;
    console.log(`🔍 Backend scraping for: "${query}"`);

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Generate enhanced test results with realistic content
    const results = generateEnhancedTestResults(query);
    const searchQueries = generateSearchQueries(query);

    console.log(`✅ Generated ${results.length} enhanced test articles`);
    res.json({ results, total: results.length, queries: searchQueries });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({ error: 'Scraping failed', message: error.message });
  }
});

// Simple relevance calculation
function calculateRelevance(text: string, query: string): number {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  const textLower = text.toLowerCase();

  const matches = searchTerms.filter(term => textLower.includes(term));
  return Math.min(matches.length / searchTerms.length, 1.0);
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Anthropic proxy server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /api/anthropic-proxy - AI proxy`);
  console.log(`   POST /api/scrape - Web scraping`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /env-check - Environment check`);
});

export default app;