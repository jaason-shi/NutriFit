/**
 * Router to handle requests to endpoints related to meal tracking.
 */

// Set up dependencies
const express = require("express");
const mealTrackingRouter = express.Router();

// Models
const Meal = require("../models/mealModel");
const FavoriteMeal = require("../models/favMealModel");
const User = require("../models/userModel");

/**
 * Renders the "mealLogs" view with the user's meals and total calories in the response.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
mealTrackingRouter.get("/mealLogs", async (req, res) => {
  const userId = req.session.USER.id;
  let userMeals;

  if (req.session.FILTERED_MEALS) {
    userMeals = req.session.FILTERED_MEALS;
    delete req.session.FILTERED_MEALS;
  } else {
    userMeals = await Meal.find({ userId: userId });
  }

  // Get total calories of all meals
  let totalCalories = 0;

  // Add a totalCalories field to each meal
  userMeals = userMeals.map((meal) => {
    let mealCalories = 0;

    meal.items.forEach((item) => {
      totalCalories += item.Calories;
      mealCalories += item.Calories;
    });

    meal.totalCalories = mealCalories;
    return meal;
  });

  req.session.MEALS_LOGGED = userMeals;
  res.render("logs/mealLogs", {
    totalCalories: totalCalories,
    meals: userMeals,
  });
});

/**
 * Filters the current user's logged meals by date.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
mealTrackingRouter.get("/filterMeals", async (req, res) => {
  req.session.MEALS_LOGGED = await Meal.find({ userId: req.session.USER.id });
  const filterType = req.query.filterType;
  const today = new Date();

  console.log("Today");
  console.log(today);

  let startDate;

  // Which filter was picked
  if (filterType === "day") {
    startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  } else if (filterType === "week") {
    startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filterType === "month") {
    startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  const filteredMeals = req.session.MEALS_LOGGED.filter((meal) => {
    let createdTime = new Date(Date.parse(meal.createdTime));
    return createdTime >= startDate;
  });

  console.log(filteredMeals);
  req.session.FILTERED_MEALS = filteredMeals;
  res.redirect("./mealLogs");
});

/**
 * Sets the session meal to the correctly parsed meal object.
 * Depending on where the request came from, it is parsed and handled differently.
 *
 * @param {Express.Request} req - the request object representing the received request
 */
async function parseMealSession(req) {
  if (req.body.favoriteMealId) {
    let favoriteMealId = req.body.favoriteMealId;
    let favoriteMeal = await FavoriteMeal.findById(favoriteMealId);

    let parsedMeal = favoriteMeal.items.map((item) => {
      return {
        _id: item._id,
        Food: item.Food,
        Calories: item.Calories,
        Grams: item.Grams,
      };
    });
    req.session.MEAL = parsedMeal;
  } else if (req.body.meal) {
    let stringMeal = req.body.meal;
    let parsedMeal = JSON.parse(stringMeal);
    parsedMeal = parsedMeal.map((item) => {
      return {
        _id: item._id,
        Food: item.Food,
        Calories: item.Calories,
        Grams: item.Grams,
      };
    });
    req.session.MEAL = parsedMeal;
  }
}

/**
 * Handles the POST request to add to the user's logged meals.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
mealTrackingRouter.post("/mealLogs", async (req, res) => {
  const date = new Date();

  // Sets the session meal for further handling
  await parseMealSession(req);

  // Get calories from the meal
  let totalCalories = 0;
  req.session.MEAL.forEach((food) => {
    totalCalories += Number(food.Calories);
  });

  // Add the meal to meal collection
  const meal = req.session.MEAL;
  const userId = req.session.USER.id;
  console.log(userId);
  const mealLog = new Meal({
    userId: userId,
    mealName: meal[0].Food,
    items: meal,
    totalCalories: totalCalories,
    expireTime: new Date(date.getTime() + 60 * 60 * 1000),
    createdTime: new Date(),
  });

  await mealLog.save();

  // Delete session variables
  delete req.session.MEAL;
  await User.updateOne(
    { id: req.session.USER.id },
    { $set: { calories: 500 } }
  );
  res.redirect("/mealTracking/mealLogs");
});

/**
 * Handles the POST request to delete a meal from the user's logged meals.
 *  
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
mealTrackingRouter.post("/deleteFromLogMeals", async (req, res) => {
  const mealId = req.body.deleteLogMealId;
  const userId = req.session.USER.id;

  // Remove the meal from the logs
  await Meal.deleteOne({ _id: mealId, userId: userId });
  res.redirect("./mealLogs");
});

// Export the mealTrackingRouter
module.exports = mealTrackingRouter;
