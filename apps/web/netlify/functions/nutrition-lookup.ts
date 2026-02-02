import type { Context } from '@netlify/functions';

interface FoodQuery {
  name: string;
  quantity: number;
  unit: string;
}

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

interface FoodResult {
  name: string;
  quantity: number;
  unit: string;
  nutrition: NutritionData | null;
  needsManualInput: boolean;
  suggestions?: string[];
}

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
    const body = await req.json();
    const foods: FoodQuery[] = body.foods || [];

    if (!foods.length) {
      return new Response(JSON.stringify({ error: 'No foods provided' }), { status: 400, headers });
    }

    const results: FoodResult[] = [];
    
    for (const food of foods) {
      let nutrition: NutritionData | null = null;
      let suggestions: string[] = [];

      // Try Nutritionix first (most accurate)
      if (!nutrition && process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_APP_KEY) {
        try {
          nutrition = await lookupNutritionix(food);
        } catch (e) {
          console.log('Nutritionix failed:', e);
        }
      }

      // Fallback to USDA
      if (!nutrition && process.env.USDA_API_KEY) {
        try {
          const usdaResult = await lookupUSDA(food);
          nutrition = usdaResult.nutrition;
          suggestions = usdaResult.suggestions || [];
        } catch (e) {
          console.log('USDA failed:', e);
        }
      }

      // Fallback to OpenFoodFacts (no API key needed)
      if (!nutrition) {
        try {
          const offResult = await lookupOpenFoodFacts(food);
          nutrition = offResult.nutrition;
          if (!suggestions.length) suggestions = offResult.suggestions || [];
        } catch (e) {
          console.log('OpenFoodFacts failed:', e);
        }
      }

      // Last resort: GPT estimation
      if (!nutrition && process.env.OPENAI_API_KEY) {
        try {
          nutrition = await estimateWithGPT(food);
        } catch (e) {
          console.log('GPT estimation failed:', e);
        }
      }

      results.push({
        name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        nutrition,
        needsManualInput: nutrition === null,
        suggestions
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results 
    }), { status: 200, headers });

  } catch (e: any) {
    console.error('Error:', e?.message);
    return new Response(JSON.stringify({ 
      error: 'Lookup failed', 
      details: e?.message 
    }), { status: 500, headers });
  }
}

// Nutritionix Natural Language API
async function lookupNutritionix(food: FoodQuery): Promise<NutritionData | null> {
  const query = `${food.quantity} ${food.unit} ${food.name}`;
  
  const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-id': process.env.NUTRITIONIX_APP_ID!,
      'x-app-key': process.env.NUTRITIONIX_APP_KEY!,
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`Nutritionix error: ${response.status}`);
  }

  const data = await response.json();
  const item = data.foods?.[0];
  
  if (!item) return null;

  return {
    calories: Math.round(item.nf_calories || 0),
    protein: Math.round((item.nf_protein || 0) * 10) / 10,
    carbs: Math.round((item.nf_total_carbohydrate || 0) * 10) / 10,
    fat: Math.round((item.nf_total_fat || 0) * 10) / 10,
    fiber: item.nf_dietary_fiber,
    source: 'nutritionix',
    confidence: 'high'
  };
}

// USDA FoodData Central API
async function lookupUSDA(food: FoodQuery): Promise<{ nutrition: NutritionData | null; suggestions?: string[] }> {
  const searchResponse = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(food.name)}&pageSize=5`,
    { method: 'GET' }
  );

  if (!searchResponse.ok) {
    throw new Error(`USDA search error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const foods = searchData.foods || [];

  if (!foods.length) {
    return { nutrition: null, suggestions: [] };
  }

  const suggestions = foods.slice(0, 5).map((f: any) => f.description);
  const item = foods[0];

  // Extract nutrients (USDA uses nutrient IDs)
  const getNutrient = (nutrients: any[], id: number) => {
    const nutrient = nutrients?.find((n: any) => n.nutrientId === id);
    return nutrient?.value || 0;
  };

  const nutrients = item.foodNutrients || [];
  
  // Calculate for quantity (USDA is per 100g)
  const grams = convertToGrams(food.quantity, food.unit);
  const factor = grams / 100;

  return {
    nutrition: {
      calories: Math.round(getNutrient(nutrients, 1008) * factor), // Energy
      protein: Math.round(getNutrient(nutrients, 1003) * factor * 10) / 10, // Protein
      carbs: Math.round(getNutrient(nutrients, 1005) * factor * 10) / 10, // Carbs
      fat: Math.round(getNutrient(nutrients, 1004) * factor * 10) / 10, // Fat
      fiber: Math.round(getNutrient(nutrients, 1079) * factor * 10) / 10, // Fiber
      source: 'usda',
      confidence: 'high'
    },
    suggestions
  };
}

// OpenFoodFacts API (free, no key)
async function lookupOpenFoodFacts(food: FoodQuery): Promise<{ nutrition: NutritionData | null; suggestions?: string[] }> {
  const searchResponse = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(food.name)}&search_simple=1&action=process&json=1&page_size=5&lc=it`,
    { method: 'GET' }
  );

  if (!searchResponse.ok) {
    throw new Error(`OpenFoodFacts error: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const products = searchData.products || [];

  if (!products.length) {
    return { nutrition: null, suggestions: [] };
  }

  const suggestions = products.slice(0, 5).map((p: any) => p.product_name || p.product_name_it || 'Unknown');
  
  // Find first product with nutrition data
  const product = products.find((p: any) => p.nutriments?.['energy-kcal_100g']);
  
  if (!product?.nutriments) {
    return { nutrition: null, suggestions };
  }

  const n = product.nutriments;
  const grams = convertToGrams(food.quantity, food.unit);
  const factor = grams / 100;

  return {
    nutrition: {
      calories: Math.round((n['energy-kcal_100g'] || 0) * factor),
      protein: Math.round((n['proteins_100g'] || 0) * factor * 10) / 10,
      carbs: Math.round((n['carbohydrates_100g'] || 0) * factor * 10) / 10,
      fat: Math.round((n['fat_100g'] || 0) * factor * 10) / 10,
      fiber: n['fiber_100g'] ? Math.round(n['fiber_100g'] * factor * 10) / 10 : undefined,
      source: 'openfoodfacts',
      confidence: 'medium'
    },
    suggestions
  };
}

// GPT estimation as last resort
async function estimateWithGPT(food: FoodQuery): Promise<NutritionData | null> {
  const prompt = `Estimate nutritional values for: ${food.quantity} ${food.unit} ${food.name}
Return ONLY JSON: {"cal":number,"p":number,"c":number,"f":number}
cal=calories, p=protein(g), c=carbs(g), f=fat(g). Be accurate, consider Italian food portions.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0
    })
  });

  if (!response.ok) {
    throw new Error(`GPT error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response
  const match = content.match(/\{[^}]+\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]);

  return {
    calories: Math.round(parsed.cal || 0),
    protein: Math.round((parsed.p || 0) * 10) / 10,
    carbs: Math.round((parsed.c || 0) * 10) / 10,
    fat: Math.round((parsed.f || 0) * 10) / 10,
    source: 'estimated',
    confidence: 'low'
  };
}

// Helper: convert various units to grams
function convertToGrams(quantity: number, unit: string): number {
  const unitLower = unit.toLowerCase();
  const conversions: Record<string, number> = {
    'g': 1,
    'gr': 1,
    'kg': 1000,
    'ml': 1,
    'l': 1000,
    'cucchiaio': 15,
    'cucchiai': 15,
    'cucchiaino': 5,
    'cucchiaini': 5,
    'tazza': 240,
    'fetta': 30,
    'fette': 30,
    'pz': 100, // default piece size
    'pezzo': 100,
    'scatoletta': 80,
  };
  
  return quantity * (conversions[unitLower] || 1);
}
