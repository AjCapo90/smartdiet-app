# OCR/AI Research for Diet Plan Extraction

## Problem Statement
Extract structured meal plan data from photos of diet plans provided by nutritionists.

## Recommended Approach: OpenAI Vision API (GPT-4o)

### Why GPT-4o?
1. **Best-in-class vision understanding** - Can read handwritten notes, tables, and various formats
2. **Structured output** - Can return JSON matching our schema
3. **Context understanding** - Understands nutritional context (meal types, macros, portions)
4. **Language support** - Works with Italian diet plans (Alessandro's use case)

### Implementation Plan

```typescript
// services/ocr.service.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DIET_PLAN_PROMPT = `
Analyze this diet plan image and extract structured data.

Return JSON with this exact structure:
{
  "confidence": 0.0-1.0,
  "weeklyTargets": {
    "calories": number or null,
    "protein": number or null,
    "carbs": number or null,
    "fat": number or null
  },
  "meals": [
    {
      "dayOfWeek": 0-6 (Monday=0),
      "mealType": "breakfast" | "lunch" | "dinner" | "snack",
      "name": "meal name",
      "description": "optional details",
      "macros": {
        "calories": estimated number,
        "protein": grams,
        "carbs": grams,
        "fat": grams
      },
      "ingredients": [
        { "name": "...", "quantity": number, "unit": "..." }
      ]
    }
  ],
  "rawText": "full text extraction",
  "warnings": ["any issues or uncertainties"]
}

Guidelines:
- Estimate macros if not explicitly stated (use standard nutritional databases)
- Parse both Italian and English meal names
- Handle various formats: tables, lists, handwritten notes
- If a day is missing, skip it
- Note confidence level for each meal
`;

export async function parseDietPlanImage(
  imageBase64: string,
  mimeType: string
): Promise<ParsedDietPlan> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: DIET_PLAN_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}
```

### Cost Estimate
- GPT-4o Vision: ~$0.01-0.03 per image (depending on size)
- Acceptable for user-initiated uploads

### Alternative Options Evaluated

| Option | Pros | Cons |
|--------|------|------|
| **Google Cloud Vision** | Good OCR, cheaper | No semantic understanding, just text |
| **Azure Document Intelligence** | Table extraction | Requires post-processing for meals |
| **Tesseract (local)** | Free, private | Poor on handwriting, no context |
| **Claude Vision** | Good understanding | API availability varies |
| **Gemini Vision** | Competitive pricing | Less consistent JSON output |

### Recommendation
**Use GPT-4o** for MVP. It provides the best balance of accuracy, structured output, and ease of implementation.

## Meal Parsing from Text/Voice

For parsing natural language meal descriptions:

```typescript
const MEAL_PARSE_PROMPT = `
Parse this meal description into structured data:
"${userInput}"

Return JSON:
{
  "name": "concise meal name",
  "items": [
    {
      "name": "food item",
      "quantity": number,
      "unit": "g/ml/piece/serving/etc",
      "macros": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }
  ],
  "totalMacros": { ... },
  "confidence": 0.0-1.0,
  "suggestions": ["optional tips for better tracking"]
}

Use USDA food database estimates for macros.
Handle Italian and English food names.
`;
```

### Cost Optimization
- Use GPT-3.5-turbo for meal parsing (faster, cheaper)
- Cache common meal patterns
- Use local nutritional database for standard items

## Implementation Priority

1. **Phase 1 (MVP)**: Manual diet plan creation only
2. **Phase 2**: Text-based meal parsing with GPT-3.5
3. **Phase 3**: Diet plan photo OCR with GPT-4o
4. **Phase 4**: Voice input (Web Speech API → text → GPT-3.5)

## Environment Variables Needed

```env
OPENAI_API_KEY=sk-...
```

## Testing Plan
1. Collect 10-20 sample diet plan photos (various formats)
2. Test extraction accuracy
3. Measure response times
4. Fine-tune prompts based on results

---

*Research completed: 2026-02-01*
