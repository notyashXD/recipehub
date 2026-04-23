import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Recipe from '../models/Recipe';
import { generateWithFallback, getGeminiHealth } from '../services/geminiService';

const router = Router();
const MODEL = 'gemini-2.5-flash';
const VISION_MODEL = 'gemini-2.5-flash';

const DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const INGREDIENT_CATEGORIES = new Set(['protein', 'vegetable', 'fruit', 'dairy', 'grain', 'spice', 'oil', 'other']);

const uniqueStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );
};

const cleanModelText = (text: string): string =>
  text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

const parseJsonObject = (text: string): Record<string, any> | null => {
  const cleaned = cleanModelText(text);
  try {
    const direct = JSON.parse(cleaned);
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) return direct;
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const parseJsonArray = (text: string): any[] | null => {
  const cleaned = cleanModelText(text);
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct)) return direct;
  } catch {}

  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const toNumber = (value: unknown, fallback: number, min = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, parsed);
};

const fallbackRecipe = (ingredients: string[], preferences: any) => {
  const cuisine = typeof preferences?.cuisine === 'string' && preferences.cuisine.trim()
    ? preferences.cuisine.trim()
    : 'International';
  const leadIngredient = ingredients[0];
  return {
    title: `${leadIngredient.charAt(0).toUpperCase()}${leadIngredient.slice(1)} Pantry Bowl`,
    description: `A quick and flexible ${cuisine} recipe built from your available ingredients.`,
    cuisine,
    difficulty: DIFFICULTIES.has(String(preferences?.difficulty || '').toLowerCase())
      ? String(preferences.difficulty).toLowerCase()
      : 'beginner',
    prepTime: 10,
    cookTime: 18,
    servings: 2,
    dietaryTags: uniqueStrings(preferences?.diet ? [preferences.diet] : []),
    ingredients: ingredients.map((name) => ({
      name,
      quantity: 1,
      unit: 'piece',
      category: 'other',
      isOptional: false,
      substitutes: [],
    })),
    steps: [
      { order: 1, instruction: `Prep ${ingredients.join(', ')} and season to taste.`, duration: 8 },
      { order: 2, instruction: 'Cook ingredients using your preferred method until tender and flavorful.', duration: 12 },
      { order: 3, instruction: 'Taste, adjust seasoning, and serve warm.', duration: 3 },
    ],
    nutrition: { calories: 350, protein: 14, carbs: 35, fat: 14, fiber: 6 },
    tags: ['ai-generated', 'pantry-friendly'],
    images: [],
  };
};

const normalizeRecipeData = (raw: Record<string, any> | null, ingredients: string[], preferences: any) => {
  if (!raw) return fallbackRecipe(ingredients, preferences);

  const normalizedIngredients = (Array.isArray(raw.ingredients) ? raw.ingredients : [])
    .map((item: any) => {
      const name = String(item?.name || '').trim();
      if (!name) return null;
      const categoryRaw = String(item?.category || 'other').toLowerCase();
      return {
        name,
        quantity: toNumber(item?.quantity, 1, 0),
        unit: String(item?.unit || 'piece').trim() || 'piece',
        category: INGREDIENT_CATEGORIES.has(categoryRaw) ? categoryRaw : 'other',
        isOptional: Boolean(item?.isOptional),
        substitutes: uniqueStrings(item?.substitutes),
      };
    })
    .filter(Boolean) as any[];

  const finalIngredients = normalizedIngredients.length
    ? normalizedIngredients
    : ingredients.map((name) => ({
        name,
        quantity: 1,
        unit: 'piece',
        category: 'other',
        isOptional: false,
        substitutes: [],
      }));

  const normalizedSteps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((step: any, index: number) => {
      const instruction = String(step?.instruction || '').trim();
      if (!instruction) return null;
      return {
        order: index + 1,
        instruction,
        duration: toNumber(step?.duration, 5, 0),
      };
    })
    .filter(Boolean) as any[];

  const fallbackSteps = [
    { order: 1, instruction: `Prepare ${ingredients.join(', ')} and gather your pantry staples.`, duration: 8 },
    { order: 2, instruction: 'Cook in stages, starting with aromatics and longer-cooking ingredients.', duration: 12 },
    { order: 3, instruction: 'Finish with seasoning and plate immediately.', duration: 3 },
  ];

  const cuisine = String(raw.cuisine || preferences?.cuisine || 'International').trim() || 'International';
  const difficultyRaw = String(raw.difficulty || preferences?.difficulty || 'intermediate').toLowerCase();

  return {
    title: String(raw.title || `${ingredients[0]} Special`).trim(),
    description: String(raw.description || `A flavorful ${cuisine} recipe using your available ingredients.`).trim(),
    cuisine,
    difficulty: DIFFICULTIES.has(difficultyRaw) ? difficultyRaw : 'intermediate',
    prepTime: toNumber(raw.prepTime, 10, 0),
    cookTime: toNumber(raw.cookTime, 20, 0),
    servings: toNumber(raw.servings, 2, 1),
    dietaryTags: uniqueStrings(raw.dietaryTags || (preferences?.diet ? [preferences.diet] : [])),
    ingredients: finalIngredients,
    steps: normalizedSteps.length ? normalizedSteps : fallbackSteps,
    nutrition: {
      calories: toNumber(raw?.nutrition?.calories, 350, 0),
      protein: toNumber(raw?.nutrition?.protein, 14, 0),
      carbs: toNumber(raw?.nutrition?.carbs, 35, 0),
      fat: toNumber(raw?.nutrition?.fat, 14, 0),
      fiber: toNumber(raw?.nutrition?.fiber, 6, 0),
    },
    tags: uniqueStrings(raw.tags),
    images: uniqueStrings(raw.images),
  };
};

const normalizeExtractedIngredient = (item: any) => {
  const name = String(item?.name || '').trim();
  if (!name) return null;
  const categoryRaw = String(item?.category || 'other').toLowerCase();
  return {
    name,
    estimatedQuantity: toNumber(item?.estimatedQuantity, 1, 0),
    unit: String(item?.unit || 'piece').trim() || 'piece',
    category: INGREDIENT_CATEGORIES.has(categoryRaw) ? categoryRaw : 'other',
  };
};

const fallbackChatAnswer = (question: string): string => {
  const normalized = question.toLowerCase();
  if (normalized.includes('substitut')) {
    return 'Try replacing ingredients with similar role + texture: use Greek yogurt for creaminess, lemon for brightness, and mushrooms/tofu for hearty body. Share your exact recipe and I can suggest precise swaps.';
  }
  if (normalized.includes('time') || normalized.includes('cook')) {
    return 'For better timing: prep all ingredients first, preheat your pan/oven fully, and cook proteins on medium-high before adding sauces. If you share ingredients, I can give exact minute-by-minute timing.';
  }
  return "I'm having trouble reaching the AI service right now, but I can still help. Tell me your ingredients and preferred cuisine, and I'll suggest a practical recipe flow.";
};

const isGeminiUnavailableError = (err: unknown): boolean => {
  const message = String((err as any)?.message || err || '').toLowerCase();
  return (
    message.includes('quota') ||
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('all gemini api keys exhausted') ||
    message.includes('gemini service is unavailable')
  );
};

const fallbackSuggestions = (recipe: any) => {
  const ingredientNames = recipe.ingredients.slice(0, 3).map((i: any) => i.name).join(', ');
  return [
    {
      type: 'healthier',
      title: `${recipe.title} Lite`,
      changes: ['Use less oil or butter', 'Increase vegetables', 'Add lean protein where possible'],
      reason: `Keeps the flavor profile while making ${ingredientNames || 'core ingredients'} lighter and more balanced.`,
    },
    {
      type: 'quicker',
      title: `${recipe.title} Express`,
      changes: ['Prep ingredients in advance', 'Use one-pan workflow', 'Reduce simmering time by using pre-cooked components'],
      reason: 'Cuts active cook time while preserving the recipe structure.',
    },
    {
      type: 'gourmet',
      title: `${recipe.title} Chef Edition`,
      changes: ['Finish with fresh herbs', 'Add texture contrast', 'Plate with garnish and acidity'],
      reason: 'Improves depth, presentation, and restaurant-style finish.',
    },
  ];
};

router.get('/status', async (_req: Request, res: Response) => {
  const health = getGeminiHealth();
  if (!health.configuredKeys) {
    return res.status(503).json({ ok: false, ...health, message: 'No Gemini API keys configured.' });
  }

  const shouldProbe = String((_req.query?.probe as string) || '').toLowerCase() === 'true';
  if (!shouldProbe) {
    return res.json({
      ok: true,
      ...health,
      message: 'Gemini keys configured. Add ?probe=true to run a live API check.',
    });
  }

  try {
    const probe = await generateWithFallback(MODEL, 'Reply with exactly: OK');
    const ok = probe.toLowerCase().includes('ok');
    return res.json({ ok, ...health, message: ok ? 'Gemini is reachable.' : 'Gemini responded unexpectedly.' });
  } catch (err: any) {
    return res.status(503).json({
      ok: false,
      ...health,
      message: 'Gemini check failed.',
      error: isGeminiUnavailableError(err) ? 'Quota or key availability issue detected.' : 'Probe failed.',
    });
  }
});

// Generate recipe from ingredients
router.post('/generate-recipe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ingredients = uniqueStrings(req.body?.ingredients);
    const preferences = req.body?.preferences || {};
    const { diet, cuisine, maxTime, difficulty } = preferences;

    if (!ingredients.length) {
      return res.status(400).json({ message: 'Please provide at least one ingredient.' });
    }

    const prompt = `You are a professional chef. Generate a creative, delicious recipe using primarily these available ingredients: ${ingredients.join(', ')}.
${diet ? `Dietary requirement: ${diet}` : ''}
${cuisine ? `Preferred cuisine: ${cuisine}` : ''}
${maxTime ? `Maximum cooking time: ${maxTime} minutes` : ''}
${difficulty ? `Difficulty level: ${difficulty}` : ''}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "title": "Recipe Name",
  "description": "2-3 sentence appetizing description",
  "cuisine": "cuisine type",
  "difficulty": "beginner|intermediate|advanced",
  "prepTime": 10,
  "cookTime": 20,
  "servings": 4,
  "dietaryTags": ["tag1"],
  "ingredients": [
    {"name": "ingredient", "quantity": 1, "unit": "piece", "category": "protein|vegetable|fruit|dairy|grain|spice|oil|other", "isOptional": false, "substitutes": ["sub1"]}
  ],
  "steps": [{"order": 1, "instruction": "Step text", "duration": 5}],
  "nutrition": {"calories": 400, "protein": 20, "carbs": 40, "fat": 15, "fiber": 5},
  "tags": ["tag1"]
}`;

    const text = await generateWithFallback(MODEL, prompt);
    let recipeData = parseJsonObject(text);

    if (!recipeData) {
      const retryText = await generateWithFallback(
        MODEL,
        `${prompt}\n\nIMPORTANT: Return only pure JSON. Do not include commentary or markdown fences.`
      );
      recipeData = parseJsonObject(retryText);
    }

    const normalized = normalizeRecipeData(recipeData, ingredients, preferences);
    const fallbackImage = `https://images.unsplash.com/800x600/?${encodeURIComponent(`${normalized.cuisine} food recipe`)}`;
    const recipe = await Recipe.create({
      ...normalized,
      author: req.userId,
      isAIGenerated: true,
      isPublic: false,
      images: normalized.images.length ? normalized.images : [fallbackImage],
    });

    res.json(recipe);
  } catch (err: any) {
    console.error('AI generate error:', err?.message || err);
    if (isGeminiUnavailableError(err)) {
      try {
        const ingredients = uniqueStrings(req.body?.ingredients);
        if (!ingredients.length) {
          return res.status(400).json({ message: 'Please provide at least one ingredient.' });
        }
        const preferences = req.body?.preferences || {};
        const normalized = normalizeRecipeData(null, ingredients, preferences);
        const fallbackImage = `https://images.unsplash.com/800x600/?${encodeURIComponent(`${normalized.cuisine} food recipe`)}`;
        const recipe = await Recipe.create({
          ...normalized,
          author: req.userId,
          isAIGenerated: true,
          isPublic: false,
          images: normalized.images.length ? normalized.images : [fallbackImage],
          tags: Array.from(new Set([...(normalized.tags || []), 'fallback-generated'])),
        });
        return res.json({ ...recipe.toObject(), aiFallback: true });
      } catch (fallbackErr) {
        console.error('AI fallback generate error:', fallbackErr);
      }
    }
    res.status(500).json({ message: 'Failed to generate recipe. Please try again shortly.' });
  }
});

// Extract ingredients from image (Gemini Vision)
router.post('/extract-ingredients', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ message: 'Image data required' });
    }

    const prompt = `Analyze this fridge or pantry image and identify all visible food ingredients.
Return ONLY a valid JSON array (no markdown, no extra text):
[
  {"name": "ingredient name", "estimatedQuantity": 1, "unit": "piece|kg|g|L|ml|cup|bunch|pack", "category": "protein|vegetable|fruit|dairy|grain|spice|oil|other"}
]
Be specific. If unsure, make your best guess.`;

    const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const text = await generateWithFallback(VISION_MODEL, [prompt, imagePart]);
    const parsed = parseJsonArray(text) || [];
    const ingredients = parsed
      .map((item) => normalizeExtractedIngredient(item))
      .filter(Boolean);

    if (!ingredients.length) {
      return res.status(422).json({ message: 'No ingredients could be extracted from the image.' });
    }

    res.json({ ingredients });
  } catch (err: any) {
    console.error('Extract ingredients error:', err?.message || err);
    if (isGeminiUnavailableError(err)) {
      return res.status(503).json({
        message: 'AI scanner is temporarily unavailable due to API quota. Please add ingredients manually for now.',
      });
    }
    res.status(500).json({ message: 'Failed to extract ingredients. Please try again shortly.' });
  }
});

// Suggest recipe improvements
router.post('/improve-recipe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { recipeId, userNotes } = req.body;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const prompt = `Given this recipe: "${recipe.title}" with ingredients: ${recipe.ingredients.map((i) => i.name).join(', ')}.
User feedback: "${userNotes || 'Please suggest improvements'}"

Suggest 3 variations as a JSON array (no markdown, no extra text):
[
  {"type": "healthier", "title": "Lighter Version Name", "changes": ["change1"], "reason": "why healthier"},
  {"type": "quicker", "title": "Quick Version Name", "changes": ["change1"], "reason": "how it saves time"},
  {"type": "gourmet", "title": "Gourmet Version Name", "changes": ["change1"], "reason": "what makes it special"}
]`;

    const text = await generateWithFallback(MODEL, prompt);
    const suggestions = parseJsonArray(text);
    if (!suggestions) throw new Error('No valid JSON');

    res.json({ suggestions });
  } catch (err: any) {
    if (isGeminiUnavailableError(err)) {
      const recipe = await Recipe.findById(req.body?.recipeId);
      if (recipe) {
        return res.json({ suggestions: fallbackSuggestions(recipe), aiFallback: true });
      }
    }
    res.status(500).json({ message: 'Failed to generate suggestions. Please try again shortly.' });
  }
});

// AI Chat — public, no auth needed
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, context, recipeTitle, history } = req.body || {};
    const cleanQuestion = String(question || '').trim();
    if (!cleanQuestion) return res.status(400).json({ message: 'Question is required' });

    const safeHistory = Array.isArray(history)
      ? history
          .filter((item) => ['user', 'assistant'].includes(String(item?.role)))
          .map((item) => ({
            role: String(item.role),
            text: String(item.text || '').trim(),
          }))
          .filter((item) => item.text)
          .slice(-8)
      : [];

    const historyBlock = safeHistory.length
      ? `Conversation so far:\n${safeHistory.map((item) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.text}`).join('\n')}\n`
      : '';

    const prompt = `You are Chef AI, a friendly and knowledgeable cooking assistant with expertise in all cuisines.
You're here to help home cooks succeed in the kitchen with practical, encouraging advice.

${recipeTitle ? `Current Recipe: ${recipeTitle}\n` : ''}${context ? `Context: ${context}\n` : ''}${historyBlock}Question: ${cleanQuestion}

GUIDELINES:
- Provide specific, actionable advice (not generic)
- Include cooking tips and pro techniques when relevant
- Mention substitutions or alternatives if applicable
- Keep responses helpful and encouraging
- Use casual, friendly language
- Limit to 250 words

Answer the question thoughtfully:`;

    try {
      const text = await generateWithFallback(MODEL, prompt);
      return res.json({
        answer: text,
        timestamp: new Date(),
        source: 'Chef AI',
      });
    } catch {
      return res.json({
        answer: fallbackChatAnswer(cleanQuestion),
        timestamp: new Date(),
        source: 'Chef AI (fallback)',
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to get answer. Please try again shortly.' });
  }
});

export default router;
