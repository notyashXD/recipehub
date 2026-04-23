import mongoose, { Schema, Document } from 'mongoose';

export interface IMealEntry {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: mongoose.Types.ObjectId;
  servings: number;
  notes?: string;
}

export interface IMealPlan extends Document {
  user: mongoose.Types.ObjectId;
  weekStart: Date;
  meals: IMealEntry[];
  shoppingList: { ingredient: string; quantity: number; unit: string; checked: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanSchema = new Schema<IMealPlan>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    meals: [
      {
        date: { type: String, required: true },
        mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
        recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
        servings: { type: Number, default: 1 },
        notes: { type: String },
      },
    ],
    shoppingList: [
      {
        ingredient: String,
        quantity: Number,
        unit: String,
        checked: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IMealPlan>('MealPlan', MealPlanSchema);
