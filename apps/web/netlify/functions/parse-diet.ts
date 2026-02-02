import type { Context } from '@netlify/functions';

const STRUCTURE_PROMPT = `Sei un parser di piani alimentari italiani. Estrai TUTTI i pasti da TUTTI i 7 giorni.

IMPORTANTE: Un piano tipico ha 5 pasti al giorno:
- COLAZIONE (b)
- SPUNTINO MATTINA (sm) 
- PRANZO (l)
- SPUNTINO POMERIGGIO (sp)
- CENA (d)

Output JSON ESATTO:
{"days":[
  {"day":"Lun","meals":[
    {"t":"b","f":["40g avena","1 uovo"]},
    {"t":"sm","f":["30g frutta secca"]},
    {"t":"l","f":["60g pasta","100g pollo","verdure"]},
    {"t":"sp","f":["1 yogurt"]},
    {"t":"d","f":["150g pesce","verdure"]}
  ]},
  ...altri 6 giorni...
]}

REGOLE:
- Estrai TUTTI i 7 giorni: Lun, Mar, Mer, Gio, Ven, Sab, Dom
- Estrai TUTTI i pasti di ogni giorno (tipicamente 5)
- t=b(colazione), sm(spuntino mattina), l(pranzo), sp(spuntino pomeriggio), d(cena)
- Mantieni quantità e cibi come nell'originale (es: "40g avena", "1 uovo", "100g pollo")
- Se un giorno ha "FREE" o è vuoto, metti f:[]
- JSON VALIDO, niente commenti`;

export default async function handler(req: Request, context: Context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  try {
    let image: string;
    let mimeType = 'image/jpeg';
    let debug = false;
    let ocrOnly = false;

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData upload (iOS compatible)
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      
      if (!file) {
        return new Response(JSON.stringify({ error: 'No image in form data' }), { status: 400, headers });
      }
      
      // Convert to base64 directly (no resize - let Google Vision handle it)
      const arrayBuffer = await file.arrayBuffer();
      image = Buffer.from(arrayBuffer).toString('base64');
      mimeType = file.type || 'image/jpeg';
      
      console.log(`File: ${file.name}, ${(file.size/1024).toFixed(0)}KB, type: ${mimeType}`);
    } else {
      // Handle JSON body
      const body = await req.json();
      image = body.image || '';
      mimeType = body.mimeType || 'image/jpeg';
      debug = body.debug || false;
      ocrOnly = body.ocrOnly || false;
    }

    if (debug) {
      return new Response(JSON.stringify({
        debug: true,
        keysConfigured: {
          google: !!process.env.GOOGLE_CLOUD_API_KEY,
          openai: !!process.env.OPENAI_API_KEY,
        }
      }), { status: 200, headers });
    }

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400, headers });
    }

    const googleKey = process.env.GOOGLE_CLOUD_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const startTime = Date.now();
    let ocrText: string;
    let ocrProvider: string;

    // Step 1: OCR - prefer Google Cloud Vision (fast), fallback to OpenAI Vision
    if (googleKey) {
      console.log('Using Google Cloud Vision for OCR...');
      ocrText = await googleVisionOCR(googleKey, image);
      ocrProvider = 'google-vision';
    } else if (openaiKey) {
      console.log('Using OpenAI Vision for OCR (slower)...');
      ocrText = await openaiVisionOCR(openaiKey, image, mimeType);
      ocrProvider = 'openai-vision';
    } else {
      return new Response(JSON.stringify({ 
        error: 'No API key configured',
        details: 'Set GOOGLE_CLOUD_API_KEY (recommended) or OPENAI_API_KEY'
      }), { status: 500, headers });
    }

    const ocrTime = Date.now() - startTime;
    console.log(`OCR completed in ${ocrTime}ms, text length: ${ocrText.length}`);

    if (!ocrText || ocrText.length < 10) {
      return new Response(JSON.stringify({ 
        error: 'OCR failed to extract text',
        details: 'Could not read text from image',
        ocrTextLength: ocrText?.length || 0
      }), { status: 400, headers });
    }

    // Debug: return OCR text if requested
    if (ocrOnly) {
      return new Response(JSON.stringify({
        success: true,
        ocrText: ocrText.substring(0, 2000),
        ocrTextLength: ocrText.length,
        ocrTimeMs: ocrTime,
        provider: ocrProvider
      }), { status: 200, headers });
    }

    // Step 2: Structure with GPT (text-only = fast!)
    if (!openaiKey) {
      return new Response(JSON.stringify({ 
        error: 'OPENAI_API_KEY required for text structuring'
      }), { status: 500, headers });
    }

    console.log('Structuring with GPT-4o-mini...');
    const structuredData = await structureWithGPT(openaiKey, ocrText);
    const totalTime = Date.now() - startTime;

    console.log(`Total time: ${totalTime}ms (OCR: ${ocrTime}ms)`);

    return new Response(JSON.stringify({
      success: true,
      data: structuredData,
      provider: `${ocrProvider} + gpt-4o-mini`,
      timeMs: totalTime,
      ocrTimeMs: ocrTime
    }), { status: 200, headers });

  } catch (e: any) {
    console.error('Error:', e?.message);
    return new Response(JSON.stringify({ 
      error: 'Failed to parse diet',
      details: e?.message 
    }), { status: 500, headers });
  }
}

async function googleVisionOCR(apiKey: string, imageBase64: string): Promise<string> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: base64Data },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Vision error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text = data.responses?.[0]?.fullTextAnnotation?.text || 
               data.responses?.[0]?.textAnnotations?.[0]?.description || '';
  
  return text;
}

async function openaiVisionOCR(apiKey: string, imageBase64: string, mimeType: string): Promise<string> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          { type: 'text', text: 'Estrai TUTTO il testo visibile in questa immagine, mantenendo la struttura tabellare. Solo testo, niente commenti.' }
        ]
      }],
      max_tokens: 4000,
      temperature: 0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Vision error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function structureWithGPT(apiKey: string, ocrText: string): Promise<any> {
  // Allow more text for complex diet plans
  const truncatedText = ocrText.length > 6000 ? ocrText.substring(0, 6000) : ocrText;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STRUCTURE_PROMPT },
        { role: 'user', content: `Ecco il testo OCR del piano alimentare. Estrai TUTTI i pasti di TUTTI i 7 giorni:\n\n${truncatedText}` }
      ],
      max_tokens: 4000,
      temperature: 0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response
  let text = content.trim();
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) text = match[1].trim();
  
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }
  
  return JSON.parse(text);
}
