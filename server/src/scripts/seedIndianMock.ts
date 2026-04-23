import 'dotenv/config';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe';
import User from '../models/User';

const INDIAN_RECIPES = [
  {
    title: 'Butter Chicken',
    description: 'Creamy, rich North Indian curry with tender chicken in a tomato-cream sauce.',
    prepTime: 20, cookTime: 35, servings: 4, difficulty: 'intermediate',
    ingredients: [
      { name: 'chicken breast', quantity: 700, unit: 'g', category: 'protein', isOptional: false, substitutes: ['chicken thigh'] },
      { name: 'yogurt', quantity: 100, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'tomato puree', quantity: 200, unit: 'ml', category: 'vegetable', isOptional: false, substitutes: ['canned tomato'] },
      { name: 'heavy cream', quantity: 150, unit: 'ml', category: 'dairy', isOptional: false, substitutes: ['coconut cream'] },
      { name: 'ginger garlic paste', quantity: 30, unit: 'g', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garam masala', quantity: 2, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'chili powder', quantity: 1.5, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'butter', quantity: 50, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 2, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'oil', quantity: 30, unit: 'ml', category: 'oil', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Marinate chicken in yogurt, ginger-garlic paste, garam masala, and chili powder for at least 30 minutes.', duration: 30 },
      { order: 2, instruction: 'Heat oil in a pan and cook chicken pieces until golden on both sides. Remove and set aside.', duration: 10 },
      { order: 3, instruction: 'In the same pan, fry diced onions until golden brown, then add tomato puree and cook for 3-4 minutes.', duration: 8 },
      { order: 4, instruction: 'Add the cooked chicken back to the pan along with heavy cream and butter. Simmer for 10-12 minutes until sauce thickens.', duration: 12 },
      { order: 5, instruction: 'Season with salt and more garam masala if needed. Finish with cream and cilantro. Serve hot with rice or naan.', duration: 5 }
    ],
    nutrition: { calories: 420, protein: 38, carbs: 12, fat: 24, fiber: 2 },
    images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800'],
    tags: ['butter chicken', 'curry', 'indian', 'chicken'],
    dietaryTags: []
  },
  {
    title: 'Paneer Tikka Masala',
    description: 'Soft paneer in a rich, spiced creamy tomato sauce. A vegetarian classic with bold flavors.',
    prepTime: 15, cookTime: 30, servings: 4, difficulty: 'intermediate',
    ingredients: [
      { name: 'paneer', quantity: 500, unit: 'g', category: 'dairy', isOptional: false, substitutes: ['tofu'] },
      { name: 'yogurt', quantity: 100, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'tomato puree', quantity: 250, unit: 'ml', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'heavy cream', quantity: 150, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 2, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'ginger', quantity: 20, unit: 'g', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 8, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garam masala', quantity: 2, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'chili powder', quantity: 1.5, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'oil', quantity: 40, unit: 'ml', category: 'oil', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Cut paneer into 2cm cubes and marinate in yogurt with chili powder and salt for 20 minutes.', duration: 20 },
      { order: 2, instruction: 'Heat oil and cook marinated paneer pieces on all sides until golden. Set aside.', duration: 10 },
      { order: 3, instruction: 'In the same oil, sauté finely chopped onions until translucent, add minced ginger-garlic and cook for 2 minutes.', duration: 8 },
      { order: 4, instruction: 'Add tomato puree and cook for 5 minutes, then add garam masala, chili powder, and salt. Simmer for 5 minutes.', duration: 10 },
      { order: 5, instruction: 'Add the cooked paneer and heavy cream. Simmer for 10 minutes. Finish with fresh cilantro and serve.', duration: 10 }
    ],
    nutrition: { calories: 380, protein: 22, carbs: 15, fat: 28, fiber: 2 },
    images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'],
    tags: ['paneer', 'tikka masala', 'vegetarian', 'indian'],
    dietaryTags: ['vegetarian']
  },
  {
    title: 'Dal Makhani',
    description: 'Creamy lentil curry with kidney beans, butter, and cream. A restaurant favorite.',
    prepTime: 10, cookTime: 45, servings: 4, difficulty: 'intermediate',
    ingredients: [
      { name: 'black lentils', quantity: 150, unit: 'g', category: 'grain', isOptional: false, substitutes: ['kidney beans'] },
      { name: 'red kidney beans', quantity: 150, unit: 'g', category: 'grain', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 2, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'tomato', quantity: 3, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'ginger', quantity: 15, unit: 'g', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 6, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garam masala', quantity: 2, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'cumin powder', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'butter', quantity: 50, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'heavy cream', quantity: 100, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Soak lentils and kidney beans overnight or for at least 4 hours. Pressure cook until tender (about 30 minutes).', duration: 35 },
      { order: 2, instruction: 'Heat butter in a pan and sauté diced onions until golden. Add ginger-garlic paste and cook for 2 minutes.', duration: 8 },
      { order: 3, instruction: 'Add diced tomatoes and cook until they break down completely, about 5-7 minutes.', duration: 7 },
      { order: 4, instruction: 'Add the cooked lentils and beans to the tomato mixture along with garam masala and cumin powder.', duration: 3 },
      { order: 5, instruction: 'Simmer for 15 minutes, then stir in heavy cream. Simmer for another 5 minutes. Serve hot with rice or bread.', duration: 20 }
    ],
    nutrition: { calories: 320, protein: 18, carbs: 42, fat: 8, fiber: 10 },
    images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800'],
    tags: ['dal', 'lentils', 'vegetarian', 'indian', 'protein'],
    dietaryTags: ['vegetarian', 'vegan']
  },
  {
    title: 'Chole Bhature',
    description: 'Spiced chickpea curry served with deep-fried, puffy bread. A beloved North Indian street food.',
    prepTime: 20, cookTime: 45, servings: 4, difficulty: 'advanced',
    ingredients: [
      { name: 'chickpeas', quantity: 400, unit: 'g', category: 'grain', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 3, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'tomato', quantity: 3, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'ginger', quantity: 20, unit: 'g', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 8, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garam masala', quantity: 2, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'chili powder', quantity: 2, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'all-purpose flour', quantity: 300, unit: 'g', category: 'grain', isOptional: false, substitutes: [] },
      { name: 'yogurt', quantity: 100, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'oil', quantity: 100, unit: 'ml', category: 'oil', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Soak chickpeas overnight. Pressure cook until nearly soft (about 25 minutes). Drain.', duration: 25 },
      { order: 2, instruction: 'Heat oil and sauté onions until brown. Add ginger-garlic paste, then tomato puree. Cook for 5 minutes.', duration: 8 },
      { order: 3, instruction: 'Add cooked chickpeas to the masala. Add garam masala, chili powder, salt. Simmer for 20 minutes until rich.', duration: 20 },
      { order: 4, instruction: 'For bhature, mix flour, yogurt, salt, and let dough rise for 2-3 hours until fluffy.', duration: 180 },
      { order: 5, instruction: 'Heat oil to 180°C and deep fry dough portions until golden and puffed. Serve hot with the chole curry.', duration: 15 }
    ],
    nutrition: { calories: 510, protein: 16, carbs: 68, fat: 18, fiber: 8 },
    images: ['https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800'],
    tags: ['chole', 'bhature', 'chickpea', 'indian', 'street food'],
    dietaryTags: ['vegetarian']
  },
  {
    title: 'Chana Masala',
    description: 'Tangy and spiced chickpea curry. Perfect with rice, naan, or as a street food side.',
    prepTime: 10, cookTime: 30, servings: 4, difficulty: 'beginner',
    ingredients: [
      { name: 'chickpeas', quantity: 400, unit: 'g', category: 'grain', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 2, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'tomato', quantity: 3, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'ginger', quantity: 15, unit: 'g', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 6, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'cumin', quantity: 1.5, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'coriander powder', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'chili powder', quantity: 1.5, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'amchur', quantity: 1, unit: 'tsp', category: 'spice', isOptional: true, substitutes: ['lemon juice'] },
      { name: 'oil', quantity: 30, unit: 'ml', category: 'oil', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Heat oil and temper cumin seeds. Sauté diced onions until golden brown.', duration: 7 },
      { order: 2, instruction: 'Add ginger-garlic paste and cook for 2 minutes until fragrant.', duration: 3 },
      { order: 3, instruction: 'Add chopped tomatoes, coriander powder, chili powder. Cook until tomatoes soften completely.', duration: 8 },
      { order: 4, instruction: 'Add boiled chickpeas, amchur (or lemon juice), and salt. Mix well.', duration: 2 },
      { order: 5, instruction: 'Simmer for 10 minutes until oil starts to separate. Garnish with fresh cilantro and serve.', duration: 10 }
    ],
    nutrition: { calories: 240, protein: 12, carbs: 35, fat: 6, fiber: 8 },
    images: ['https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800'],
    tags: ['chana', 'chickpea', 'vegetarian', 'indian', 'vegan'],
    dietaryTags: ['vegetarian', 'vegan']
  },
  {
    title: 'Palak Paneer',
    description: 'Creamy spinach curry with soft paneer cubes. Rich in iron and nutrients, a restaurant favorite.',
    prepTime: 15, cookTime: 25, servings: 4, difficulty: 'intermediate',
    ingredients: [
      { name: 'fresh spinach', quantity: 500, unit: 'g', category: 'vegetable', isOptional: false, substitutes: ['frozen spinach'] },
      { name: 'paneer', quantity: 250, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 1.5, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'tomato', quantity: 1, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'ginger', quantity: 10, unit: 'g', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 4, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'cream', quantity: 100, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'butter', quantity: 30, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'garam masala', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'oil', quantity: 20, unit: 'ml', category: 'oil', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Blanch spinach in boiling water for 2 minutes, then blend into a smooth paste.', duration: 5 },
      { order: 2, instruction: 'Heat butter and oil, sauté chopped onions until soft. Add ginger-garlic paste and cook for 1 minute.', duration: 5 },
      { order: 3, instruction: 'Add tomato puree and cook for 2-3 minutes until oil separates.', duration: 3 },
      { order: 4, instruction: 'Add spinach puree and cook for 5 minutes, stirring frequently.', duration: 5 },
      { order: 5, instruction: 'Add paneer cubes, cream, garam masala, and salt. Simmer for 5 minutes. Serve hot with roti or rice.', duration: 8 }
    ],
    nutrition: { calories: 310, protein: 20, carbs: 10, fat: 22, fiber: 3 },
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
    tags: ['palak', 'spinach', 'paneer', 'vegetarian', 'indian'],
    dietaryTags: ['vegetarian']
  },
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'demo@recipebox.com' });
    if (!user) {
      console.error('❌ Demo user not found. Run main seed script first!');
      process.exit(1);
    }

    await Recipe.deleteMany({ cuisine: 'Indian' });
    console.log('🗑️  Cleared old Indian recipes');

    const recipes = INDIAN_RECIPES.map(r => ({
      ...r,
      author: user._id,
      isPublic: true,
      isAIGenerated: false,
      cuisine: 'Indian',
    }));

    const inserted = await Recipe.insertMany(recipes);
    console.log(`\n✅ Seeded ${inserted.length} proper Indian recipes with detailed instructions!`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

main();
