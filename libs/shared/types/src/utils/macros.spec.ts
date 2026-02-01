import {
  addMacros,
  subtractMacros,
  scaleMacros,
  sumMacros,
  calculatePercentages,
  divideMacros,
  macrosToDaily,
  EMPTY_MACROS,
} from './macros';

describe('Macro Utilities', () => {
  describe('addMacros', () => {
    it('should add two macro objects correctly', () => {
      const a = { calories: 100, protein: 10, carbs: 20, fat: 5 };
      const b = { calories: 200, protein: 15, carbs: 30, fat: 10 };

      const result = addMacros(a, b);

      expect(result).toEqual({
        calories: 300,
        protein: 25,
        carbs: 50,
        fat: 15,
        fiber: 0,
      });
    });

    it('should handle fiber when present', () => {
      const a = { calories: 100, protein: 10, carbs: 20, fat: 5, fiber: 3 };
      const b = { calories: 200, protein: 15, carbs: 30, fat: 10, fiber: 7 };

      const result = addMacros(a, b);

      expect(result.fiber).toBe(10);
    });
  });

  describe('subtractMacros', () => {
    it('should subtract macros correctly', () => {
      const a = { calories: 300, protein: 25, carbs: 50, fat: 15 };
      const b = { calories: 100, protein: 10, carbs: 20, fat: 5 };

      const result = subtractMacros(a, b);

      expect(result).toEqual({
        calories: 200,
        protein: 15,
        carbs: 30,
        fat: 10,
        fiber: 0,
      });
    });

    it('should not go below zero', () => {
      const a = { calories: 100, protein: 5, carbs: 10, fat: 2 };
      const b = { calories: 200, protein: 10, carbs: 20, fat: 5 };

      const result = subtractMacros(a, b);

      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(0);
    });
  });

  describe('scaleMacros', () => {
    it('should scale macros by a factor', () => {
      const macros = { calories: 100, protein: 10, carbs: 20, fat: 5 };

      const result = scaleMacros(macros, 2);

      expect(result).toEqual({
        calories: 200,
        protein: 20,
        carbs: 40,
        fat: 10,
        fiber: undefined,
      });
    });

    it('should handle fractional scaling', () => {
      const macros = { calories: 100, protein: 10, carbs: 20, fat: 5 };

      const result = scaleMacros(macros, 0.5);

      expect(result.calories).toBe(50);
      expect(result.protein).toBe(5);
    });
  });

  describe('sumMacros', () => {
    it('should sum an array of macro objects', () => {
      const items = [
        { calories: 100, protein: 10, carbs: 20, fat: 5 },
        { calories: 200, protein: 15, carbs: 30, fat: 10 },
        { calories: 150, protein: 12, carbs: 25, fat: 8 },
      ];

      const result = sumMacros(items);

      expect(result.calories).toBe(450);
      expect(result.protein).toBe(37);
      expect(result.carbs).toBe(75);
      expect(result.fat).toBe(23);
    });

    it('should return empty macros for empty array', () => {
      const result = sumMacros([]);

      expect(result).toEqual(EMPTY_MACROS);
    });
  });

  describe('calculatePercentages', () => {
    it('should calculate correct percentages', () => {
      const consumed = { calories: 7000, protein: 350, carbs: 875, fat: 245 };
      const targets = { calories: 14000, protein: 700, carbs: 1750, fat: 490 };

      const result = calculatePercentages(consumed, targets);

      expect(result.calories).toBe(50);
      expect(result.protein).toBe(50);
      expect(result.carbs).toBe(50);
      expect(result.fat).toBe(50);
      expect(result.overall).toBe(50);
    });

    it('should handle zero targets', () => {
      const consumed = { calories: 100, protein: 10, carbs: 20, fat: 5 };
      const targets = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      const result = calculatePercentages(consumed, targets);

      expect(result.calories).toBe(0);
      expect(result.overall).toBe(0);
    });

    it('should weight overall correctly', () => {
      // calories: 40%, protein: 30%, carbs: 15%, fat: 15%
      const consumed = { calories: 14000, protein: 350, carbs: 1750, fat: 245 };
      const targets = { calories: 14000, protein: 700, carbs: 1750, fat: 490 };

      const result = calculatePercentages(consumed, targets);

      // calories: 100%, protein: 50%, carbs: 100%, fat: 50%
      // overall = 100*0.4 + 50*0.3 + 100*0.15 + 50*0.15 = 40 + 15 + 15 + 7.5 = 77.5 ≈ 78
      expect(result.overall).toBe(78);
    });
  });

  describe('divideMacros', () => {
    it('should divide macros by a divisor', () => {
      const macros = { calories: 1400, protein: 70, carbs: 175, fat: 49 };

      const result = divideMacros(macros, 7);

      expect(result.calories).toBe(200);
      expect(result.protein).toBe(10);
      expect(result.carbs).toBe(25);
      expect(result.fat).toBe(7);
    });

    it('should return empty for zero divisor', () => {
      const macros = { calories: 1400, protein: 70, carbs: 175, fat: 49 };

      const result = divideMacros(macros, 0);

      expect(result).toEqual(EMPTY_MACROS);
    });
  });

  describe('macrosToDaily', () => {
    it('should convert weekly targets to daily', () => {
      const weekly = { calories: 14000, protein: 700, carbs: 1750, fat: 490 };

      const result = macrosToDaily(weekly);

      expect(result.calories).toBe(2000);
      expect(result.protein).toBe(100);
      expect(result.carbs).toBe(250);
      expect(result.fat).toBe(70);
    });
  });
});
