import 'dotenv/config';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Recipe from '../models/Recipe';
import User from '../models/User';

const KEYS = [
  'AIzaSyCcVwmsDcM27grR9Hf0YRfNc8Dd2_PMhG8',
  'AIzaSyA7UjCxxeUeqfyHp1I4v0o8Aw2oijMdIfg',
  'AIzaSyBREf_POnRsuhHiy9-SHMeTzPfCTSTofbM',
  'AIzaSyBPQX7NjW6jFRLw7YzjAiwqDB383-za5YI',
  'AIzaSyCxFu8lXRv66nDN7dz-C7Fe-TqepWbHf40',
  'AIzaSyBkkY-rZ2Fd2lQGfW24tBoG5IKfJV4rFQE',
];
let ki = 0;
async function generate(prompt: string): Promise<string> {
  for (let attempt = 0; attempt < KEYS.length; attempt++) {
    try {
      const ai = new GoogleGenerativeAI(KEYS[ki % KEYS.length]);
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const r = await model.generateContent(prompt);
      return r.response.text();
    } catch (e: any) {
      console.log(`Error with key ${ki % KEYS.length + 1}:`, e.message);
      ki++; 
      console.log(`Trying key ${ki % KEYS.length + 1}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('All keys exhausted');
}

const INDIAN_RECIPES = [
  'Butter Chicken','Palak Paneer','Dal Makhani','Chole Bhature','Biryani (Hyderabadi Chicken)',
  'Rajma Chawal','Aloo Gobi','Paneer Tikka Masala','Sambar','Idli Sambhar',
  'Masoor Dal','Kadai Paneer','Malai Kofta','Pav Bhaji','Vada Pav',
  'Poha','Upma','Dosa with Coconut Chutney','Uttapam','Paratha with Aloo Stuffing',
  'Mutton Rogan Josh','Fish Curry (Goan)','Egg Curry','Keema Matar','Shahi Paneer',
  'Matar Paneer','Saag Aloo','Dal Tadka','Chana Masala','Baingan Bharta',
  'Dum Aloo','Lauki Ki Sabzi','Mixed Veg Curry','Tomato Chutney','Raita',
  'Khichdi','Vegetable Pulao','Jeera Rice','Naan Bread','Tandoori Chicken',
  'Chicken Korma','Prawn Masala','Methi Thepla','Dhokla','Kachori',
  'Besan Chilla','Moong Dal Halwa','Gulab Jamun','Kheer','Jalebi'
];

const UNSPLASH = [
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800',
  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800',
  'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
  'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800',
];

async function generateRecipe(name: string, authorId: any, img: string) {
  const prompt = `Generate a detailed authentic Indian recipe for "${name}".
Return ONLY valid JSON (no markdown):
{
  "title":"${name}","description":"2 sentence description","cuisine":"Indian",
  "difficulty":"beginner|intermediate|advanced","prepTime":15,"cookTime":30,"servings":4,
  "dietaryTags":["vegetarian"],"tags":["indian","curry"],
  "ingredients":[{"name":"ingredient","quantity":1,"unit":"g","category":"protein|vegetable|fruit|dairy|grain|spice|oil|other","isOptional":false,"substitutes":[]}],
  "steps":[{"order":1,"instruction":"Step text","duration":5}],
  "nutrition":{"calories":350,"protein":15,"carbs":40,"fat":12,"fiber":6}
}`;

  const text = await generate(prompt);
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON for ' + name);
  const data = JSON.parse(m[0]);
  return { ...data, author: authorId, isPublic: true, isAIGenerated: false, images: [img] };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ Connected');

  const user = await User.findOne({ email: 'demo@recipebox.com' });
  if (!user) { console.error('Run main seed first!'); process.exit(1); }

  // Remove old Indian recipes
  await Recipe.deleteMany({ cuisine: 'Indian', author: user._id });
  console.log('🗑️  Cleared old Indian recipes');

  let success = 0;
  for (let i = 0; i < INDIAN_RECIPES.length; i++) {
    const name = INDIAN_RECIPES[i];
    const img = UNSPLASH[i % UNSPLASH.length];
    try {
      const data = await generateRecipe(name, user._id, img);
      await Recipe.create(data);
      success++;
      console.log(`✅ [${success}/${INDIAN_RECIPES.length}] ${name}`);
      await new Promise(r => setTimeout(r, 1500)); // avoid rate limits
    } catch (e: any) {
      console.error(`❌ Failed: ${name} — ${e.message?.slice(0, 80)}`);
    }
  }

  console.log(`\n🎉 Done! Added ${success} Indian recipes.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
