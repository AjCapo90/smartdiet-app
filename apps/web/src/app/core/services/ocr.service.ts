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
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        throw new Error(`Immagine troppo grande (${(imageFile.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`);
      }

      // Convert file to base64
      this.progress.set(10);
      this.status.set(`Preparazione immagine (${(imageFile.size / 1024).toFixed(0)}KB)...`);
      const base64 = await this.fileToBase64(imageFile);
      
      this.status.set('Invio all\'AI per analisi...');
      this.progress.set(30);

      console.log('Sending to API:', this.API_URL, 'Image size:', base64.length, 'bytes');

      // Call the Netlify function with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      let response: Response;
      try {
        response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            mimeType: imageFile.type || 'image/jpeg',
          }),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: l\'analisi sta impiegando troppo tempo. Riprova con un\'immagine più piccola.');
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
      return result.data as ParsedDietPlan;

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
}
