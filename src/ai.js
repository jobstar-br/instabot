const axios = require('axios');

/**
 * Gera resposta usando Claude AI
 */
async function generateAIResponse(userMessage, systemPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[AI] ANTHROPIC_API_KEY não configurada');
    return null;
  }

  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt || 'Você é um assistente simpático e prestativo. Responda de forma curta e direta.',
        messages: [{ role: 'user', content: userMessage }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return res.data.content?.[0]?.text || null;
  } catch (err) {
    console.error('[AI] Erro na API Claude:', err.response?.data || err.message);
    return null;
  }
}

module.exports = { generateAIResponse };
