const express = require("express");
const mealTrackingRouter = express.Router();
const User = require("../models/userModel");
const Meal = require("../models/mealModel");
const { ObjectID } = require("mongodb");
// FavoriteMeal model
const FavoriteMeal = require("../models/favMealModel");


// Get meal logs page
mealTrackingRouter.get("/mealLogs", async (req, res) => {

    const userId = req.session.USER.id;
    let userMeals = await Meal.find({ userId: userId });

    // Get total calories of all meals
    let totalCalories = 0;

    // Add a totalCalories field to each meal
    userMeals = userMeals.map(meal => {
        let mealCalories = 0;

        meal.items.forEach(item => {
            totalCalories += item.Calories;
            mealCalories += item.Calories;
        });

        // Add the total calories of this meal to the meal object
        meal = meal.toObject(); // convert the mongoose doc to a plain JS object
        meal.totalCalories = mealCalories;

        return meal;
    });

    console.log(userMeals);
    res.render("mealLogs", {
        totalCalories: totalCalories,
        meals: userMeals
    });
});


// GET meal logs depending on if the user clicks day, week, or month
mealTrackingRouter.get("/filterMeals", (req, res) => {
    const filterType = req.query.filterType;
    const today = new Date();
    let startDate, endDate;

    if (filterType === "day") {
        startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );
        endDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
        );
    } else if (filterType === "week") {
        const firstDayOfWeek = today.getDate() - today.getDay();
        startDate = new Date(today.getFullYear(), today.getMonth(), firstDayOfWeek);
        endDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            firstDayOfWeek + 7
        );
    } else if (filterType === "month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const filteredMeals = req.session.mealLog.filter((meal) => {
        return meal.expireTime >= startDate && meal.expireTime <= endDate;
    });

    let totalCalories = 0;
    filteredMeals.forEach((meal) => {
        totalCalories += meal.totalCalories;
    });

    res.render("mealLogs", { meals: filteredMeals, totalCalories });
});


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
        console.log("Parsed favorite meal");
        console.log(parsedMeal);
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
        console.log("Parsed meal from body");
        console.log(parsedMeal);
    }

    console.log("Session meal logs: ");
    console.log(req.session.MEAL);

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
        expireTime: new Date(date.getTime() + 5 * 60 * 1000),
    });

    await mealLog.save();
    console.log("Saved");

    // Delete session variables
    delete req.session.MEAL;

    res.redirect("/");
});

module.exports = mealTrackingRouter;
