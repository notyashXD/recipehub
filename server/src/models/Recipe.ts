import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: 'protein' | 'vegetable' | 'fruit' | 'dairy' | 'grain' | 'spice' | 'oil' | 'other';
  isOptional: boolean;
  substitutes: string[];
}

export interface IStep {
  order: number;
  instruction: string;
  duration: number;
}

export interface INutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface IRecipe extends Document {
  title: string;
  description: string;
  author: mongoose.Types.ObjectId;
  isPublic: boolean;
  isAIGenerated: boolean;
  cuisine: string;
  dietaryTags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: IIngredient[];
  steps: IStep[];
  images: string[];
  nutrition: INutrition;
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  forks: mongoose.Types.ObjectId[];
  forkedFrom?: mongoose.Types.ObjectId;
  ratings: { user: mongoose.Types.ObjectId; score: number; review: string }[];
  averageRating: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  category: { type: String, enum: ['protein', 'vegetable', 'fruit', 'dairy', 'grain', 'spice', 'oil', 'other'], default: 'other' },
  isOptional: { type: Boolean, default: false },
  substitutes: [{ type: String }],
});

const RecipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: true },
    isAIGenerated: { type: Boolean, default: false },
    cuisine: { type: String, default: 'International' },
    dietaryTags: [{ type: String }],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    prepTime: { type: Number, default: 10 },
    cookTime: { type: Number, default: 20 },
    servings: { type: Number, default: 4 },
    ingredients: [IngredientSchema],
    steps: [{ order: Number, instruction: String, duration: { type: Number, default: 5 } }],
    images: [{ type: String }],
    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    tags: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    forks: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
    forkedFrom: { type: Schema.Types.ObjectId, ref: 'Recipe' },
    ratings: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, score: Number, review: String }],
    averageRating: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RecipeSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IRecipe>('Recipe', RecipeSchema);
