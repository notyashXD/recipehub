import { Router, Response } from 'express';
import Recipe from '../models/Recipe';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get community recipes feed
router.get('/feed', async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'popular', cuisine, diet } = req.query;
    const query: any = { isPublic: true };
    if (cuisine) query.cuisine = cuisine;
    if (diet) query.dietaryTags = { $in: [diet] };

    const sortMap: any = {
      popular: { 'likes': -1 },
      newest: { createdAt: -1 },
      rating: { averageRating: -1 },
      trending: { viewCount: -1 },
    };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort(sortMap[sort as string] || { 'likes': -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .populate('author', 'username avatar cookingLevel')
        .lean(),
      Recipe.countDocuments(query),
    ]);

    res.json({ recipes, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending recipes (most liked in last 7 days)
router.get('/trending', async (req: any, res: Response) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recipes = await Recipe.find({ isPublic: true, createdAt: { $gte: weekAgo } })
      .sort({ 'likes': -1, viewCount: -1 })
      .limit(10)
      .populate('author', 'username avatar')
      .lean();

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top chefs
router.get('/top-chefs', async (req: any, res: Response) => {
  try {
    const chefs = await User.find()
      .sort({ totalRecipesCooked: -1, streakDays: -1 })
      .limit(10)
      .select('username avatar bio cookingLevel streakDays totalRecipesCooked badges');
    res.json(chefs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile with their public recipes
router.get('/users/:username', async (req: any, res: Response) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recipes = await Recipe.find({ author: user._id, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ user, recipes });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
