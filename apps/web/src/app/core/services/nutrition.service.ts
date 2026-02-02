import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source: 'local' | 'nutritionix' | 'usda' | 'openfoodfacts' | 'manual' | 'estimated';
  confidence: 'high' | 'medium' | 'low';
}

export interface FoodLookupResult {
  name: string;
  quantity: number;
  unit: string;
  nutrition: NutritionData | null;
  needsManualInput: boolean;
  suggestions?: string[];
}

export interface BulkLookupResult {
  results: FoodLookupResult[];
  resolved: number;
  pending: number;
  manual: number;
}

// Local database of common Italian foods (per 100g unless noted)
const LOCAL_FOOD_DB: Record<string, { cal: number; p: number; c: number; f: number; servingG?: number }> = {
  // Cereali e derivati
  'avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'fiocchi di avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'fiocchi avena': { cal: 389, p: 16.9, c: 66.3, f: 6.9 },
  'riso': { cal: 130, p: 2.7, c: 28, f: 0.3 },
  'riso basmati': { cal: 121, p: 3.5, c: 25.2, f: 0.4 },
  'riso integrale': { cal: 111, p: 2.6, c: 23, f: 0.9 },
  'pasta': { cal: 131, p: 5, c: 25, f: 1.1 },
  'pasta integrale': { cal: 124, p: 5.3, c: 25, f: 0.9 },
  'pane': { cal: 265, p: 9, c: 49, f: 3.2 },
  'pane integrale': { cal: 247, p: 13, c: 41, f: 4.2 },
  'fette biscottate': { cal: 408, p: 11, c: 75, f: 6 },
  'fette biscottate integrali': { cal: 395, p: 12, c: 68, f: 7 },
  'crackers': { cal: 428, p: 10, c: 72, f: 10 },
  'gallette di riso': { cal: 387, p: 8, c: 81, f: 2.8 },
  'biscotti': { cal: 450, p: 6, c: 70, f: 16 },
  'biscotti secchi': { cal: 416, p: 8, c: 77, f: 8.5 },
  'cereali': { cal: 378, p: 8, c: 80, f: 3 },
  'muesli': { cal: 367, p: 10, c: 66, f: 6 },
  'corn flakes': { cal: 378, p: 7, c: 84, f: 0.9 },

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
  'salmone': { cal: 208, p: 20, c: 0, f: 13 },
  'merluzzo': { cal: 82, p: 18, c: 0, f: 0.7 },
  'orata': { cal: 100, p: 19, c: 0, f: 2.5 },
  'sgombro': { cal: 205, p: 19, c: 0, f: 14 },
  'gamberi': { cal: 85, p: 18, c: 0.9, f: 0.9 },
  'calamari': { cal: 92, p: 15.6, c: 3.1, f: 1.4 },

  // Uova e latticini
  'uovo': { cal: 78, p: 6.3, c: 0.6, f: 5.3, servingG: 50 },
  'uova': { cal: 78, p: 6.3, c: 0.6, f: 5.3, servingG: 50 },
  'albume': { cal: 17, p: 3.6, c: 0.2, f: 0.1, servingG: 33 },
  'albumi': { cal: 17, p: 3.6, c: 0.2, f: 0.1, servingG: 33 },
  'latte': { cal: 42, p: 3.4, c: 5, f: 1 },
  'latte intero': { cal: 64, p: 3.3, c: 4.9, f: 3.6 },
  'latte parzialmente scremato': { cal: 46, p: 3.3, c: 5, f: 1.5 },
  'latte scremato': { cal: 34, p: 3.4, c: 5, f: 0.1 },
  'latte avena': { cal: 47, p: 1, c: 8, f: 1.5 },
  'latte di avena': { cal: 47, p: 1, c: 8, f: 1.5 },
  'latte mandorla': { cal: 24, p: 0.5, c: 3, f: 1.1 },
  'latte di mandorla': { cal: 24, p: 0.5, c: 3, f: 1.1 },
  'latte soia': { cal: 54, p: 3.3, c: 6, f: 1.8 },
  'yogurt': { cal: 61, p: 3.5, c: 4.7, f: 3.3 },
  'yogurt greco': { cal: 97, p: 9, c: 3.6, f: 5 },
  'yogurt magro': { cal: 57, p: 10, c: 4, f: 0.7 },
  'yogurt bianco': { cal: 61, p: 3.5, c: 4.7, f: 3.3 },
  'skyr': { cal: 63, p: 11, c: 4, f: 0.2 },
  'ricotta': { cal: 174, p: 11, c: 3, f: 13 },
  'mozzarella': { cal: 280, p: 22, c: 2.2, f: 20 },
  'parmigiano': { cal: 431, p: 38, c: 0, f: 29 },
  'grana': { cal: 398, p: 33, c: 0, f: 29 },
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
  'frutta secca mista': { cal: 607, p: 20, c: 17, f: 54 },

  // Verdura
  'insalata': { cal: 15, p: 1.4, c: 2.9, f: 0.2 },
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
  'verdure grigliate': { cal: 35, p: 1.5, c: 7, f: 0.5 },
  'verdure miste': { cal: 30, p: 1.5, c: 6, f: 0.3 },

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
};

// Unit conversions to grams
const UNIT_TO_GRAMS: Record<string, number> = {
  'g': 1,
  'gr': 1,
  'kg': 1000,
  'ml': 1, // roughly for liquids
  'l': 1000,
  'cucchiaio': 15,
  'cucchiai': 15,
  'cucchiaino': 5,
  'cucchiaini': 5,
  'tazza': 240,
  'tazze': 240,
  'fetta': 30,
  'fette': 30,
  'pz': 1, // will use servingG or default
  'pezzo': 1,
  'pezzi': 1,
  'porzione': 150,
  'porzioni': 150,
  'scatoletta': 80,
  'scatola': 80,
  'manciata': 30,
  'pizzico': 1,
};

@Injectable({ providedIn: 'root' })
export class NutritionService {
  isLoading = signal(false);
  progress = signal(0);
  status = signal('');

  private readonly API_URL = environment.production
    ? '/api/nutrition-lookup'
    : 'http://localhost:8888/.netlify/functions/nutrition-lookup';

  // Local lookup - instant, no API call
  lookupLocal(name: string, quantity: number, unit: string): NutritionData | null {
    const normalizedName = this.normalizeFood(name);
    const dbEntry = LOCAL_FOOD_DB[normalizedName];
    
    if (!dbEntry) return null;

    // Calculate grams
    let grams: number;
    const unitLower = unit.toLowerCase();
    
    if (unitLower === 'pz' || unitLower === 'pezzo' || unitLower === 'pezzi') {
      // Use serving size if available, otherwise estimate based on food type
      grams = quantity * (dbEntry.servingG || this.estimateServingSize(normalizedName));
    } else {
      const multiplier = UNIT_TO_GRAMS[unitLower] || 1;
      grams = quantity * multiplier;
    }

    // Calculate nutrition based on grams (DB is per 100g)
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

  // Normalize food name for lookup
  private normalizeFood(name: string): string {
    let normalized = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove common prefixes/suffixes
    normalized = normalized
      .replace(/^(un |una |uno |dei |delle |dello |della |il |la |lo |i |le |gli )/i, '')
      .replace(/\s*(fresco|fresca|freschi|fresche|biologico|bio|surgelato|surgelata)$/i, '')
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

  // Estimate serving size for items counted in pieces
  private estimateServingSize(foodName: string): number {
    const servingSizes: Record<string, number> = {
      'biscotti': 10,
      'biscotto': 10,
      'crackers': 7,
      'cracker': 7,
      'fette biscottate': 10,
      'gallette': 9,
      'mandorle': 1.2,
      'noci': 5,
      'nocciole': 2,
    };

    for (const [key, size] of Object.entries(servingSizes)) {
      if (foodName.includes(key)) return size;
    }

    return 100; // default portion
  }

  // Bulk lookup with API fallback
  async lookupBulk(foods: Array<{ name: string; quantity: number; unit: string }>): Promise<BulkLookupResult> {
    this.isLoading.set(true);
    this.progress.set(0);
    this.status.set('Calcolo valori nutrizionali...');

    const results: FoodLookupResult[] = [];
    const needsApi: Array<{ index: number; name: string; quantity: number; unit: string }> = [];

    // First pass: try local lookup
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const localResult = this.lookupLocal(food.name, food.quantity, food.unit);
      
      if (localResult) {
        results.push({
          name: food.name,
          quantity: food.quantity,
          unit: food.unit,
          nutrition: localResult,
          needsManualInput: false
        });
      } else {
        results.push({
          name: food.name,
          quantity: food.quantity,
          unit: food.unit,
          nutrition: null,
          needsManualInput: true
        });
        needsApi.push({ index: i, ...food });
      }

      this.progress.set(Math.round((i / foods.length) * 50));
    }

    // Second pass: API lookup for unresolved items
    if (needsApi.length > 0) {
      this.status.set(`Ricerca ${needsApi.length} alimenti online...`);
      
      try {
        const apiResults = await this.callNutritionApi(needsApi.map(f => ({ 
          name: f.name, 
          quantity: f.quantity, 
          unit: f.unit 
        })));
        
        for (let i = 0; i < apiResults.length; i++) {
          const apiResult = apiResults[i];
          const originalIndex = needsApi[i].index;
          
          if (apiResult.nutrition) {
            results[originalIndex] = {
              ...results[originalIndex],
              nutrition: apiResult.nutrition,
              needsManualInput: false,
              suggestions: apiResult.suggestions
            };
          } else {
            results[originalIndex].suggestions = apiResult.suggestions;
          }
        }
      } catch (error) {
        console.error('API lookup failed:', error);
        // Keep items as needing manual input
      }
    }

    this.progress.set(100);
    this.status.set('Completato');
    this.isLoading.set(false);

    const resolved = results.filter(r => r.nutrition !== null).length;
    const pending = results.filter(r => r.nutrition === null && !r.needsManualInput).length;
    const manual = results.filter(r => r.needsManualInput && r.nutrition === null).length;

    return { results, resolved, pending, manual };
  }

  // Call Netlify function for API lookups
  private async callNutritionApi(foods: Array<{ name: string; quantity: number; unit: string }>): Promise<FoodLookupResult[]> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foods })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Nutrition API error:', error);
      return foods.map(f => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
        nutrition: null,
        needsManualInput: true
      }));
    }
  }

  // Manual entry helper - create nutrition data from user input
  createManualEntry(calories: number, protein: number, carbs: number, fat: number): NutritionData {
    return {
      calories,
      protein,
      carbs,
      fat,
      source: 'manual',
      confidence: 'high'
    };
  }

  // Get list of suggested similar foods from local DB
  getSuggestions(query: string): string[] {
    const normalized = query.toLowerCase();
    return Object.keys(LOCAL_FOOD_DB)
      .filter(key => key.includes(normalized) || normalized.includes(key))
      .slice(0, 5);
  }
}
