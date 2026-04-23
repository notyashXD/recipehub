import { Router, Response } from 'express';
import Recipe from '../models/Recipe';
import User from '../models/User';
import CookHistory from '../models/CookHistory';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// Get all public recipes with filters
router.get('/', async (req: any, res: Response) => {
  try {
    const { cuisine, difficulty, diet, time, search, page = 1, limit = 20, sort = 'createdAt' } = req.query;
    const query: any = { isPublic: true };

    if (cuisine) query.cuisine = cuisine;
    if (difficulty) query.difficulty = difficulty;
    if (diet) query.dietaryTags = { $in: [diet] };
    if (time) {
      const maxTime = parseInt(time as string);
      query.$expr = { $lte: [{ $add: ['$prepTime', '$cookTime'] }, maxTime] };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    const sortMap: any = {
      createdAt: { createdAt: -1 },
      popular: { 'likes': -1 },
      rating: { averageRating: -1 },
      quick: { cookTime: 1 },
    };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort(sortMap[sort as string] || { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .populate('author', 'username avatar')
        .lean(),
      Recipe.countDocuments(query),
    ]);

    res.json({ recipes, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Get single recipe
router.get('/:id', async (req: any, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username avatar cookingLevel')
      .populate('forkedFrom', 'title author');

    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.viewCount += 1;
    await recipe.save();
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create recipe
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recipe = await Recipe.create({ ...req.body, author: req.userId });
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Update recipe
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (recipe.author.toString() !== req.userId) return res.status(403).json({ message: 'Unauthorized' });

    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete recipe
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (recipe.author.toString() !== req.userId) return res.status(403).json({ message: 'Unauthorized' });

    await recipe.deleteOne();
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like / unlike recipe
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const userId = new mongoose.Types.ObjectId(req.userId);
    const liked = recipe.likes.some((id) => id.equals(userId));

    if (liked) {
      recipe.likes = recipe.likes.filter((id) => !id.equals(userId));
    } else {
      recipe.likes.push(userId);
    }
    await recipe.save();
    res.json({ liked: !liked, likesCount: recipe.likes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fork recipe
router.post('/:id/fork', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const original = await Recipe.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Recipe not found' });

    const forked = await Recipe.create({
      ...original.toObject(),
      _id: new mongoose.Types.ObjectId(),
      title: `${original.title} (Remix)`,
      author: req.userId,
      forkedFrom: original._id,
      likes: [],
      forks: [],
      ratings: [],
      viewCount: 0,
      createdAt: undefined,
      updatedAt: undefined,
    });

    original.forks.push(forked._id);
    await original.save();
    res.status(201).json(forked);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate recipe
router.post('/:id/rate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { score, review } = req.body;
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const userId = new mongoose.Types.ObjectId(req.userId);
    const existingIdx = recipe.ratings.findIndex((r) => r.user.equals(userId));
    if (existingIdx >= 0) {
      recipe.ratings[existingIdx] = { user: userId, score, review };
    } else {
      recipe.ratings.push({ user: userId, score, review });
    }
    recipe.averageRating = recipe.ratings.reduce((sum, r) => sum + r.score, 0) / recipe.ratings.length;
    await recipe.save();
    res.json({ averageRating: recipe.averageRating, totalRatings: recipe.ratings.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/unsave recipe
router.post('/:id/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recipeId = new mongoose.Types.ObjectId(req.params.id);
    const saved = user.savedRecipes.some((id) => id.equals(recipeId));
    if (saved) {
      user.savedRecipes = user.savedRecipes.filter((id) => !id.equals(recipeId));
    } else {
      user.savedRecipes.push(recipeId);
    }
    await user.save();
    res.json({ saved: !saved });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as cooked
router.post('/:id/cooked', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { servingsMade, rating, notes } = req.body;
    const history = await CookHistory.create({
      user: req.userId,
      recipe: req.params.id,
      servingsMade,
      rating,
      notes,
    });

    // Update user stats
    const user = await User.findById(req.userId);
    if (user) {
      user.totalRecipesCooked += 1;
      const today = new Date();
      const last = user.lastCookedAt;
      if (last) {
        const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        user.streakDays = diff <= 1 ? user.streakDays + 1 : 1;
      } else {
        user.streakDays = 1;
      }
      user.lastCookedAt = today;

      // Badges
      if (user.totalRecipesCooked === 1 && !user.badges.includes('first-cook')) user.badges.push('first-cook');
      if (user.streakDays >= 7 && !user.badges.includes('week-streak')) user.badges.push('week-streak');
      if (user.totalRecipesCooked >= 10 && !user.badges.includes('chef-in-training')) user.badges.push('chef-in-training');
      if (user.totalRecipesCooked >= 50 && !user.badges.includes('master-chef')) user.badges.push('master-chef');

      await user.save();
    }
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my recipes
router.get('/my/recipes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const recipes = await Recipe.find({ author: req.userId }).sort({ createdAt: -1 }).lean();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cook history
router.get('/my/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const history = await CookHistory.find({ user: req.userId })
      .sort({ cookedAt: -1 })
      .limit(50)
      .populate('recipe', 'title images cuisine');
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
