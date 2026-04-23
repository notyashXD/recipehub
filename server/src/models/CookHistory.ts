import mongoose, { Schema, Document } from 'mongoose';

export interface ICookHistory extends Document {
  user: mongoose.Types.ObjectId;
  recipe: mongoose.Types.ObjectId;
  cookedAt: Date;
  rating?: number;
  notes?: string;
  servingsMade: number;
}

const CookHistorySchema = new Schema<ICookHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    cookedAt: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    servingsMade: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model<ICookHistory>('CookHistory', CookHistorySchema);
