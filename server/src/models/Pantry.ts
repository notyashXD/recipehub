import mongoose, { Schema, Document } from 'mongoose';

export interface IPantryItem {
  _id?: mongoose.Types.ObjectId;
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: Date;
  addedAt: Date;
  barcode?: string;
  notes?: string;
}

export interface IPantry extends Document {
  user: mongoose.Types.ObjectId;
  items: IPantryItem[];
  lastUpdated: Date;
}

const PantryItemSchema = new Schema<IPantryItem>({
  ingredient: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'piece' },
  category: { type: String, default: 'other' },
  expiryDate: { type: Date },
  addedAt: { type: Date, default: Date.now },
  barcode: { type: String },
  notes: { type: String },
});

const PantrySchema = new Schema<IPantry>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [PantryItemSchema],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IPantry>('Pantry', PantrySchema);
