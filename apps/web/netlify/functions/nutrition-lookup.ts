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

// Local database of common Italian foods (per 100g unless servingG specified)
const LOCAL_FOOD_DB: Record<string, { cal: number; p: number; c: number; f: number; servingG?: number }> = {
  // Cereali e derivati
  'avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'fiocchi di avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'fiocchi avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'farina avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'farina/fiocchi avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'riso': { cal: 130, p: 2.7, c: 28, f: 0.3 },
  'riso basmati': { cal: 121, p: 3.5, c: 25.2, f: 0.4 },
  'riso integrale': { cal: 111, p: 2.6, c: 23, f: 0.9 },
  'spaghetti di riso': { cal: 109, p: 0.9, c: 25, f: 0.2 },
  'pasta': { cal: 131, p: 5, c: 25, f: 1.1 },
  'pasta integrale': { cal: 124, p: 5.3, c: 25, f: 0.9 },
  'pasta di lenticchi': { cal: 120, p: 9, c: 20, f: 1.5 },
  'pasta di ceci': { cal: 130, p: 8, c: 22, f: 2 },
  'gnocchi': { cal: 133, p: 3.2, c: 28, f: 0.8 },
  'gnocchi di patate': { cal: 133, p: 3.2, c: 28, f: 0.8 },
  'piadina': { cal: 310, p: 8, c: 48, f: 10, servingG: 80 },
  'piadina integrale': { cal: 290, p: 9, c: 45, f: 8, servingG: 80 },
  'pane': { cal: 265, p: 9, c: 49, f: 3.2 },
  'pane integrale': { cal: 247, p: 13, c: 41, f: 4.2 },
  'fette biscottate': { cal: 408, p: 11, c: 75, f: 6, servingG: 10 },
  'fette biscottate integrali': { cal: 395, p: 12, c: 68, f: 7, servingG: 10 },
  'fetta di pane': { cal: 265, p: 9, c: 49, f: 3.2, servingG: 40 },
  'crackers': { cal: 428, p: 10, c: 72, f: 10, servingG: 7 },
  'crackers integrali': { cal: 410, p: 12, c: 65, f: 12, servingG: 12 },
  'gallette': { cal: 387, p: 8, c: 81, f: 2.8, servingG: 9 },
  'gallette di riso': { cal: 387, p: 8, c: 81, f: 2.8, servingG: 9 },
  'biscotti': { cal: 450, p: 6, c: 70, f: 16, servingG: 10 },
  'biscotti secchi': { cal: 416, p: 8, c: 77, f: 8.5, servingG: 10 },
  'biscotti proteici': { cal: 380, p: 15, c: 50, f: 12, servingG: 8 },
  'cereali': { cal: 378, p: 8, c: 80, f: 3 },
  'muesli': { cal: 367, p: 10, c: 66, f: 6 },
  'corn flakes': { cal: 378, p: 7, c: 84, f: 0.9 },
  'cornflakes': { cal: 378, p: 7, c: 84, f: 0.9 },

  // Proteine
  'pollo': { cal: 165, p: 31, c: 0, f: 3.6 },
  'petto di pollo': { cal: 165, p: 31, c: 0, f: 3.6 },
  'tacchino': { cal: 135, p: 29, c: 0, f: 1.6 },
  'petto di tacchino': { cal: 135, p: 29, c: 0, f: 1.6 },
  'manzo': { cal: 250, p: 26, c: 0, f: 15 },
  'vitello': { cal: 172, p: 33, c: 0, f: 4.8 },
  'maiale': { cal: 242, p: 27, c: 0, f: 14 },
  'agnello': { cal: 294, p: 25, c: 0, f: 21 },
  'prosciutto crudo': { cal: 195, p: 26, c: 0.3, f: 10 },
  'prosciutto cotto': { cal: 132, p: 19.8, c: 0.9, f: 5.4 },
  'bresaola': { cal: 151, p: 33.1, c: 0, f: 2.6 },
  'tonno': { cal: 130, p: 29, c: 0, f: 1 },
  'tonno in scatola': { cal: 198, p: 25, c: 0, f: 10 },
  'tonno al naturale': { cal: 130, p: 29, c: 0, f: 1 },
  'salmone': { cal: 208, p: 20, c: 0, f: 13 },
  'merluzzo': { cal: 82, p: 18, c: 0, f: 0.7 },
  'orata': { cal: 100, p: 19, c: 0, f: 2.5 },
  'sgombro': { cal: 205, p: 19, c: 0, f: 14 },
  'pesce': { cal: 100, p: 20, c: 0, f: 2 },
  'pesce bianco': { cal: 82, p: 18, c: 0, f: 0.7 },
  'gamberi': { cal: 85, p: 18, c: 0.9, f: 0.9 },
  'calamari': { cal: 92, p: 15.6, c: 3.1, f: 1.4 },
  'carne': { cal: 200, p: 26, c: 0, f: 10 },

  // Uova e latticini
  'uovo': { cal: 155, p: 13, c: 1.1, f: 11, servingG: 50 },
  'uova': { cal: 155, p: 13, c: 1.1, f: 11, servingG: 50 },
  'albume': { cal: 52, p: 11, c: 0.7, f: 0.2, servingG: 33 },
  'albumi': { cal: 52, p: 11, c: 0.7, f: 0.2, servingG: 33 },
  'latte': { cal: 42, p: 3.4, c: 5, f: 1 },
  'latte intero': { cal: 64, p: 3.3, c: 4.9, f: 3.6 },
  'latte parzialmente scremato': { cal: 46, p: 3.3, c: 5, f: 1.5 },
  'latte scremato': { cal: 34, p: 3.4, c: 5, f: 0.1 },
  'latte avena': { cal: 47, p: 1, c: 8, f: 1.5 },
  'latte di avena': { cal: 47, p: 1, c: 8, f: 1.5 },
  'latte mandorla': { cal: 24, p: 0.5, c: 3, f: 1.1 },
  'latte di mandorla': { cal: 24, p: 0.5, c: 3, f: 1.1 },
  'latte soia': { cal: 54, p: 3.3, c: 6, f: 1.8 },
  'yogurt': { cal: 61, p: 3.5, c: 4.7, f: 3.3, servingG: 125 },
  'yogurt greco': { cal: 97, p: 9, c: 3.6, f: 5, servingG: 150 },
  'yogurt magro': { cal: 57, p: 10, c: 4, f: 0.7, servingG: 125 },
  'yogurt bianco': { cal: 61, p: 3.5, c: 4.7, f: 3.3, servingG: 125 },
  'yogurt proteico': { cal: 70, p: 10, c: 5, f: 0.5, servingG: 150 },
  'skyr': { cal: 63, p: 11, c: 4, f: 0.2, servingG: 150 },
  'ricotta': { cal: 174, p: 11, c: 3, f: 13 },
  'mozzarella': { cal: 280, p: 22, c: 2.2, f: 20 },
  'parmigiano': { cal: 431, p: 38, c: 0, f: 29 },
  'grana': { cal: 398, p: 33, c: 0, f: 29 },
  'formaggio': { cal: 350, p: 25, c: 1, f: 27 },
  'formaggio spalmabile': { cal: 253, p: 5.5, c: 4.6, f: 24 },
  'philadelphia': { cal: 253, p: 5.5, c: 4.6, f: 24 },
  'fiocchi di latte': { cal: 98, p: 11, c: 3.4, f: 4.3 },
  'feta': { cal: 264, p: 14, c: 4, f: 21 },
  'burro': { cal: 717, p: 0.9, c: 0.1, f: 81 },

  // Frutta
  'banana': { cal: 89, p: 1.1, c: 23, f: 0.3, servingG: 120 },
  'mela': { cal: 52, p: 0.3, c: 14, f: 0.2, servingG: 180 },
  'pera': { cal: 57, p: 0.4, c: 15, f: 0.1, servingG: 170 },
  'arancia': { cal: 47, p: 0.9, c: 12, f: 0.1, servingG: 200 },
  'mandarino': { cal: 53, p: 0.8, c: 13, f: 0.3, servingG: 80 },
  'kiwi': { cal: 61, p: 1.1, c: 15, f: 0.5, servingG: 75 },
  'fragole': { cal: 32, p: 0.7, c: 7.7, f: 0.3 },
  'mirtilli': { cal: 57, p: 0.7, c: 14, f: 0.3 },
  'lamponi': { cal: 52, p: 1.2, c: 12, f: 0.7 },
  'uva': { cal: 69, p: 0.7, c: 18, f: 0.2 },
  'pesca': { cal: 39, p: 0.9, c: 10, f: 0.3, servingG: 150 },
  'albicocca': { cal: 48, p: 1.4, c: 11, f: 0.4, servingG: 40 },
  'anguria': { cal: 30, p: 0.6, c: 8, f: 0.2 },
  'melone': { cal: 34, p: 0.8, c: 8, f: 0.2 },
  'ananas': { cal: 50, p: 0.5, c: 13, f: 0.1 },
  'avocado': { cal: 160, p: 2, c: 9, f: 15, servingG: 150 },
  'limone': { cal: 29, p: 1.1, c: 9, f: 0.3 },
  'pompelmo': { cal: 42, p: 0.8, c: 11, f: 0.1 },
  'frutti di bosco': { cal: 43, p: 0.9, c: 10, f: 0.4 },
  'frutta': { cal: 50, p: 0.6, c: 12, f: 0.2 },
  'frutta secca mista': { cal: 607, p: 20, c: 17, f: 54 },
  'frutta secca': { cal: 607, p: 20, c: 17, f: 54, servingG: 30 },

  // Verdura
  'insalata': { cal: 15, p: 1.4, c: 2.9, f: 0.2 },
  'insalata mista': { cal: 15, p: 1.4, c: 2.9, f: 0.2 },
  'lattuga': { cal: 15, p: 1.4, c: 2.9, f: 0.2 },
  'pomodoro': { cal: 18, p: 0.9, c: 3.9, f: 0.2 },
  'pomodori': { cal: 18, p: 0.9, c: 3.9, f: 0.2 },
  'cetriolo': { cal: 16, p: 0.7, c: 3.6, f: 0.1 },
  'carote': { cal: 41, p: 0.9, c: 10, f: 0.2 },
  'zucchine': { cal: 17, p: 1.2, c: 3.1, f: 0.3 },
  'melanzane': { cal: 25, p: 1, c: 6, f: 0.2 },
  'peperoni': { cal: 31, p: 1, c: 6, f: 0.3 },
  'spinaci': { cal: 23, p: 2.9, c: 3.6, f: 0.4 },
  'broccoli': { cal: 34, p: 2.8, c: 7, f: 0.4 },
  'cavolfiore': { cal: 25, p: 1.9, c: 5, f: 0.3 },
  'cavolo': { cal: 25, p: 1.3, c: 6, f: 0.1 },
  'funghi': { cal: 22, p: 3.1, c: 3.3, f: 0.3 },
  'asparagi': { cal: 20, p: 2.2, c: 3.9, f: 0.1 },
  'fagiolini': { cal: 31, p: 1.8, c: 7, f: 0.1 },
  'piselli': { cal: 81, p: 5.4, c: 14, f: 0.4 },
  'ceci': { cal: 164, p: 8.9, c: 27, f: 2.6 },
  'lenticchie': { cal: 116, p: 9, c: 20, f: 0.4 },
  'fagioli': { cal: 127, p: 8.7, c: 22, f: 0.5 },
  'patate': { cal: 77, p: 2, c: 17, f: 0.1 },
  'patate dolci': { cal: 86, p: 1.6, c: 20, f: 0.1 },
  'cipolla': { cal: 40, p: 1.1, c: 9, f: 0.1 },
  'aglio': { cal: 149, p: 6.4, c: 33, f: 0.5 },
  'verdure': { cal: 25, p: 1.5, c: 5, f: 0.3 },
  'verdure grigliate': { cal: 35, p: 1.5, c: 7, f: 0.5 },
  'verdure miste': { cal: 30, p: 1.5, c: 6, f: 0.3 },
  'contorno verdure': { cal: 30, p: 1.5, c: 6, f: 0.3 },

  // Frutta secca e semi
  'mandorle': { cal: 579, p: 21, c: 22, f: 50 },
  'noci': { cal: 654, p: 15, c: 14, f: 65 },
  'nocciole': { cal: 628, p: 15, c: 17, f: 61 },
  'anacardi': { cal: 553, p: 18, c: 30, f: 44 },
  'pistacchi': { cal: 560, p: 20, c: 28, f: 45 },
  'arachidi': { cal: 567, p: 26, c: 16, f: 49 },
  'burro di arachidi': { cal: 588, p: 25, c: 20, f: 50 },
  'semi di chia': { cal: 486, p: 17, c: 42, f: 31 },
  'semi di lino': { cal: 534, p: 18, c: 29, f: 42 },
  'semi di zucca': { cal: 559, p: 30, c: 11, f: 49 },
  'semi di girasole': { cal: 584, p: 21, c: 20, f: 51 },

  // Condimenti e oli
  'olio': { cal: 884, p: 0, c: 0, f: 100 },
  'olio evo': { cal: 884, p: 0, c: 0, f: 100 },
  'olio extravergine': { cal: 884, p: 0, c: 0, f: 100 },
  'olio di oliva': { cal: 884, p: 0, c: 0, f: 100 },
  'miele': { cal: 304, p: 0.3, c: 82, f: 0 },
  'marmellata': { cal: 250, p: 0.4, c: 60, f: 0.1 },
  'marmellata zero': { cal: 120, p: 0.4, c: 28, f: 0.1 },
  'zucchero': { cal: 387, p: 0, c: 100, f: 0 },
  'nutella': { cal: 539, p: 6.3, c: 56, f: 31 },
  'cioccolato': { cal: 546, p: 5, c: 60, f: 31 },
  'cioccolato fondente': { cal: 546, p: 5, c: 46, f: 31 },
  'cacao': { cal: 228, p: 20, c: 58, f: 14 },
  'aceto': { cal: 21, p: 0, c: 0.9, f: 0 },
  'aceto balsamico': { cal: 88, p: 0.5, c: 17, f: 0 },
  'salsa di soia': { cal: 53, p: 8, c: 5, f: 0 },

  // Bevande
  'caffè': { cal: 2, p: 0.1, c: 0, f: 0 },
  'tè': { cal: 1, p: 0, c: 0.3, f: 0 },
  'succo arancia': { cal: 45, p: 0.7, c: 10, f: 0.2 },
  'spremuta': { cal: 45, p: 0.7, c: 10, f: 0.2 },

  // Altro
  'hummus': { cal: 166, p: 8, c: 14, f: 10 },
  'tofu': { cal: 76, p: 8, c: 1.9, f: 4.8 },
  'tempeh': { cal: 193, p: 19, c: 9.4, f: 11 },
  'seitan': { cal: 370, p: 75, c: 14, f: 1.9 },
  'quinoa': { cal: 120, p: 4.4, c: 21, f: 1.9 },
  'farro': { cal: 338, p: 14.6, c: 72, f: 2.5 },
  'couscous': { cal: 112, p: 3.8, c: 23, f: 0.2 },
  'polenta': { cal: 70, p: 1.5, c: 15, f: 0.3 },
  'wasa': { cal: 410, p: 12, c: 65, f: 12, servingG: 12 },
  'wasa integrali': { cal: 410, p: 12, c: 65, f: 12, servingG: 12 },

  // Integratori e proteine
  'proteine': { cal: 120, p: 24, c: 3, f: 1, servingG: 30 },
  'proteine in polvere': { cal: 120, p: 24, c: 3, f: 1, servingG: 30 },
  'shake proteine': { cal: 120, p: 24, c: 3, f: 1, servingG: 30 },
  'shake proteico': { cal: 120, p: 24, c: 3, f: 1, servingG: 30 },
  'multivit': { cal: 0, p: 0, c: 0, f: 0, servingG: 1 },
  'multivitaminico': { cal: 0, p: 0, c: 0, f: 0, servingG: 1 },
  'omega 3': { cal: 10, p: 0, c: 0, f: 1, servingG: 1 },
};

// Serving sizes for pieces (pz)
const SERVING_SIZES: Record<string, number> = {
  'uovo': 50, 'uova': 50,
  'banana': 120, 'mela': 180, 'pera': 170, 'arancia': 200,
  'kiwi': 75, 'pesca': 150, 'albicocca': 40, 'mandarino': 80,
  'yogurt': 125, 'yogurt greco': 150, 'skyr': 150,
  'biscotti': 10, 'biscotto': 10, 'biscotti proteici': 8,
  'crackers': 7, 'crackers integrali': 12, 'wasa': 12,
  'fette biscottate': 10, 'gallette': 9, 'gallette di riso': 9,
  'piadina': 80, 'fetta di pane': 40, 'pane': 40,
  'mandorle': 1.2, 'noci': 5, 'nocciole': 2,
  'scatoletta': 80, 'tonno in scatola': 80,
  'frutta secca': 30,
};

// Unit conversions to grams
const UNIT_TO_GRAMS: Record<string, number> = {
  'g': 1, 'gr': 1, 'kg': 1000,
  'ml': 1, 'l': 1000,
  'cucchiaio': 15, 'cucchiai': 15,
  'cucchiaino': 5, 'cucchiaini': 5,
  'tazza': 240, 'tazze': 240,
  'fetta': 30, 'fette': 30,
  'porzione': 150, 'porzioni': 150,
  'manciata': 30, 'pizzico': 1,
};

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

      // 1. Try local database first (most accurate for Italian foods)
      nutrition = lookupLocal(food);
      
      if (nutrition) {
        results.push({
          name: food.name,
          quantity: food.quantity,
          unit: food.unit,
          nutrition,
          needsManualInput: false,
          suggestions: []
        });
        continue;
      }

      // 2. Try Nutritionix (if configured)
      if (!nutrition && process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_APP_KEY) {
        try {
          nutrition = await lookupNutritionix(food);
        } catch (e) {
          console.log('Nutritionix failed:', e);
        }
      }

      // 3. Try USDA
      if (!nutrition && process.env.USDA_API_KEY) {
        try {
          const usdaResult = await lookupUSDA(food);
          nutrition = usdaResult.nutrition;
          suggestions = usdaResult.suggestions || [];
        } catch (e) {
          console.log('USDA failed:', e);
        }
      }

      // 4. Try OpenFoodFacts (free, but less accurate for raw ingredients)
      if (!nutrition) {
        try {
          const offResult = await lookupOpenFoodFacts(food);
          nutrition = offResult.nutrition;
          if (!suggestions.length) suggestions = offResult.suggestions || [];
        } catch (e) {
          console.log('OpenFoodFacts failed:', e);
        }
      }

      // 5. Last resort: GPT estimation
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

// Local database lookup - instant, accurate for Italian foods
function lookupLocal(food: FoodQuery): NutritionData | null {
  const normalizedName = normalizeFood(food.name);
  const dbEntry = LOCAL_FOOD_DB[normalizedName];
  
  if (!dbEntry) return null;

  // Calculate grams
  const grams = calculateGrams(food, normalizedName, dbEntry.servingG);
  const factor = grams / 100;

  return {
    calories: Math.round(dbEntry.cal * factor),
    protein: Math.round(dbEntry.p * factor * 10) / 10,
    carbs: Math.round(dbEntry.c * factor * 10) / 10,
    fat: Math.round(dbEntry.f * factor * 10) / 10,
    source: 'local',
    confidence: 'high'
  };
}

function normalizeFood(name: string): string {
  let normalized = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove common prefixes/suffixes
  normalized = normalized
    .replace(/^(un |una |uno |dei |delle |dello |della |il |la |lo |i |le |gli )/i, '')
    .replace(/\s*(fresco|fresca|freschi|fresche|biologico|bio|surgelato|surgelata)$/i, '')
    .replace(/\s*\([^)]*\)/g, '') // remove parenthetical notes
    .trim();

  // Check exact match first
  if (LOCAL_FOOD_DB[normalized]) return normalized;

  // Try partial matches
  for (const key of Object.keys(LOCAL_FOOD_DB)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key;
    }
  }

  return normalized;
}

function calculateGrams(food: FoodQuery, normalizedName: string, dbServingG?: number): number {
  const unitLower = food.unit.toLowerCase();
  
  // Handle pieces (pz, pezzo, pezzi)
  if (unitLower === 'pz' || unitLower === 'pezzo' || unitLower === 'pezzi') {
    // Priority: DB serving > specific serving sizes > default 100g
    const servingSize = dbServingG || SERVING_SIZES[normalizedName] || findServingSize(normalizedName) || 100;
    return food.quantity * servingSize;
  }
  
  // Handle scatoletta specifically
  if (unitLower === 'scatoletta' || unitLower === 'scatola') {
    return food.quantity * 80;
  }
  
  // Standard unit conversion
  const multiplier = UNIT_TO_GRAMS[unitLower] || 1;
  return food.quantity * multiplier;
}

function findServingSize(foodName: string): number | null {
  for (const [key, size] of Object.entries(SERVING_SIZES)) {
    if (foodName.includes(key)) return size;
  }
  return null;
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
  // Add "raw" to help find basic ingredients instead of processed foods
  const searchQuery = `${food.name} raw`;
  
  const searchResponse = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=5`,
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

  const getNutrient = (nutrients: any[], id: number) => {
    const nutrient = nutrients?.find((n: any) => n.nutrientId === id);
    return nutrient?.value || 0;
  };

  const nutrients = item.foodNutrients || [];
  const grams = convertToGrams(food.quantity, food.unit);
  const factor = grams / 100;

  return {
    nutrition: {
      calories: Math.round(getNutrient(nutrients, 1008) * factor),
      protein: Math.round(getNutrient(nutrients, 1003) * factor * 10) / 10,
      carbs: Math.round(getNutrient(nutrients, 1005) * factor * 10) / 10,
      fat: Math.round(getNutrient(nutrients, 1004) * factor * 10) / 10,
      fiber: Math.round(getNutrient(nutrients, 1079) * factor * 10) / 10,
      source: 'usda',
      confidence: 'high'
    },
    suggestions
  };
}

// OpenFoodFacts API (free, no key) - Italian locale
async function lookupOpenFoodFacts(food: FoodQuery): Promise<{ nutrition: NutritionData | null; suggestions?: string[] }> {
  // Use Italian locale and search for raw/basic ingredient
  const searchTerms = `${food.name}`;
  
  const searchResponse = await fetch(
    `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&search_simple=1&action=process&json=1&page_size=10&lc=it&tagtype_0=categories&tag_contains_0=does_not_contain&tag_0=en:snacks`,
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

  const suggestions = products.slice(0, 5).map((p: any) => p.product_name_it || p.product_name || 'Unknown');
  
  // Find first product with nutrition data that isn't obviously wrong
  const product = products.find((p: any) => {
    const n = p.nutriments;
    if (!n?.['energy-kcal_100g']) return false;
    // Skip if calories seem way off for the food type
    const cal = n['energy-kcal_100g'];
    return cal > 0 && cal < 1000; // basic sanity check
  });
  
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
  const prompt = `Stima i valori nutrizionali per: ${food.quantity} ${food.unit} ${food.name}
Rispondi SOLO con JSON: {"cal":number,"p":number,"c":number,"f":number}
cal=calorie, p=proteine(g), c=carboidrati(g), f=grassi(g). Sii preciso, considera porzioni italiane tipiche.`;

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
  
  // Pieces handled separately with serving sizes
  if (unitLower === 'pz' || unitLower === 'pezzo' || unitLower === 'pezzi') {
    return quantity * 100; // default, should be overridden
  }
  
  const conversions: Record<string, number> = {
    'g': 1, 'gr': 1, 'kg': 1000,
    'ml': 1, 'l': 1000,
    'cucchiaio': 15, 'cucchiai': 15,
    'cucchiaino': 5, 'cucchiaini': 5,
    'tazza': 240,
    'fetta': 30, 'fette': 30,
    'scatoletta': 80, 'scatola': 80,
    'porzione': 150,
    'manciata': 30,
  };
  
  return quantity * (conversions[unitLower] || 1);
}
