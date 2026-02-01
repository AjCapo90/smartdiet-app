# Calo - Adaptive Nutrition

**Tagline:** Complete your perfect nutrition week.

## Overview

Calo helps users stick to their nutrition goals with flexibility. Upload your diet plan, log what you actually eat, and Calo recalculates your remaining meals to hit your weekly macro targets.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | NX 22.x |
| Frontend | Angular 21, Tailwind CSS, NgRx Signals |
| Backend | Fastify 5.x, TypeScript |
| Database | SQLite (dev) → PostgreSQL (prod) |
| ORM | Drizzle ORM |
| AI/OCR | OpenAI Vision API (GPT-4o) |
| Voice | Web Speech API (browser native) |
| Auth | JWT + Refresh tokens |

---

## Folder Structure

```
calo/
├── apps/
│   ├── web/                    # Angular frontend
│   │   └── src/
│   │       ├── app/
│   │       │   ├── core/       # Services, guards, interceptors
│   │       │   ├── features/   # Feature modules
│   │       │   │   ├── onboarding/
│   │       │   │   ├── dashboard/
│   │       │   │   ├── meal-log/
│   │       │   │   └── recommendations/
│   │       │   ├── shared/     # Shared components, pipes, directives
│   │       │   └── layout/     # App shell, nav, sidebar
│   │       └── assets/
│   └── api/                    # Fastify backend
│       └── src/
│           ├── app/
│           │   ├── plugins/    # Fastify plugins (auth, db, etc)
│           │   ├── routes/     # API routes
│           │   ├── services/   # Business logic
│           │   └── utils/      # Helpers
│           └── db/
│               ├── schema/     # Drizzle schema definitions
│               └── migrations/ # Database migrations
├── libs/
│   └── shared/
│       └── types/              # Shared TypeScript types
│           └── src/
│               ├── models/     # Domain models
│               ├── dto/        # Data transfer objects
│               └── enums/      # Shared enums
└── tools/                      # Build/dev scripts
```

---

## Data Models

### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

interface UserPreferences {
  timezone: string;
  weekStartDay: 'monday' | 'sunday';
  units: 'metric' | 'imperial';
}
```

### DietPlan
```typescript
interface DietPlan {
  id: string;
  userId: string;
  name: string;
  sourceImageUrl?: string;       // Original uploaded image
  weeklyTargets: MacroTargets;
  meals: PlannedMeal[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MacroTargets {
  calories: number;              // kcal per week
  protein: number;               // grams per week
  carbs: number;                 // grams per week
  fat: number;                   // grams per week
  fiber?: number;                // optional
}
```

### PlannedMeal (from diet plan)
```typescript
interface PlannedMeal {
  id: string;
  dietPlanId: string;
  dayOfWeek: DayOfWeek;          // 0-6 (Monday-Sunday)
  mealType: MealType;            // breakfast, lunch, dinner, snack
  name: string;
  description?: string;
  macros: MacroValues;
  ingredients?: Ingredient[];
}

interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}
```

### MealLog (what user actually ate)
```typescript
interface MealLog {
  id: string;
  userId: string;
  dietPlanId: string;
  loggedAt: Date;
  mealType: MealType;
  inputMethod: 'text' | 'voice' | 'photo';
  rawInput: string;              // Original user input
  parsedMeal: ParsedMeal;
  macros: MacroValues;
  matchedPlannedMealId?: string; // If this was a planned meal
  isSubstitute: boolean;         // If user deviated from plan
}

interface ParsedMeal {
  name: string;
  items: FoodItem[];
  confidence: number;            // AI parsing confidence 0-1
}

interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  macros: MacroValues;
}
```

### WeekProgress
```typescript
interface WeekProgress {
  userId: string;
  dietPlanId: string;
  weekStart: Date;
  consumed: MacroValues;         // Total consumed so far
  remaining: MacroValues;        // Remaining to hit targets
  percentComplete: number;       // 0-100
  daysLogged: number;
  recommendations: MealRecommendation[];
}

interface MealRecommendation {
  mealType: MealType;
  dayOfWeek: DayOfWeek;
  originalMeal: PlannedMeal;
  adjustedMeal?: PlannedMeal;    // Modified to compensate
  adjustmentReason?: string;
  priority: 'required' | 'suggested' | 'optional';
}
```

### Enums
```typescript
enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6
}
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |

### Diet Plans
| Method | Path | Description |
|--------|------|-------------|
| GET | `/diet-plans` | List user's diet plans |
| POST | `/diet-plans` | Create new diet plan |
| GET | `/diet-plans/:id` | Get diet plan details |
| PUT | `/diet-plans/:id` | Update diet plan |
| DELETE | `/diet-plans/:id` | Delete diet plan |
| POST | `/diet-plans/:id/activate` | Set as active plan |
| POST | `/diet-plans/parse-image` | OCR: Extract plan from photo |

### Meal Logs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/meals` | List meal logs (with date filters) |
| POST | `/meals` | Log a meal |
| GET | `/meals/:id` | Get meal log details |
| PUT | `/meals/:id` | Update meal log |
| DELETE | `/meals/:id` | Delete meal log |
| POST | `/meals/parse` | AI: Parse meal from text/voice |

### Progress & Recommendations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/progress/week` | Get current week progress |
| GET | `/progress/week/:date` | Get specific week progress |
| GET | `/recommendations` | Get meal recommendations |
| GET | `/recommendations/substitute` | Get substitute meal options |

### User
| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/profile` | Get user profile |
| PUT | `/user/profile` | Update profile |
| PUT | `/user/preferences` | Update preferences |

---

## Macro Recalculation Algorithm

### Core Logic

```typescript
function recalculateMacros(
  weeklyTargets: MacroTargets,
  consumed: MacroValues,
  remainingMeals: PlannedMeal[],
  currentDay: DayOfWeek
): MealRecommendation[] {
  
  // 1. Calculate remaining macros needed
  const remaining = subtractMacros(weeklyTargets, consumed);
  
  // 2. Calculate remaining meals count by type
  const mealSlots = countRemainingMealSlots(remainingMeals, currentDay);
  
  // 3. Distribute remaining macros across meal slots
  const targetPerMeal = distributeMacros(remaining, mealSlots);
  
  // 4. For each remaining meal, adjust or suggest substitutes
  const recommendations = remainingMeals
    .filter(m => isInFuture(m, currentDay))
    .map(meal => {
      const adjustment = calculateAdjustment(meal, targetPerMeal);
      return {
        originalMeal: meal,
        adjustedMeal: adjustment.needed ? adjustment.meal : undefined,
        adjustmentReason: adjustment.reason,
        priority: calculatePriority(adjustment, remaining)
      };
    });
  
  // 5. Sort by priority and return
  return recommendations.sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}
```

### Adjustment Strategies

1. **Portion Scaling**: Increase/decrease portions of planned meals
2. **Ingredient Swaps**: Suggest swapping ingredients (e.g., more chicken, less rice)
3. **Meal Substitution**: Replace entire meal with macro-appropriate alternative
4. **Addition Strategy**: Suggest adding high-protein snacks if behind on protein

### Prioritization

- **Required**: Meals needed to hit minimum macro thresholds (e.g., < 80% protein)
- **Suggested**: Adjustments to optimize macro balance
- **Optional**: Minor tweaks for perfection

---

## Third-Party Integrations

### OpenAI Vision API (Diet Plan OCR)

Used to extract structured meal data from photographed diet plans.

```typescript
// Prompt structure for diet plan parsing
const prompt = `
Analyze this diet plan image and extract:
1. Weekly macro targets (if visible)
2. All planned meals with:
   - Day of week
   - Meal type (breakfast/lunch/dinner/snack)
   - Meal name and description
   - Estimated macros (calories, protein, carbs, fat)
   - Ingredients with quantities

Return as JSON matching the DietPlan schema.
`;
```

### OpenAI GPT-4 (Meal Parsing)

Used to parse natural language meal descriptions into structured data.

```typescript
// Prompt for meal parsing
const prompt = `
Parse this meal description into structured data:
"${userInput}"

Return:
- Meal name
- Individual food items with quantities and units
- Estimated macros for each item
- Total macros
- Confidence score (0-1)

Use common nutritional databases for macro estimates.
`;
```

### Web Speech API (Voice Input)

Browser-native speech recognition for meal logging.

```typescript
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US'; // or user preference

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Send to meal parsing API
};
```

---

## Security

- **Password Hashing**: bcrypt with cost factor 12
- **JWT Access Tokens**: 15-minute expiry
- **Refresh Tokens**: 7-day expiry, stored in httpOnly cookie
- **Rate Limiting**: 100 req/min authenticated, 20 req/min unauthenticated
- **Input Validation**: Zod schemas on all endpoints
- **CORS**: Strict origin checking in production

---

## Development Workflow

### Feature Branch Flow

1. Create feature branch: `feat/feature-name`
2. Develop with commits following conventional commits
3. Push and open PR
4. Review and iterate
5. Squash merge to main

### Commit Convention

```
feat: add meal logging via voice input
fix: correct macro calculation for partial days
docs: update API endpoint documentation
refactor: extract macro utilities to shared lib
test: add unit tests for recalculation algorithm
```

### Running Locally

```bash
# Start all apps
npx nx run-many --target=serve --all

# Start specific app
npx nx serve web
npx nx serve api

# Run tests
npx nx test shared-types
npx nx test web
npx nx test api

# Build for production
npx nx build web --configuration=production
npx nx build api --configuration=production
```

---

## MVP Scope (v0.1)

### Must Have
- [ ] User registration/login
- [ ] Manual diet plan creation (no OCR yet)
- [ ] Text-based meal logging
- [ ] Basic macro tracking dashboard
- [ ] Simple weekly progress view

### Should Have
- [ ] Diet plan OCR extraction
- [ ] Voice meal logging
- [ ] Meal recommendations

### Won't Have (v0.1)
- [ ] Alexa integration
- [ ] Social features
- [ ] Premium subscription

---

## UI/UX Screens

### 1. Onboarding Flow
- Welcome screen with value prop
- Upload diet plan (photo) OR create manually
- Set weekly macro targets
- Set preferences (timezone, units)

### 2. Dashboard
- Current week progress ring chart
- Today's remaining meals
- Quick "Log Meal" FAB
- Weekly macro bars (protein/carbs/fat)

### 3. Meal Logging
- Text input with AI parsing
- Voice recording button
- Preview parsed meal before saving
- Macro breakdown of logged meal

### 4. Recommendations
- List of suggested meals to complete the week
- Each meal shows: name, macros, why it's recommended
- Tap to see alternatives

### 5. Diet Plan View
- Weekly calendar grid
- Each cell shows meal for that slot
- Tap to see details/edit
- Upload new plan button

---

## Future Roadmap

- **v0.2**: OCR diet plan extraction, voice logging
- **v0.3**: Smart recommendations, meal substitutions
- **v0.4**: Recipe integration, shopping list generation
- **v0.5**: Social features, meal sharing
- **v1.0**: Premium features, advanced analytics
