import { Router, Response } from 'express';
import Recipe from '../models/Recipe';
import Pantry from '../models/Pantry';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { matchRecipes } from '../services/matchingEngine';

const router = Router();

// Match recipes based on user's pantry
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { cuisine, difficulty, diet, maxTime, limit = 50 } = req.query;

    const pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry || pantry.items.length === 0) {
      return res.json({ matches: [], message: 'Add ingredients to your pantry to see matches!' });
    }

    const pantryIngredients = pantry.items.map((item) => item.ingredient);

    const recipeQuery: any = { isPublic: true };
    if (cuisine) recipeQuery.cuisine = cuisine;
    if (difficulty) recipeQuery.difficulty = difficulty;
    if (diet) recipeQuery.dietaryTags = { $in: [diet] };
    if (maxTime) recipeQuery.$expr = { $lte: [{ $add: ['$prepTime', '$cookTime'] }, parseInt(maxTime as string)] };

    const recipes = await Recipe.find(recipeQuery).limit(parseInt(limit as string) * 3).lean() as any[];
    const matches = matchRecipes(recipes, pantryIngredients).slice(0, parseInt(limit as string));

    res.json({
      matches,
      pantryCount: pantryIngredients.length,
      totalRecipesChecked: recipes.length,
      canCookNow: matches.filter((m) => m.canCookNow).length,
      oneMissing: matches.filter((m) => m.oneMissing && !m.canCookNow).length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Match based on custom ingredient list (no auth needed)
router.post('/custom', async (req: any, res: Response) => {
  try {
    const { ingredients, cuisine, difficulty, diet, maxTime } = req.body;
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ message: 'Please provide ingredients' });
    }

    const recipeQuery: any = { isPublic: true };
    if (cuisine) recipeQuery.cuisine = cuisine;
    if (difficulty) recipeQuery.difficulty = difficulty;
    if (diet) recipeQuery.dietaryTags = { $in: [diet] };
    if (maxTime) recipeQuery.$expr = { $lte: [{ $add: ['$prepTime', '$cookTime'] }, parseInt(maxTime)] };

    const recipes = await Recipe.find(recipeQuery).limit(150).lean() as any[];
    const matches = matchRecipes(recipes, ingredients).slice(0, 50);

    res.json({
      matches,
      canCookNow: matches.filter((m) => m.canCookNow).length,
      oneMissing: matches.filter((m) => m.oneMissing && !m.canCookNow).length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
