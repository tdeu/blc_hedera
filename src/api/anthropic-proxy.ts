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

// Web scraping endpoint - simplified for testing
app.post('/api/scrape', async (req, res) => {
  try {
    const { query } = req.body;
    console.log(`🔍 Backend scraping for: "${query}"`);

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Simple test response for now
    const testResults = [
      {
        id: 'test_1',
        source: 'BBC News',
        url: 'https://www.bbc.com/test-article',
        title: `Test Article: ${query}`,
        content: `This is a test article about ${query}. Real scraping functionality is being implemented.`,
        publishedAt: new Date().toISOString(),
        relevanceScore: 0.9
      },
      {
        id: 'test_2',
        source: 'Reuters',
        url: 'https://www.reuters.com/test-article',
        title: `Reuters Test: ${query}`,
        content: `Reuters test content for ${query}. Backend scraping endpoint is working.`,
        publishedAt: new Date().toISOString(),
        relevanceScore: 0.8
      }
    ];

    console.log(`✅ Returning ${testResults.length} test articles`);
    res.json({ results: testResults, total: testResults.length });

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