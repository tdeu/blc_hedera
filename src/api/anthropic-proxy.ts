// Express server for Anthropic API proxy
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default ports
  credentials: true,
}));
app.use(express.json());

// Anthropic API proxy endpoint
app.post('/api/anthropic-proxy', async (req, res) => {
  try {
    console.log('Backend received request:', req.body);

    // Get API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('Using API key:', apiKey ? 'Present' : 'Missing');

    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    console.log('Anthropic API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('✅ Anthropic API success');
    res.json(data);
  } catch (error) {
    console.error('Anthropic proxy error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Anthropic proxy server running on port ${PORT}`);
});

export default app;