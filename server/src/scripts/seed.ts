import 'dotenv/config';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe';
import User from '../models/User';
import Pantry from '../models/Pantry';

const SEED_USER = { username: 'RecipeHub', email: 'demo@recipebox.com', password: 'demo1234' };

const RECIPES = [
  {
    title: 'Classic Spaghetti Carbonara',
    description: 'Creamy Italian pasta with eggs, cheese, and pancetta. Authentic Roman dish with no cream.',
    cuisine: 'Italian',
    difficulty: 'intermediate',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    dietaryTags: [],
    tags: ['pasta', 'italian', 'classic'],
    images: ['https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800'],
    nutrition: { calories: 520, protein: 22, carbs: 58, fat: 21, fiber: 3 },
    ingredients: [
      { name: 'spaghetti', quantity: 400, unit: 'g', category: 'grain', isOptional: false, substitutes: ['linguine'] },
      { name: 'eggs', quantity: 4, unit: 'piece', category: 'protein', isOptional: false, substitutes: [] },
      { name: 'pancetta', quantity: 150, unit: 'g', category: 'protein', isOptional: false, substitutes: ['bacon'] },
      { name: 'parmesan', quantity: 100, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'black pepper', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'salt', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Bring salted water to boil. Cook spaghetti until al dente.', duration: 10 },
      { order: 2, instruction: 'Fry pancetta cubes until crispy. Reserve fat.', duration: 8 },
      { order: 3, instruction: 'Whisk egg yolks with parmesan and black pepper.', duration: 3 },
      { order: 4, instruction: 'Drain pasta, reserve water. Toss hot pasta with pancetta off heat.', duration: 2 },
      { order: 5, instruction: 'Add egg mix, toss constantly, adding pasta water to create creamy sauce.', duration: 5 },
    ],
  },
  {
    title: 'Chicken Tikka Masala',
    description: 'Tender chicken in rich, spiced tomato-cream sauce. Restaurant favorite.',
    cuisine: 'Indian',
    difficulty: 'intermediate',
    prepTime: 20,
    cookTime: 35,
    servings: 4,
    dietaryTags: ['gluten-free'],
    tags: ['indian', 'chicken', 'curry'],
    images: ['https://images.unsplash.com/photo-1603894584214-5d0420e14a28?w=800'],
    nutrition: { calories: 450, protein: 35, carbs: 20, fat: 22, fiber: 4 },
    ingredients: [
      { name: 'chicken breast', quantity: 700, unit: 'g', category: 'protein', isOptional: false, substitutes: [] },
      { name: 'yogurt', quantity: 150, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'tomato puree', quantity: 200, unit: 'ml', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'heavy cream', quantity: 100, unit: 'ml', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'ginger garlic paste', quantity: 30, unit: 'g', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garam masala', quantity: 2, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'chili powder', quantity: 1.5, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 2, unit: 'medium', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'oil', quantity: 30, unit: 'ml', category: 'oil', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Marinate chicken in yogurt with spices for 30 min.', duration: 30 },
      { order: 2, instruction: 'Grill chicken until charred and cooked through.', duration: 10 },
      { order: 3, instruction: 'Sauté onions, add ginger-garlic paste, cook 2 min.', duration: 5 },
      { order: 4, instruction: 'Add tomato puree, cook until soft. Blend sauce smooth.', duration: 10 },
      { order: 5, instruction: 'Add cooked chicken, cream, and spices. Simmer 10 min.', duration: 12 },
    ],
  },
  {
    title: 'Avocado Toast with Poached Egg',
    description: 'Creamy avocado on crispy sourdough with perfectly poached egg.',
    cuisine: 'American',
    difficulty: 'beginner',
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    dietaryTags: ['vegetarian'],
    tags: ['breakfast', 'healthy', 'quick'],
    images: ['https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800'],
    nutrition: { calories: 320, protein: 14, carbs: 28, fat: 18, fiber: 7 },
    ingredients: [
      { name: 'avocado', quantity: 2, unit: 'piece', category: 'fruit', isOptional: false, substitutes: [] },
      { name: 'sourdough bread', quantity: 2, unit: 'slice', category: 'grain', isOptional: false, substitutes: [] },
      { name: 'eggs', quantity: 2, unit: 'piece', category: 'protein', isOptional: false, substitutes: [] },
      { name: 'lemon', quantity: 1, unit: 'piece', category: 'fruit', isOptional: false, substitutes: [] },
      { name: 'red pepper flakes', quantity: 0.5, unit: 'tsp', category: 'spice', isOptional: true, substitutes: [] },
      { name: 'salt', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Toast bread until golden and crispy.', duration: 3 },
      { order: 2, instruction: 'Mash avocado with lemon juice, salt, and pepper.', duration: 2 },
      { order: 3, instruction: 'Poach eggs in simmering water with vinegar for 3-4 min.', duration: 4 },
      { order: 4, instruction: 'Spread avocado on toast, top with poached egg.', duration: 1 },
      { order: 5, instruction: 'Sprinkle red pepper flakes, salt, and pepper. Serve immediately.', duration: 1 },
    ],
  },
  {
    title: 'Beef Stir Fry with Vegetables',
    description: 'Quick and flavorful beef stir fry with colorful vegetables in soy-ginger sauce.',
    cuisine: 'Asian',
    difficulty: 'beginner',
    prepTime: 15,
    cookTime: 15,
    servings: 3,
    dietaryTags: [],
    tags: ['beef', 'stir-fry', 'quick'],
    images: ['https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800'],
    nutrition: { calories: 380, protein: 28, carbs: 22, fat: 16, fiber: 4 },
    ingredients: [
      { name: 'beef strips', quantity: 500, unit: 'g', category: 'protein', isOptional: false, substitutes: [] },
      { name: 'bell pepper', quantity: 2, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'broccoli', quantity: 200, unit: 'g', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'soy sauce', quantity: 3, unit: 'tbsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 3, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'ginger', quantity: 1, unit: 'tsp', category: 'spice', isOptional: true, substitutes: [] },
      { name: 'sesame oil', quantity: 1, unit: 'tbsp', category: 'oil', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Cut beef into thin strips. Toss with soy sauce and let sit 10 min.', duration: 10 },
      { order: 2, instruction: 'Heat oil in wok on high heat. Stir fry beef until browned. Remove.', duration: 6 },
      { order: 3, instruction: 'Stir fry peppers and broccoli until tender-crisp.', duration: 5 },
      { order: 4, instruction: 'Return beef, add garlic, ginger, soy sauce. Toss all together.', duration: 3 },
      { order: 5, instruction: 'Serve immediately over rice.', duration: 1 },
    ],
  },
  {
    title: 'Mushroom Risotto',
    description: 'Velvety Arborio rice cooked slowly with earthy mushrooms and white wine.',
    cuisine: 'Italian',
    difficulty: 'intermediate',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    dietaryTags: ['vegetarian', 'gluten-free'],
    tags: ['risotto', 'italian', 'mushroom'],
    images: ['https://images.unsplash.com/photo-1534422298391-e4f8c170db06?w=800'],
    nutrition: { calories: 420, protein: 12, carbs: 62, fat: 14, fiber: 3 },
    ingredients: [
      { name: 'arborio rice', quantity: 300, unit: 'g', category: 'grain', isOptional: false, substitutes: [] },
      { name: 'mushrooms', quantity: 400, unit: 'g', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 1, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 2, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'white wine', quantity: 150, unit: 'ml', category: 'other', isOptional: true, substitutes: [] },
      { name: 'vegetable stock', quantity: 1, unit: 'L', category: 'other', isOptional: false, substitutes: [] },
      { name: 'parmesan', quantity: 80, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'butter', quantity: 30, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Sauté mushrooms in butter until golden. Season and set aside.', duration: 7 },
      { order: 2, instruction: 'Soften onion and garlic in pan with butter until fragrant.', duration: 5 },
      { order: 3, instruction: 'Add rice, toast 2 min. Pour wine, stir until absorbed.', duration: 5 },
      { order: 4, instruction: 'Add warm stock ladle by ladle, stirring constantly for 18-20 min.', duration: 20 },
      { order: 5, instruction: 'Stir in mushrooms, parmesan, butter. Rest 2 min. Serve immediately.', duration: 3 },
    ],
  },
  {
    title: 'Greek Salad',
    description: 'Fresh Mediterranean salad with feta, olives, and crisp vegetables.',
    cuisine: 'Mediterranean',
    difficulty: 'beginner',
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    dietaryTags: ['vegetarian', 'gluten-free', 'vegan'],
    tags: ['salad', 'healthy', 'quick'],
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'],
    nutrition: { calories: 180, protein: 7, carbs: 12, fat: 13, fiber: 3 },
    ingredients: [
      { name: 'tomato', quantity: 3, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'cucumber', quantity: 1, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'red onion', quantity: 0.5, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'feta cheese', quantity: 200, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'olives', quantity: 100, unit: 'g', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'olive oil', quantity: 3, unit: 'tbsp', category: 'oil', isOptional: false, substitutes: [] },
      { name: 'oregano', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'lemon', quantity: 1, unit: 'piece', category: 'fruit', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Cut tomatoes and cucumber into chunks. Thinly slice red onion.', duration: 5 },
      { order: 2, instruction: 'Combine vegetables and olives in a large bowl.', duration: 2 },
      { order: 3, instruction: 'Cube feta cheese and add to salad.', duration: 2 },
      { order: 4, instruction: 'Drizzle with olive oil and fresh lemon juice.', duration: 1 },
      { order: 5, instruction: 'Sprinkle oregano, salt, and pepper. Toss and serve.', duration: 1 },
    ],
  },
  {
    title: 'Banana Pancakes',
    description: 'Fluffy 3-ingredient pancakes made with banana and eggs. Gluten-free and naturally sweet.',
    cuisine: 'American',
    difficulty: 'beginner',
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    dietaryTags: ['vegetarian', 'gluten-free'],
    tags: ['breakfast', 'pancakes', 'easy'],
    images: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'],
    nutrition: { calories: 210, protein: 10, carbs: 30, fat: 6, fiber: 3 },
    ingredients: [
      { name: 'banana', quantity: 2, unit: 'piece', category: 'fruit', isOptional: false, substitutes: [] },
      { name: 'eggs', quantity: 2, unit: 'piece', category: 'protein', isOptional: false, substitutes: [] },
      { name: 'butter', quantity: 1, unit: 'tbsp', category: 'dairy', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Mash bananas thoroughly. Whisk in eggs until smooth.', duration: 3 },
      { order: 2, instruction: 'Heat butter in non-stick pan over medium heat.', duration: 2 },
      { order: 3, instruction: 'Drop small spoonfuls of batter on hot pan.', duration: 2 },
      { order: 4, instruction: 'Cook 2 min on each side until golden.', duration: 4 },
      { order: 5, instruction: 'Serve hot with honey or fresh berries.', duration: 1 },
    ],
  },
  {
    title: 'Lentil Soup',
    description: 'Hearty and nutritious red lentil soup with warm spices and silky texture.',
    cuisine: 'Mediterranean',
    difficulty: 'beginner',
    prepTime: 10,
    cookTime: 30,
    servings: 6,
    dietaryTags: ['vegan', 'gluten-free', 'vegetarian'],
    tags: ['soup', 'lentil', 'healthy'],
    images: ['https://images.unsplash.com/photo-1506985925498-4a20db969e73?w=800'],
    nutrition: { calories: 240, protein: 14, carbs: 38, fat: 4, fiber: 12 },
    ingredients: [
      { name: 'red lentils', quantity: 300, unit: 'g', category: 'protein', isOptional: false, substitutes: [] },
      { name: 'onion', quantity: 1, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'garlic', quantity: 3, unit: 'clove', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'carrot', quantity: 2, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'cumin', quantity: 2, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'turmeric', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
      { name: 'vegetable stock', quantity: 1.5, unit: 'L', category: 'other', isOptional: false, substitutes: [] },
      { name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'oil', isOptional: false, substitutes: [] },
      { name: 'lemon', quantity: 1, unit: 'piece', category: 'fruit', isOptional: true, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Heat oil. Dice and sauté onion, carrots, garlic until soft.', duration: 7 },
      { order: 2, instruction: 'Add cumin and turmeric. Toast for 30 seconds until fragrant.', duration: 1 },
      { order: 3, instruction: 'Add lentils and vegetable stock. Bring to boil.', duration: 5 },
      { order: 4, instruction: 'Simmer 20-25 min until lentils break down completely.', duration: 25 },
      { order: 5, instruction: 'Blend soup smooth or partially. Finish with lemon juice.', duration: 3 },
    ],
  },
  {
    title: 'Margherita Pizza',
    description: 'Classic Neapolitan pizza with fresh basil and buffalo mozzarella.',
    cuisine: 'Italian',
    difficulty: 'intermediate',
    prepTime: 90,
    cookTime: 12,
    servings: 2,
    dietaryTags: ['vegetarian'],
    tags: ['pizza', 'italian', 'classic'],
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'],
    nutrition: { calories: 580, protein: 22, carbs: 72, fat: 20, fiber: 4 },
    ingredients: [
      { name: 'all-purpose flour', quantity: 300, unit: 'g', category: 'grain', isOptional: false, substitutes: [] },
      { name: 'dry yeast', quantity: 7, unit: 'g', category: 'other', isOptional: false, substitutes: [] },
      { name: 'tomato', quantity: 3, unit: 'piece', category: 'vegetable', isOptional: false, substitutes: [] },
      { name: 'mozzarella', quantity: 200, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'basil', quantity: 10, unit: 'piece', category: 'spice', isOptional: true, substitutes: [] },
      { name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'oil', isOptional: false, substitutes: [] },
      { name: 'salt', quantity: 1, unit: 'tsp', category: 'spice', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Mix flour, yeast, salt, water, oil. Knead 10 min. Rise 1-2 hours.', duration: 75 },
      { order: 2, instruction: 'Crush tomatoes with salt and oil for sauce.', duration: 5 },
      { order: 3, instruction: 'Stretch dough thin. Spread sauce, leaving border for crust.', duration: 5 },
      { order: 4, instruction: 'Tear mozzarella and distribute. Drizzle lightly with oil.', duration: 2 },
      { order: 5, instruction: 'Bake at 250°C for 10-12 min until charred. Top with basil.', duration: 12 },
    ],
  },
  {
    title: 'Chocolate Lava Cake',
    description: 'Decadent chocolate dessert with a warm, gooey molten center.',
    cuisine: 'French',
    difficulty: 'intermediate',
    prepTime: 15,
    cookTime: 12,
    servings: 4,
    dietaryTags: ['vegetarian'],
    tags: ['dessert', 'chocolate', 'cake'],
    images: ['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800'],
    nutrition: { calories: 420, protein: 8, carbs: 45, fat: 24, fiber: 2 },
    ingredients: [
      { name: 'dark chocolate', quantity: 200, unit: 'g', category: 'other', isOptional: false, substitutes: [] },
      { name: 'butter', quantity: 100, unit: 'g', category: 'dairy', isOptional: false, substitutes: [] },
      { name: 'eggs', quantity: 4, unit: 'piece', category: 'protein', isOptional: false, substitutes: [] },
      { name: 'sugar', quantity: 80, unit: 'g', category: 'other', isOptional: false, substitutes: [] },
      { name: 'all-purpose flour', quantity: 30, unit: 'g', category: 'grain', isOptional: false, substitutes: [] },
    ],
    steps: [
      { order: 1, instruction: 'Melt chocolate and butter over bain-marie until smooth.', duration: 5 },
      { order: 2, instruction: 'Whisk eggs and sugar until pale. Fold in chocolate mixture.', duration: 5 },
      { order: 3, instruction: 'Sift flour and fold gently. Pour into ramekins.', duration: 3 },
      { order: 4, instruction: 'Refrigerate 30 min or bake immediately at 200°C for 10-12 min.', duration: 30 },
      { order: 5, instruction: 'Centers should be wobbly. Serve with ice cream.', duration: 1 },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    await Recipe.deleteMany({});
    await User.deleteMany({ email: SEED_USER.email });
    console.log('🗑️  Cleared existing data');

    const user = await User.create(SEED_USER);
    await Pantry.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        items: [
          { ingredient: 'eggs', quantity: 6, unit: 'piece', category: 'protein', addedAt: new Date() },
          { ingredient: 'butter', quantity: 200, unit: 'g', category: 'dairy', addedAt: new Date() },
          { ingredient: 'garlic', quantity: 5, unit: 'clove', category: 'spice', addedAt: new Date() },
          { ingredient: 'onion', quantity: 3, unit: 'piece', category: 'vegetable', addedAt: new Date() },
          { ingredient: 'olive oil', quantity: 500, unit: 'ml', category: 'oil', addedAt: new Date() },
          { ingredient: 'pasta', quantity: 500, unit: 'g', category: 'grain', addedAt: new Date() },
          { ingredient: 'tomato', quantity: 4, unit: 'piece', category: 'vegetable', addedAt: new Date() },
          { ingredient: 'parmesan', quantity: 100, unit: 'g', category: 'dairy', addedAt: new Date() },
        ],
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Created demo user: ${SEED_USER.email}`);

    const recipeDocs = RECIPES.map((r) => ({ ...r, author: user._id, isPublic: true }));
    await Recipe.insertMany(recipeDocs);
    console.log(`✅ Seeded ${RECIPES.length} recipes with proper instructions and images`);

    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
