import { dietPlanService } from './diet-plan.service';
import { mealService } from './meal.service';

interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export class ProgressService {
  async getWeekProgress(userId: string, weekStart?: Date) {
    const startDate = weekStart || this.getWeekStart(new Date());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    // Get active diet plan
    const plan = await dietPlanService.getActivePlan(userId);
    
    if (!plan) {
      return {
        error: 'No active diet plan',
        weekStart: startDate,
        weekEnd: endDate,
      };
    }
    
    // Get meals logged this week
    const meals = await mealService.getWeekMeals(userId, startDate);
    
    // Calculate consumed macros
    const consumed = meals.reduce<MacroValues>(
      (acc, meal) => ({
        calories: acc.calories + meal.macros.calories,
        protein: acc.protein + meal.macros.protein,
        carbs: acc.carbs + meal.macros.carbs,
        fat: acc.fat + meal.macros.fat,
        fiber: (acc.fiber || 0) + (meal.macros.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
    
    // Calculate remaining
    const targets = plan.weeklyTargets;
    const remaining: MacroValues = {
      calories: Math.max(0, targets.calories - consumed.calories),
      protein: Math.max(0, targets.protein - consumed.protein),
      carbs: Math.max(0, targets.carbs - consumed.carbs),
      fat: Math.max(0, targets.fat - consumed.fat),
      fiber: targets.fiber ? Math.max(0, targets.fiber - (consumed.fiber || 0)) : undefined,
    };
    
    // Calculate percentages
    const percentages = {
      calories: Math.round((consumed.calories / targets.calories) * 100),
      protein: Math.round((consumed.protein / targets.protein) * 100),
      carbs: Math.round((consumed.carbs / targets.carbs) * 100),
      fat: Math.round((consumed.fat / targets.fat) * 100),
      overall: 0,
    };
    
    // Overall weighted: calories 40%, protein 30%, carbs 15%, fat 15%
    percentages.overall = Math.round(
      percentages.calories * 0.4 +
      percentages.protein * 0.3 +
      percentages.carbs * 0.15 +
      percentages.fat * 0.15
    );
    
    // Calculate daily breakdown
    const dailyBreakdown = this.calculateDailyBreakdown(meals, startDate);
    
    // Calculate days with logs
    const daysWithLogs = new Set(
      meals.map(m => new Date(m.loggedAt).toDateString())
    ).size;
    
    // Calculate days elapsed
    const now = new Date();
    const daysElapsed = Math.min(
      7,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    return {
      dietPlanId: plan.id,
      dietPlanName: plan.name,
      weekStart: startDate,
      weekEnd: endDate,
      targets,
      consumed,
      remaining,
      percentages,
      daysLogged: daysWithLogs,
      daysElapsed,
      totalMealsLogged: meals.length,
      plannedMealsCount: plan.meals.length,
      dailyBreakdown,
    };
  }
  
  async getRecommendations(userId: string) {
    const progress = await this.getWeekProgress(userId);
    
    if ('error' in progress) {
      return { error: progress.error, recommendations: [] };
    }
    
    const plan = await dietPlanService.getActivePlan(userId);
    if (!plan) {
      return { error: 'No active diet plan', recommendations: [] };
    }
    
    const recommendations = [];
    const remaining = progress.remaining;
    const daysLeft = 7 - progress.daysElapsed;
    
    if (daysLeft <= 0) {
      return { recommendations: [] };
    }
    
    // Calculate daily targets for remaining days
    const dailyNeeded = {
      calories: Math.round(remaining.calories / daysLeft),
      protein: Math.round(remaining.protein / daysLeft),
      carbs: Math.round(remaining.carbs / daysLeft),
      fat: Math.round(remaining.fat / daysLeft),
    };
    
    // Find future planned meals
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Convert to Mon=0
    
    const futureMeals = plan.meals.filter(m => m.dayOfWeek > adjustedToday);
    
    // Analyze deficits
    const proteinDeficitPercent = 100 - progress.percentages.protein;
    
    if (proteinDeficitPercent > 30 && futureMeals.length > 0) {
      // Significant protein deficit - suggest high protein swaps
      const dinnerMeals = futureMeals.filter(m => m.mealType === 'dinner');
      
      if (dinnerMeals.length > 0) {
        const meal = dinnerMeals[0];
        recommendations.push({
          id: `rec-${meal.id}`,
          type: 'swap',
          priority: 'required',
          mealType: meal.mealType,
          dayOfWeek: meal.dayOfWeek,
          originalMeal: meal.name,
          suggestion: `Swap to a high-protein alternative (+20g protein)`,
          reason: `You're ${Math.round(remaining.protein)}g short on weekly protein`,
          macroImpact: {
            calories: 50,
            protein: 20,
            carbs: -10,
            fat: 5,
          },
        });
      }
    }
    
    // Check if calories are too low
    if (progress.percentages.calories < 50 && daysLeft <= 3) {
      recommendations.push({
        id: 'rec-add-snacks',
        type: 'add',
        priority: 'suggested',
        suggestion: 'Add calorie-dense snacks',
        reason: `Only ${progress.percentages.calories}% of weekly calories consumed with ${daysLeft} days left`,
        macroImpact: {
          calories: 300,
          protein: 10,
          carbs: 30,
          fat: 15,
        },
      });
    }
    
    return {
      remaining,
      dailyTargetForRemaining: dailyNeeded,
      daysLeft,
      recommendations,
    };
  }
  
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  private calculateDailyBreakdown(
    meals: any[],
    weekStart: Date
  ): { date: Date; dayOfWeek: number; consumed: MacroValues; mealCount: number }[] {
    const breakdown = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayMeals = meals.filter(m => {
        const logDate = new Date(m.loggedAt);
        return logDate.toDateString() === date.toDateString();
      });
      
      const consumed = dayMeals.reduce<MacroValues>(
        (acc, meal) => ({
          calories: acc.calories + meal.macros.calories,
          protein: acc.protein + meal.macros.protein,
          carbs: acc.carbs + meal.macros.carbs,
          fat: acc.fat + meal.macros.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      
      breakdown.push({
        date,
        dayOfWeek: i,
        consumed,
        mealCount: dayMeals.length,
      });
    }
    
    return breakdown;
  }
}

export const progressService = new ProgressService();
