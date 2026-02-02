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
      // Convert file to base64
      this.progress.set(10);
      const base64 = await this.fileToBase64(imageFile);
      
      this.status.set('Invio all\'AI per analisi...');
      this.progress.set(30);

      // Call the Netlify function
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          mimeType: imageFile.type || 'image/jpeg',
        }),
      });

      this.progress.set(80);
      this.status.set('Elaborazione risposta...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Risposta non valida dal server');
      }

      this.progress.set(100);
      this.status.set('Completato!');

      return result.data as ParsedDietPlan;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
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
