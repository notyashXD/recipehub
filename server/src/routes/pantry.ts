import { Router, Response } from 'express';
import Pantry from '../models/Pantry';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user pantry
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) {
      pantry = await Pantry.create({ user: req.userId, items: [] });
    }
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add ingredient to pantry
router.post('/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ingredient, quantity, unit, category, expiryDate, barcode, notes } = req.body;
    let pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) pantry = await Pantry.create({ user: req.userId, items: [] });

    // Check for duplicate ingredient
    const existing = pantry.items.findIndex(
      (item) => item.ingredient.toLowerCase() === ingredient.toLowerCase()
    );

    if (existing >= 0) {
      pantry.items[existing].quantity += quantity || 1;
      if (expiryDate) pantry.items[existing].expiryDate = new Date(expiryDate);
    } else {
      pantry.items.push({ ingredient, quantity: quantity || 1, unit: unit || 'piece', category: category || 'other', expiryDate: expiryDate ? new Date(expiryDate) : undefined, addedAt: new Date(), barcode, notes });
    }

    pantry.lastUpdated = new Date();
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Add multiple ingredients at once
router.post('/items/bulk', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    let pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) pantry = await Pantry.create({ user: req.userId, items: [] });

    for (const item of items) {
      const existing = pantry.items.findIndex(
        (p) => p.ingredient.toLowerCase() === item.ingredient.toLowerCase()
      );
      if (existing >= 0) {
        pantry.items[existing].quantity += item.quantity || 1;
      } else {
        pantry.items.push({ ...item, addedAt: new Date() });
      }
    }

    pantry.lastUpdated = new Date();
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Update pantry item
router.put('/items/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) return res.status(404).json({ message: 'Pantry not found' });

    const item = pantry.items.find((entry) => entry._id?.toString() === req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    Object.assign(item, req.body);
    pantry.lastUpdated = new Date();
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove ingredient from pantry
router.delete('/items/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) return res.status(404).json({ message: 'Pantry not found' });

    pantry.items = pantry.items.filter((item: any) => item._id.toString() !== req.params.itemId);
    pantry.lastUpdated = new Date();
    await pantry.save();
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear pantry
router.delete('/clear', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pantry = await Pantry.findOneAndUpdate(
      { user: req.userId },
      { items: [], lastUpdated: new Date() },
      { new: true }
    );
    res.json(pantry);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expiring items (within next N days)
router.get('/expiring', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 3;
    const pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) return res.json([]);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const expiring = pantry.items.filter(
      (item) => item.expiryDate && item.expiryDate <= cutoff
    );
    res.json(expiring);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Lookup barcode via Open Food Facts
router.get('/barcode/:code', async (req: any, res: Response) => {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${req.params.code}.json`
    );
    const product = response.data.product;
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({
      name: product.product_name || product.product_name_en || 'Unknown',
      brand: product.brands,
      categories: product.categories_tags,
      nutriscore: product.nutriscore_grade,
      image: product.image_url,
    });
  } catch (err) {
    res.status(500).json({ message: 'Barcode lookup failed' });
  }
});

export default router;
