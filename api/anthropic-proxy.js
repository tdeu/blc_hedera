// Vercel serverless function for Anthropic API proxy
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Vercel function received request:', req.body);

    const { model, max_tokens, messages } = req.body;
    const maxTokens = max_tokens || 1000;

    // Check if we should use OpenAI or Anthropic
    const provider = process.env.AI_PROVIDER?.toLowerCase() || 'anthropic';

    if (provider === 'openai') {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        console.error('❌ OPENAI_API_KEY not found in environment variables');
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: openaiModel,
          messages,
          temperature: 0.2,
          max_tokens: maxTokens
        })
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

    // Default to Anthropic
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
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        messages
      })
    });

    console.log('Anthropic API response status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data });
    }

    return res.json(data);
  } catch (error) {
    console.error('Vercel function error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}