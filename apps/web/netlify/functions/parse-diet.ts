import type { Context } from '@netlify/functions';

const SYSTEM_PROMPT = `Sei un esperto nutrizionista che analizza piani alimentari.
Quando ricevi un'immagine di una dieta settimanale, estrai TUTTI i dati in formato JSON strutturato.

La dieta è tipicamente una tabella con:
- Colonne: giorni della settimana (Lunedì, Martedì, etc.)
- Righe: pasti (Colazione, Spuntino mattina, Pranzo, Spuntino pomeriggio, Cena)

Per ogni alimento, stima i macronutrienti basandoti su valori nutrizionali standard italiani.

IMPORTANTE:
- Estrai TUTTI gli alimenti con le quantità esatte scritte
- Se c'è scritto "ev." significa "eventualmente" (opzionale)
- "q.b." significa "quanto basta"
- Converti le quantità in grammi quando possibile
- Stima i macro in modo realistico

Rispondi SOLO con JSON valido, senza markdown o altro testo.`;

const JSON_SCHEMA = `{
  "planName": "string (nome del piano se presente)",
  "date": "string (data se presente)", 
  "notes": ["array di note a piè di pagina"],
  "days": [
    {
      "day": "Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica",
      "meals": [
        {
          "type": "breakfast|morning_snack|lunch|afternoon_snack|dinner",
          "time": "orario se specificato (es. 8:30)",
          "foods": [
            {
              "name": "nome alimento",
              "quantity": 100,
              "unit": "g|ml|pz|scatola|fetta|cucchiaio",
              "isOptional": false,
              "macros": {
                "calories": 100,
                "protein": 10,
                "carbs": 20,
                "fat": 5
              }
            }
          ],
          "totalMacros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
        }
      ]
    }
  ],
  "weeklyTotals": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
}`;

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
      status: 405,
      headers,
    });
  }

  try {
    const body = await req.json();
    const { image, mimeType = 'image/jpeg' } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers,
      });
    }

    // Try xAI/Grok first, then fall back to Anthropic, then OpenAI
    const xaiKey = process.env.XAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let result;

    if (xaiKey) {
      result = await callXAI(xaiKey, image, mimeType);
    } else if (anthropicKey) {
      result = await callAnthropic(anthropicKey, image, mimeType);
    } else if (openaiKey) {
      result = await callOpenAI(openaiKey, image, mimeType);
    } else {
      return new Response(JSON.stringify({ 
        error: 'No API key configured',
        details: 'Set XAI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in environment'
      }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: result.data,
      provider: result.provider
    }), {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('Parse diet error:', error);
    console.error('Error stack:', error?.stack);
    return new Response(JSON.stringify({ 
      error: 'Failed to parse diet plan',
      details: error instanceof Error ? error.message : String(error),
      stack: error?.stack?.split('\n').slice(0, 5)
    }), {
      status: 500,
      headers,
    });
  }
}

async function callXAI(apiKey: string, image: string, mimeType: string) {
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  
  console.log('Calling xAI API, image size:', base64Data.length, 'bytes');
  
  const requestBody = {
    model: 'grok-2-vision-1212',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
          {
            type: 'text',
            text: `${SYSTEM_PROMPT}\n\nAnalizza questa immagine di un piano alimentare/dieta settimanale.\n\nEstrai TUTTI i dati in formato JSON seguendo questo schema:\n${JSON_SCHEMA}\n\nRispondi SOLO con il JSON valido, senza markdown.`,
          },
        ],
      },
    ],
    max_tokens: 8000,
  };

  let response: Response;
  try {
    response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (fetchError: any) {
    console.error('xAI fetch error:', fetchError);
    throw new Error(`xAI fetch failed: ${fetchError.message}`);
  }

  console.log('xAI response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('xAI error response:', error);
    throw new Error(`xAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('xAI response received, has choices:', !!data.choices);
  
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    console.error('xAI response structure:', JSON.stringify(data).substring(0, 500));
    throw new Error('No content in xAI response');
  }

  return {
    provider: 'xai/grok-2-vision',
    data: parseJsonResponse(content)
  };
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
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analizza questa immagine di un piano alimentare/dieta settimanale.\n\nEstrai TUTTI i dati in formato JSON seguendo questo schema:\n${JSON_SCHEMA}\n\nRispondi SOLO con il JSON valido.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) {
    throw new Error('No content in Anthropic response');
  }

  return {
    provider: 'anthropic/claude-sonnet',
    data: parseJsonResponse(content)
  };
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
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
            {
              type: 'text',
              text: `Analizza questa immagine di un piano alimentare/dieta settimanale.\n\nEstrai TUTTI i dati in formato JSON seguendo questo schema:\n${JSON_SCHEMA}\n\nRispondi SOLO con il JSON valido.`,
            },
          ],
        },
      ],
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  return {
    provider: 'openai/gpt-4o',
    data: parseJsonResponse(content)
  };
}

function parseJsonResponse(content: string): any {
  let jsonText = content.trim();
  
  // Try to extract JSON if wrapped in markdown code block
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }
  
  // Remove any leading/trailing non-JSON characters
  const jsonStart = jsonText.indexOf('{');
  const jsonEnd = jsonText.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
  }

  return JSON.parse(jsonText);
}
