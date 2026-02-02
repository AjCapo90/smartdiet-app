import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROMPT = `Analizza questa dieta settimanale italiana. Estrai i dati in JSON:
{
  "planName": "nome piano",
  "days": [{"day": "Lunedì", "meals": [{"type": "breakfast", "foods": [{"name": "alimento", "quantity": 100, "unit": "g", "macros": {"calories": 100, "protein": 10, "carbs": 20, "fat": 5}}], "totalMacros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}]}],
  "weeklyTotals": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
}
Stima macro realistici. Rispondi SOLO JSON.`;

export const config = {
  maxDuration: 60, // 60 seconds for Vercel Hobby
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mimeType = 'image/jpeg' } = req.body;
  if (!image) return res.status(400).json({ error: 'No image' });

  const xaiKey = process.env.XAI_API_KEY;
  if (!xaiKey) return res.status(500).json({ error: 'No XAI_API_KEY' });

  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          { type: 'text', text: PROMPT }
        ]}],
        max_tokens: 4000,
        temperature: 0
      })
    });

    if (!response.ok) throw new Error(`xAI: ${response.status} ${await response.text()}`);
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content');

    // Parse JSON
    let text = content.trim();
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) text = m[1].trim();
    const start = text.indexOf('{'), end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) text = text.substring(start, end + 1);

    return res.status(200).json({ success: true, data: JSON.parse(text), provider: 'xai/grok-2-vision' });
  } catch (e: any) {
    return res.status(500).json({ error: 'Parse failed', details: e?.message });
  }
}
