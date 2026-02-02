import Anthropic from '@anthropic-ai/sdk';
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
- Stima i macro in modo realistico`;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    planName: { type: "string", description: "Nome del piano se presente (es. 'Scheda alimentare Julia')" },
    date: { type: "string", description: "Data del piano se presente" },
    notes: { 
      type: "array", 
      items: { type: "string" },
      description: "Note generali a piè di pagina"
    },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { 
            type: "string", 
            enum: ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
          },
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { 
                  type: "string", 
                  enum: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
                },
                time: { type: "string", description: "Orario se specificato (es. '8:30')" },
                foods: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "number" },
                      unit: { type: "string", enum: ["g", "ml", "pz", "scatola", "fetta", "cucchiaio", "tazza"] },
                      isOptional: { type: "boolean" },
                      macros: {
                        type: "object",
                        properties: {
                          calories: { type: "number" },
                          protein: { type: "number" },
                          carbs: { type: "number" },
                          fat: { type: "number" },
                          fiber: { type: "number" }
                        },
                        required: ["calories", "protein", "carbs", "fat"]
                      }
                    },
                    required: ["name", "quantity", "unit", "macros"]
                  }
                },
                totalMacros: {
                  type: "object",
                  properties: {
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" }
                  },
                  required: ["calories", "protein", "carbs", "fat"]
                }
              },
              required: ["type", "foods", "totalMacros"]
            }
          }
        },
        required: ["day", "meals"]
      }
    },
    weeklyTotals: {
      type: "object",
      properties: {
        calories: { type: "number" },
        protein: { type: "number" },
        carbs: { type: "number" },
        fat: { type: "number" }
      },
      required: ["calories", "protein", "carbs", "fat"]
    }
  },
  required: ["days", "weeklyTotals"]
};

export default async function handler(req: Request, context: Context) {
  // CORS headers
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers,
      });
    }

    const client = new Anthropic({ apiKey });

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analizza questa immagine di un piano alimentare/dieta settimanale.

Estrai TUTTI i dati in formato JSON seguendo questo schema:
${JSON.stringify(JSON_SCHEMA, null, 2)}

Rispondi SOLO con il JSON valido, senza altro testo.`,
            },
          ],
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract JSON from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let jsonText = textContent.text.trim();
    
    // Try to extract JSON if wrapped in markdown code block
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const dietPlan = JSON.parse(jsonText);

    return new Response(JSON.stringify({ 
      success: true, 
      data: dietPlan,
      usage: response.usage 
    }), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Parse diet error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to parse diet plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers,
    });
  }
}
