import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  dietaryPreferences: string[];
  cookingLevel: string;
  streakDays: number;
  lastCookedAt: Date;
  totalRecipesCooked: number;
  badges: string[];
  savedRecipes: mongoose.Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
      match: [/^[a-zA-Z0-9._\-\s]+$/, 'Username can only contain letters, numbers, spaces, dots, dashes, and underscores'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please provide a valid email address'],
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    dietaryPreferences: [{ type: String }],
    cookingLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    streakDays: { type: Number, default: 0 },
    lastCookedAt: { type: Date },
    totalRecipesCooked: { type: Number, default: 0 },
    badges: [{ type: String }],
    savedRecipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
