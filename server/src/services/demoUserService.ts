import User from '../models/User';
import Pantry from '../models/Pantry';

const DEMO_USER = {
  username: 'RecipeHub',
  email: 'demo@recipebox.com',
  password: 'demo1234',
};

export async function ensureDemoUser(): Promise<void> {
  let user = await User.findOne({ email: DEMO_USER.email });

  if (!user) {
    user = await User.create(DEMO_USER);
    await Pantry.findOneAndUpdate(
      { user: user._id },
      { $setOnInsert: { user: user._id, items: [] } },
      { upsert: true, new: true }
    );
    return;
  }

  let shouldSave = false;
  if (user.username !== DEMO_USER.username) {
    user.username = DEMO_USER.username;
    shouldSave = true;
  }

  const hasDemoPassword = await user.comparePassword(DEMO_USER.password);
  if (!hasDemoPassword) {
    user.password = DEMO_USER.password;
    shouldSave = true;
  }

  if (shouldSave) await user.save();

  await Pantry.findOneAndUpdate(
    { user: user._id },
    { $setOnInsert: { user: user._id, items: [] } },
    { upsert: true, new: true }
  );
}
