const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mealSchema = new Schema({
  userId: { type: String, ref: 'User' },
  mealName: String,
  items: [
    {
      foodName: String,
      calories: Number,
      grams: Number,
    },
  ],
  expireTime: { type: Date, expires: 0 }
});

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;