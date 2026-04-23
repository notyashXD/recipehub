import { Router, Response } from 'express';
import MealPlan from '../models/MealPlan';
import Recipe from '../models/Recipe';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get meal plan for a week
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { weekStart } = req.query;
    const query: any = { user: req.userId };
    if (weekStart) query.weekStart = new Date(weekStart as string);

    const plans = await MealPlan.find(query)
      .sort({ weekStart: -1 })
      .limit(4)
      .populate('meals.recipe', 'title images cuisine prepTime cookTime nutrition servings');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update meal plan
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { weekStart, meals } = req.body;
    const startDate = new Date(weekStart);

    let plan = await MealPlan.findOne({ user: req.userId, weekStart: startDate });
    if (plan) {
      plan.meals = meals;
      await plan.save();
    } else {
      plan = await MealPlan.create({ user: req.userId, weekStart: startDate, meals });
    }

    await plan.populate('meals.recipe', 'title images cuisine prepTime cookTime nutrition servings');
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Add meal to plan
router.post('/:planId/meals', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.planId, user: req.userId });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    plan.meals.push(req.body);
    await plan.save();
    await plan.populate('meals.recipe', 'title images cuisine prepTime cookTime nutrition servings');
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove meal from plan
router.delete('/:planId/meals/:mealId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.planId, user: req.userId });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    plan.meals = plan.meals.filter((m: any) => m._id.toString() !== req.params.mealId);
    await plan.save();
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate shopping list from meal plan
router.post('/:planId/shopping-list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.planId, user: req.userId })
      .populate('meals.recipe');

    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const ingredientMap: Map<string, { quantity: number; unit: string }> = new Map();

    for (const meal of plan.meals) {
      const recipe = meal.recipe as any;
      if (!recipe || !recipe.ingredients) continue;
      const multiplier = meal.servings / (recipe.servings || 1);

      for (const ing of recipe.ingredients) {
        if (ing.isOptional) continue;
        const key = ing.name.toLowerCase();
        if (ingredientMap.has(key)) {
          ingredientMap.get(key)!.quantity += (ing.quantity || 1) * multiplier;
        } else {
          ingredientMap.set(key, { quantity: (ing.quantity || 1) * multiplier, unit: ing.unit || 'piece' });
        }
      }
    }

    plan.shoppingList = Array.from(ingredientMap.entries()).map(([ingredient, { quantity, unit }]) => ({
      ingredient,
      quantity: Math.ceil(quantity),
      unit,
      checked: false,
    }));

    await plan.save();
    res.json({ shoppingList: plan.shoppingList });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle shopping list item
router.put('/:planId/shopping-list/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.planId, user: req.userId });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const item = plan.shoppingList.find((i: any) => i._id.toString() === req.params.itemId);
    if (item) item.checked = !item.checked;
    await plan.save();
    res.json(plan.shoppingList);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
