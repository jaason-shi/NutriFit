const express = require("express");
const mealTrackingRouter = express.Router();
const User = require("../models/userModel");
const Meal = require("../models/mealModel");
const { ObjectID } = require("mongodb");
// FavoriteMeal model
const FavoriteMeal = require("../models/favMealModel");

// Middleware: Checks if the user is authenticated
const checkAuth = (req, res, next) => {
  if (!req.session.AUTH) {
    if (req.session.FAIL_FORM) {
      delete req.session.FAIL_FORM;
      return res.redirect("user/invalidFormData");
    } else {
      return res.redirect("/authFail");
    }
  }
  next();
};

// Get meal logs page
mealTrackingRouter.get("/mealLogs", checkAuth, async (req, res) => {
    const userId = req.session.USER.id;
    let userMeals;

    if (req.session.FILTERED_MEALS) {
        userMeals = req.session.FILTERED_MEALS
        delete req.session.FILTERED_MEALS
    } else {
        userMeals = await Meal.find({ userId: userId });
    }

    // Get total calories of all meals
    let totalCalories = 0;

    // Add a totalCalories field to each meal
    userMeals = userMeals.map(meal => {
        let mealCalories = 0;

        meal.items.forEach(item => {
            totalCalories += item.Calories;
            mealCalories += item.Calories;
        });

        meal.totalCalories = mealCalories;

        return meal;
    });

    req.session.MEALS_LOGGED = userMeals
    res.render("mealLogs", {
        totalCalories: totalCalories,
        meals: userMeals
    });
});


// GET meal logs depending on if the user clicks day, week, or month
mealTrackingRouter.post("/filterMeals", async (req, res) => {
    req.session.MEALS_LOGGED = await Meal.find({ userId: req.session.USER.id });
    const filterType = req.body.filterType;
    const today = new Date();

    console.log("Today")
    console.log(today)

    let startDate

    // Which filter was picked
    if (filterType === "day") {
        startDate = new Date(today.getTime() - (24 * 60 * 60 * 1000));
    } else if (filterType === "week") {
        startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    } else if (filterType === "month") {
        startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    }
    const filteredMeals = req.session.MEALS_LOGGED.filter((meal) => {
        let createdTime = new Date(Date.parse(meal.createdTime))
        console.log(meal.mealName)
        console.log("Created ")
        console.log(createdTime)
        console.log("Start")
        console.log(startDate)
        return createdTime >= startDate
    });

    let totalCalories = 0;
    filteredMeals.forEach((meal) => {
        totalCalories += meal.totalCalories;
    });

    console.log(filteredMeals)
    req.session.FILTERED_MEALS = filteredMeals;
    res.redirect('./mealLogs')
});


// Get test populate button
mealTrackingRouter.get("/testPopulate", checkAuth, (req, res) => {
  //console.log("Test populate")
  res.render("testPopulate");
});

// TestPostMealData
mealTrackingRouter.post('/testPopulateMeals', async (req, res) => {
    let testMeal = await Meal.findOne({ userId: req.session.USER.id })
    let currentDay = new Date()
    const yesterday = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() - 2);
    const week = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() - 8);
    // let month = new Date(currentDay.getTime() - 40 * 24 * 60 * 60 * 1000);
    const month = new Date(currentDay.getFullYear(), currentDay.getMonth() - 1, currentDay.getDate() - 1);

    let newMealDay = new Meal({
        userId: testMeal.userId,
        mealName: testMeal.mealName + " Day",
        items: testMeal.items,
        expireTime: testMeal.expireTime,
        createdTime: yesterday
    })

    let newMealWeek = new Meal({
        userId: testMeal.userId,
        mealName: testMeal.mealName + " Week",
        items: testMeal.items,
        expireTime: testMeal.expireTime,
        createdTime: week
    })

    let newMealMonth = new Meal({
        userId: testMeal.userId,
        mealName: testMeal.mealName + " Month",
        items: testMeal.items,
        expireTime: testMeal.expireTime,
        createdTime: month
    })

    await newMealDay.save()
    await newMealWeek.save()
    await newMealMonth.save()

    //console.log("Populating...")
    res.redirect('./testPopulate')

})


// POST Meal Logs page
mealTrackingRouter.post("/foodLogs", async (req, res) => {
    const date = new Date();

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
        //console.log("Parsed favorite meal");
        //console.log(parsedMeal);
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
        //console.log("Parsed meal from body");
        //console.log(parsedMeal);
    }

    //console.log("Session meal logs: ");
    //console.log(req.session.MEAL);

    // Get calories from the meal
    let totalCalories = 0;
    req.session.MEAL.forEach((food) => {
        totalCalories += Number(food.Calories);
    });

    // Add the meal to meal collection
    const meal = req.session.MEAL;
    const userId = req.session.USER.id;
    const mealLog = new Meal({
        userId: userId,
        mealName: meal[0].Food,
        items: meal,
        totalCalories: totalCalories,
        expireTime: new Date(date.getTime() + 60 * 60 * 1000),
        createdTime: new Date()
    });

    await mealLog.save();
    //console.log("Saved");

    // Delete session variables
    delete req.session.MEAL;

    res.redirect("/mealTracking/mealLogs");
});

mealTrackingRouter.get("*", (req, res) => {
  const currentPage = "*";
  res.render("404", { currentPage });
});

module.exports = mealTrackingRouter;
