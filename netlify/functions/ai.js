const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  const { question, data } = JSON.parse(event.body);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Sos un asistente de gestión municipal. Analizá estos registros y respondé la pregunta de forma concisa en español.

Datos:
${JSON.stringify(data, null, 2)}

Pregunta: ${question}`
    }]
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer: msg.content[0].text })
  };
};
