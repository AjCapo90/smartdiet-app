import type { Context } from '@netlify/functions';

// Prompt più conciso per risposte più veloci
const PROMPT = `Analizza questa dieta settimanale italiana. Estrai i dati in JSON:

{
  "planName": "nome piano",
  "days": [
    {
      "day": "Lunedì",
      "meals": [
        {
          "type": "breakfast|morning_snack|lunch|afternoon_snack|dinner",
          "time": "8:30",
          "foods": [{"name": "alimento", "quantity": 100, "unit": "g", "macros": {"calories": 100, "protein": 10, "carbs": 20, "fat": 5}}],
          "totalMacros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        }
      ]
    }
  ],
  "weeklyTotals": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
  "notes": []
}

Regole:
- "ev." = opzionale (isOptional: true)
- Stima macro realistici per ogni alimento
- Rispondi SOLO con JSON valido`;

export default async function handler(req: Request, context: Context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers,
    });
  }

  try {
    const body = await req.json();
    const { image, mimeType = 'image/jpeg' } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers,
      });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const xaiKey = process.env.XAI_API_KEY;

    // Debug: log which keys are available
    console.log('Keys available:', {
      openai: !!openaiKey,
      anthropic: !!anthropicKey,
      xai: !!xaiKey
    });

    let result;
    let provider = 'none';
    const startTime = Date.now();

    if (openaiKey) {
      provider = 'openai';
      console.log('Using OpenAI GPT-4o');
      result = await callOpenAI(openaiKey, image, mimeType);
    } else if (xaiKey) {
      provider = 'xai';
      console.log('Using xAI Grok');
      result = await callXAI(xaiKey, image, mimeType);
    } else if (anthropicKey) {
      provider = 'anthropic';
      console.log('Using Anthropic Claude');
      result = await callAnthropic(anthropicKey, image, mimeType);
    } else {
      return new Response(JSON.stringify({ 
        error: 'No API key configured',
        details: 'Set OPENAI_API_KEY, XAI_API_KEY, or ANTHROPIC_API_KEY',
        keysFound: { openai: !!openaiKey, xai: !!xaiKey, anthropic: !!anthropicKey }
      }), { status: 500, headers });
    }

    console.log(`Completed in ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: result.data,
      provider: result.provider,
      timeMs: Date.now() - startTime
    }), { status: 200, headers });

  } catch (error: any) {
    console.error('Parse diet error:', error?.message || error);
    return new Response(JSON.stringify({ 
      error: 'Failed to parse diet plan',
      details: error?.message || String(error)
    }), { status: 500, headers });
  }
}

async function callXAI(apiKey: string, image: string, mimeType: string) {
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  
  // Usa grok-2-vision con streaming per evitare timeout
  const model = 'grok-2-vision-1212';
  console.log(`Calling xAI ${model} with streaming...`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 24000); // 24 sec timeout
  
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { 
                url: `data:${mimeType};base64,${base64Data}`,
                detail: 'low' // Use low detail for faster processing
              },
            },
            { type: 'text', text: PROMPT },
          ],
        }],
        max_tokens: 3000,
        temperature: 0,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`xAI error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in xAI response');
    }

    return {
      provider: `xai/${model}`,
      data: parseJsonResponse(content)
    };
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('xAI timeout after 24 seconds');
    }
    throw e;
  }
}

async function callAnthropic(apiKey: string, image: string, mimeType: string) {
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) throw new Error('No content in Anthropic response');

  return { provider: 'anthropic/claude-sonnet', data: parseJsonResponse(content) };
}

async function callOpenAI(apiKey: string, image: string, mimeType: string) {
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          { type: 'text', text: PROMPT },
        ],
      }],
      max_tokens: 4000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) throw new Error('No content in OpenAI response');

  return { provider: 'openai/gpt-4o', data: parseJsonResponse(content) };
}

function parseJsonResponse(content: string): any {
  let text = content.trim();
  
  // Remove markdown code blocks
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) text = match[1].trim();
  
  // Find JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }

  return JSON.parse(text);
}
