import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import Pantry from '../models/Pantry';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const generateToken = (userId: string, username: string) =>
  jwt.sign({ userId, username }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

const emailValidation = body('email')
  .trim()
  .isEmail({ allow_display_name: false, require_tld: true })
  .withMessage('Please provide a valid email address')
  .normalizeEmail();

const getValidationMessage = (req: Request): string | null => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array()[0]?.msg as string;
};

// Register
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 40 })
      .withMessage('Username must be between 3 and 40 characters')
      .matches(/^[a-zA-Z0-9._\-\s]+$/)
      .withMessage('Username can only contain letters, numbers, spaces, dots, dashes, and underscores'),
    emailValidation,
    body('password').isLength({ min: 6, max: 72 }).withMessage('Password must be between 6 and 72 characters'),
  ],
  async (req: Request, res: Response) => {
    const validationMessage = getValidationMessage(req);
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    try {
      const username = String(req.body.username).trim();
      const email = String(req.body.email).trim().toLowerCase();
      const password = String(req.body.password);
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) return res.status(409).json({ message: 'Username or email already exists' });

      const user = await User.create({ username, email, password });
      await Pantry.create({ user: user._id, items: [] });

      const token = generateToken(user._id.toString(), user.username);
      res.status(201).json({
        token,
        user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, streakDays: user.streakDays },
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    emailValidation,
    body('password').trim().notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    const validationMessage = getValidationMessage(req);
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    try {
      const email = String(req.body.email).trim().toLowerCase();
      const password = String(req.body.password);
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = generateToken(user._id.toString(), user.username);
      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          streakDays: user.streakDays,
          cookingLevel: user.cookingLevel,
          dietaryPreferences: user.dietaryPreferences,
          badges: user.badges,
          totalRecipesCooked: user.totalRecipesCooked,
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password').populate('savedRecipes', 'title images cuisine');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { bio, dietaryPreferences, cookingLevel, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { bio, dietaryPreferences, cookingLevel, avatar },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
