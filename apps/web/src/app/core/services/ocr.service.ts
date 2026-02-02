import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  isOptional?: boolean;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
}

export interface ParsedMeal {
  type: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner';
  time?: string;
  foods: FoodItem[];
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface ParsedDayPlan {
  day: string;
  meals: ParsedMeal[];
}

export interface ParsedDietPlan {
  planName?: string;
  date?: string;
  notes?: string[];
  days: ParsedDayPlan[];
  weeklyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

@Injectable({ providedIn: 'root' })
export class OcrService {
  isProcessing = signal(false);
  progress = signal(0);
  status = signal('');
  lastError = signal<string | null>(null);

  private readonly API_URL = environment.production 
    ? '/api/parse-diet' 
    : 'http://localhost:8888/.netlify/functions/parse-diet';

  async parseDietPlanFromImage(imageFile: File): Promise<ParsedDietPlan> {
    this.isProcessing.set(true);
    this.progress.set(0);
    this.status.set('Preparazione immagine...');
    this.lastError.set(null);

    try {
      // Resize image (800px max for mobile compatibility)
      this.progress.set(5);
      this.status.set('Ottimizzazione immagine...');
      let optimizedFile: File;
      try {
        optimizedFile = await this.resizeImage(imageFile, 800, 0.8);
      } catch (resizeError) {
        console.error('Resize failed, using original:', resizeError);
        optimizedFile = imageFile; // Fallback to original
      }
      
      console.log(`Image optimized: ${(imageFile.size / 1024).toFixed(0)}KB -> ${(optimizedFile.size / 1024).toFixed(0)}KB`);

      // Convert file to base64
      this.progress.set(15);
      this.status.set(`Preparazione immagine (${(optimizedFile.size / 1024).toFixed(0)}KB)...`);
      const base64 = await this.fileToBase64(optimizedFile);
      
      this.status.set('Invio all\'AI per analisi...');
      this.progress.set(30);

      console.log('Sending to API:', this.API_URL, 'Base64 length:', base64.length);

      // Check payload size (max ~5MB for most browsers)
      if (base64.length > 5 * 1024 * 1024) {
        throw new Error('Immagine troppo grande. Prova con una foto più piccola.');
      }

      // Call the Netlify function with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      let response: Response;
      try {
        const payload = JSON.stringify({
          image: base64,
          mimeType: optimizedFile.type || 'image/jpeg',
        });
        console.log('Payload size:', (payload.length / 1024).toFixed(0), 'KB');
        
        response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', fetchError);
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: l\'analisi sta impiegando troppo tempo.');
        }
        // More specific error for Safari "Load failed"
        if (fetchError.message === 'Load failed' || fetchError.message === 'Failed to fetch') {
          throw new Error('Connessione fallita. Verifica la connessione internet e riprova.');
        }
        throw new Error(`Errore di rete: ${fetchError.message}`);
      }
      clearTimeout(timeoutId);

      this.progress.set(80);
      this.status.set('Elaborazione risposta...');

      const responseText = await response.text();
      console.log('API Response:', response.status, responseText.substring(0, 500));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('Risposta non valida dal server: ' + responseText.substring(0, 100));
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || result.details || 'Risposta non valida dal server');
      }

      this.progress.set(100);
      this.status.set('Completato!');

      console.log('Parse successful, provider:', result.provider);
      
      // Normalize compact format to full format
      const normalized = this.normalizeData(result.data);
      return normalized as ParsedDietPlan;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('OCR Error:', message, error);
      this.lastError.set(message);
      this.status.set('Errore: ' + message);
      throw error;
    } finally {
      this.isProcessing.set(false);
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Return base64 without the data URL prefix
        resolve(result.split(',')[1] || result);
      };
      reader.onerror = () => reject(new Error('Errore lettura file'));
      reader.readAsDataURL(file);
    });
  }

  private resizeImage(file: File, maxSize: number, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, { 
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              // If resize fails, return original
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => resolve(file); // On error, return original
      
      // Load image from file
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  // Map meal types from AI response to storage format
  mapMealType(type: ParsedMeal['type']): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    switch (type) {
      case 'breakfast':
        return 'breakfast';
      case 'lunch':
        return 'lunch';
      case 'dinner':
        return 'dinner';
      case 'morning_snack':
      case 'afternoon_snack':
        return 'snack';
      default:
        return 'snack';
    }
  }

  // Map day names from Italian to English
  mapDayName(italianDay: string): string {
    const dayMap: Record<string, string> = {
      'Lunedì': 'Monday',
      'Martedì': 'Tuesday', 
      'Mercoledì': 'Wednesday',
      'Giovedì': 'Thursday',
      'Venerdì': 'Friday',
      'Sabato': 'Saturday',
      'Domenica': 'Sunday',
    };
    return dayMap[italianDay] || italianDay;
  }

  // Get meal time label
  getMealTimeLabel(type: ParsedMeal['type']): string {
    const labels: Record<string, string> = {
      'breakfast': 'Colazione',
      'morning_snack': 'Spuntino mattina',
      'lunch': 'Pranzo',
      'afternoon_snack': 'Spuntino pomeriggio',
      'dinner': 'Cena',
    };
    return labels[type] || type;
  }

  // Normalize compact API format to full format
  private normalizeData(data: any): ParsedDietPlan {
    const dayMap: Record<string, string> = {
      'Lun': 'Lunedì', 'Mar': 'Martedì', 'Mer': 'Mercoledì',
      'Gio': 'Giovedì', 'Ven': 'Venerdì', 'Sab': 'Sabato', 'Dom': 'Domenica'
    };
    
    const typeMap: Record<string, ParsedMeal['type']> = {
      'b': 'breakfast', 's': 'morning_snack', 'l': 'lunch', 
      'sp': 'afternoon_snack', 'd': 'dinner'
    };

    const days: ParsedDayPlan[] = (data.days || []).map((day: any) => ({
      day: dayMap[day.day] || day.day,
      meals: (day.meals || []).map((meal: any) => {
        const mealType = typeMap[meal.t] || meal.type || meal.t;
        const foods: FoodItem[] = (meal.f || meal.foods || []).map((food: any) => {
          if (typeof food === 'string') {
            // Parse "40g avena" format
            const match = food.match(/^(\d+)?\s*(g|ml|pz|fette?|scatolett[ae]?)?\s*(.+)$/i);
            if (match) {
              return {
                name: match[3]?.trim() || food,
                quantity: parseInt(match[1]) || 1,
                unit: match[2] || 'pz',
                macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }
              };
            }
            return { name: food, quantity: 1, unit: 'pz', macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
          }
          return food;
        });
        
        return {
          type: mealType,
          time: meal.time,
          foods,
          totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };
      })
    }));

    return {
      days,
      weeklyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };
  }
}
