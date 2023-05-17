const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favMealSchema = new Schema({
  userId: { type: String, ref: "User" },
  mealName: String,
  items: [
    {
      foodName: String,
      calories: Number,
      grams: Number,
    },
  ],
  
});

const favMeal = mongoose.model("FavouriteMeal", favMealSchema);

module.exports = favMeal;
