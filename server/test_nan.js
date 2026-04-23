const mongoose = require('mongoose');
const Pantry = require('./src/models/Pantry').default;
const User = require('./src/models/User').default;

mongoose.connect('mongodb+srv://notyashxd:notyashxd@recipe.rb1ddpp.mongodb.net/recipebox?retryWrites=true&w=majority&appName=Recipe').then(async () => {
  try {
    const user = await User.findOne();
    let pantry = await Pantry.findOne({ user: user._id });
    if (!pantry) {
        pantry = new Pantry({ user: user._id, items: [] });
    }
    
    // Simulate what the route does when quantity is NaN
    const item = { ingredient: 'TestNaN', quantity: NaN, unit: 'piece', category: 'other' };
    
    pantry.items.push({ ...item, addedAt: new Date() });
    
    await pantry.save();
    console.log("Saved successfully!");
  } catch (err) {
    console.error("Error saving:", err.message);
  } finally {
    mongoose.disconnect();
  }
});
