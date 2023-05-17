const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favMealSchema = new Schema({
  userId: { type: String, ref: "User" },
  mealName: String,
  items: [Schema.Types.Mixed]

});

const favMeal = mongoose.model("FavouriteMeal", favMealSchema);

module.exports = favMeal;
