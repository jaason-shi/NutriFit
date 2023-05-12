const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ejs = require("ejs");
const { string, number } = require("joi");

app.set("view engine", "ejs");

// mongoose.connect(
//   "mongodb+srv://<username>:<password>@testprojectone.yhtttpf.mongodb.net/NutriFit.food"
// );

const foodSchema = {
  Food: String,
  Measure: Number,
  Grams: Number,
  Calories: Number,
  Protein: String,
  Fat: Number,
  Sat: String,
  Fiber: Number,
  Carbs: Number,
};

const Food = mongoose.model("Food", foodSchema);

app.get("/", (req, res) => {
  Food.find({}, function (err, foods) {
    res.render("foodCatalog", {
      foodsList: foods,
    });
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
