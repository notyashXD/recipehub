import Fuse from 'fuse.js';
import { IRecipe } from '../models/Recipe';

export interface MatchResult {
  recipe: IRecipe & { _id: any };
  score: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  missingCount: number;
  canCookNow: boolean;
  oneMissing: boolean;
  substituteOptions: { missing: string; substitutes: string[] }[];
}

// Ingredient categories for category-based matching
const CATEGORY_MAP: Record<string, string[]> = {
  oil: ['olive oil', 'vegetable oil', 'canola oil', 'sunflower oil', 'coconut oil', 'sesame oil', 'avocado oil'],
  vinegar: ['white vinegar', 'apple cider vinegar', 'red wine vinegar', 'balsamic vinegar'],
  sugar: ['white sugar', 'brown sugar', 'caster sugar', 'icing sugar', 'powdered sugar', 'honey', 'maple syrup'],
  flour: ['all-purpose flour', 'wheat flour', 'self-rising flour', 'bread flour', 'rice flour'],
  milk: ['whole milk', 'skim milk', 'almond milk', 'oat milk', 'soy milk', 'coconut milk'],
  cheese: ['cheddar', 'mozzarella', 'parmesan', 'feta', 'ricotta', 'gouda', 'brie'],
  tomato: ['tomato', 'tomatoes', 'cherry tomato', 'roma tomato', 'plum tomato', 'tomato paste', 'canned tomato'],
  onion: ['onion', 'white onion', 'red onion', 'yellow onion', 'shallot', 'spring onion', 'green onion', 'scallion'],
  garlic: ['garlic', 'garlic clove', 'garlic powder', 'minced garlic'],
  pepper: ['black pepper', 'white pepper', 'red pepper', 'chili pepper', 'cayenne', 'paprika'],
};

function categoricalMatch(recipeIngredient: string, pantryIngredients: string[]): boolean {
  const recLower = recipeIngredient.toLowerCase();
  for (const [category, members] of Object.entries(CATEGORY_MAP)) {
    const recipeIsCategory = members.some((m) => recLower.includes(m) || m.includes(recLower));
    if (recipeIsCategory) {
      const pantryHasCategory = pantryIngredients.some((p) =>
        members.some((m) => p.toLowerCase().includes(m) || m.includes(p.toLowerCase()))
      );
      if (pantryHasCategory) return true;
    }
  }
  return false;
}

export function matchRecipes(recipes: (IRecipe & { _id: any })[], pantryItems: string[]): MatchResult[] {
  const pantryLower = pantryItems.map((p) => p.toLowerCase().trim());

  // Fuse.js for fuzzy matching pantry items
  const fuse = new Fuse(pantryLower, { threshold: 0.35, includeScore: true });

  const results: MatchResult[] = recipes.map((recipe) => {
    const required = recipe.ingredients.filter((ing) => !ing.isOptional);
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];
    const substituteOptions: { missing: string; substitutes: string[] }[] = [];

    for (const ing of required) {
      const ingName = ing.name.toLowerCase().trim();

      // 1. Direct substring match
      const directMatch = pantryLower.some(
        (p) => p.includes(ingName) || ingName.includes(p)
      );

      if (directMatch) {
        matchedIngredients.push(ing.name);
        continue;
      }

      // 2. Fuzzy match
      const fuzzyResults = fuse.search(ingName);
      if (fuzzyResults.length > 0 && (fuzzyResults[0].score || 1) < 0.4) {
        matchedIngredients.push(ing.name);
        continue;
      }

      // 3. Categorical match
      if (categoricalMatch(ingName, pantryLower)) {
        matchedIngredients.push(ing.name);
        continue;
      }

      // 4. Substitute check
      if (ing.substitutes && ing.substitutes.length > 0) {
        const subMatch = ing.substitutes.some((sub) =>
          pantryLower.some((p) => p.includes(sub.toLowerCase()) || sub.toLowerCase().includes(p))
        );
        if (subMatch) {
          matchedIngredients.push(ing.name);
          continue;
        }
        substituteOptions.push({ missing: ing.name, substitutes: ing.substitutes });
      }

      missingIngredients.push(ing.name);
    }

    const total = required.length || 1;
    const matched = matchedIngredients.length;

    // Scoring formula
    let baseScore = (matched / total) * 100;

    // Bonus: all key ingredients matched (protein + main carb)
    const keyIngredients = required.filter((i) =>
      ['protein', 'grain'].includes(i.category)
    );
    const keyMatched = keyIngredients.every((ki) =>
      matchedIngredients.some((m) => m.toLowerCase() === ki.name.toLowerCase())
    );
    if (keyMatched && keyIngredients.length > 0) baseScore = Math.min(baseScore + 8, 100);

    // Penalty for missing critical ingredients
    const criticalMissing = missingIngredients.filter((m) =>
      required.some((r) => r.name.toLowerCase() === m.toLowerCase() && ['protein', 'grain'].includes(r.category))
    ).length;
    baseScore = Math.max(baseScore - criticalMissing * 5, 0);

    const finalScore = Math.round(Math.min(Math.max(baseScore, 0), 100));
    const canCookNow = finalScore >= 85;
    const oneMissing = missingIngredients.length === 1;

    return {
      recipe,
      score: finalScore,
      matchedIngredients,
      missingIngredients,
      missingCount: missingIngredients.length,
      canCookNow,
      oneMissing,
      substituteOptions,
    };
  });

  // Sort: canCookNow → oneMissing → score DESC → totalTime ASC
  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (a.canCookNow !== b.canCookNow) return a.canCookNow ? -1 : 1;
      if (a.oneMissing !== b.oneMissing) return a.oneMissing ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.recipe.prepTime + a.recipe.cookTime;
      const bTime = b.recipe.prepTime + b.recipe.cookTime;
      return aTime - bTime;
    });
}
