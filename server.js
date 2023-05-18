/**
 * Main server file
 */

// Set up dependencies
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const { ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const url = require("url");
require("dotenv").config();

// Set up app (express)
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());

// Set up MongoDB connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true });
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB Atlas.");
});

// Set up MongoDB Session store
var sessionStore = MongoStore.create({
  mongoUrl: uri,
  cypto: {
    secret: process.env.SESSION_KEY,
  },
});

// Set up sessions
app.use(
  session({
    secret: process.env.SESSION_KEY,
    store: sessionStore,
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// User model
const User = require("./models/userModel");

// Food model
const Food = require("./models/foodModel");

// Exercise model
const Exercise = require("./models/exerciseModel");

// Meal model
const Meal = require("./models/mealModel");

// Workout model
const Workout = require("./models/workoutModel");

// FavoriteMeal model
const FavoriteMeal = require("./models/favMealModel");

// FavoriteWorkout model
const FavoriteWorkout = require("./models/favWorkoutModel");

// Basic landing page
app.get("/", (req, res) => {
  if (req.session.AUTH) {
    return res.redirect("/members");
  }
  res.render("home");
});

// Routers
const userRouter = require("./routes/userRoute");
const generatedMealsRouter = require("./routes/generatedMealsRoute");
const generatedWorkoutsRouter = require("./routes/generatedWorkoutsRoute");
const workoutTrackingRouter = require("./routes/workoutTrackingRoute");
const { parse } = require("path");

/**
 * Route handlers
 */

// User route
app.use("/user", userRouter);

// Generated Meal route
app.use("/generatedMeals", generatedMealsRouter);

// Generated Workout route
app.use("/generatedWorkouts", generatedWorkoutsRouter);

// Workout Tracking route
app.use("/workoutTracking", workoutTrackingRouter);

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

// Post logout page
app.post("/logOut", (req, res) => {
  req.session.destroy();
  res.redirect("./");
});

// Get authentication failure page
app.get("/authFail", (req, res) => {
  res.render("authFail", {
    primaryUser: req.session.USER,
    referer: req.headers.referer,
  });
});

// Get members page
app.get("/members", checkAuth, (req, res) => {
  res.render("members", {
    primaryUser: req.session.USER,
  });
});

// Get user profile page
app.get("/userProfile", (req, res) => {
  res.render("userProfile", {
    primaryUser: req.session.USER,
  });
});

// Get logs page
app.get("/logs", async (req, res) => {
  res.render("logs");
});

app.get("/mealLogs", async (req, res) => {
  res.render("mealLogs");
});

app.get("/exerciseLogs", async (req, res) => {
  res.render("exerciseLogs");
});

// Get favorites page
app.get("/favorites", (req, res) => {
  res.render("favorites");
});

// POST favorite workouts  favoriteWorkouts
app.post("/favoriteWorkouts", async (req, res) => {
  console.log("session workout: ");
  console.log(req.session.WORKOUT);
  // add the workout to the user's favorite workouts
  const workout = req.session.WORKOUT;
  const userId = req.session.USER.id;
  // ADD workout to FavoriteWorkout collection
  const favWorkout = new FavoriteWorkout({
    userId: userId,
    workoutName: workout[0].name,
    exercises: workout,
  });
  await favWorkout.save();
  // delete session variables
  delete req.session.WORKOUT;
  res.redirect("/");
});

// POST favorite meals
app.post("/favoriteMeals", async (req, res) => {
  console.log("session meal: ");
  console.log(req.session.MEAL);
  // add the meal to the user's favorite meals
  const meal = req.session.MEAL;
  const userId = req.session.USER.id;
  // ADD meal to FavoriteMeal collection
  const favMeal = new FavoriteMeal({
    userId: userId,
    mealName: meal[0].Food,
    items: meal,
  });
  await favMeal.save();
  console.log("Saved");

  // delete session variables
  delete req.session.MEAL;
  res.redirect("/");
});

// POST Meal Logs page
app.post("/foodLogs", async (req, res) => {
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

// Get quick add meal page
app.get("/quickAddMeal", (req, res) => {
  res.render("quickAddMeal");
});

// Post quick add meal data
app.post("/quickAddMeal", async (req, res) => {
  const itemId = req.body.item;
  const userId = req.session.USER.id;
  let foodToAdd = await Food.findOne({ _id: new ObjectId(itemId) });

  // get current date and time as a string
  const date = new Date();

  // Create a new meal document
  const meal = new Meal({
    userId: userId,
    mealName: foodToAdd.Food,
    items: [
      {
        foodName: foodToAdd.Food,
        calories: foodToAdd.Calories,
        grams: foodToAdd.Grams,
      },
    ],
    expireTime: new Date(date.getTime() + 5 * 60 * 1000), // set the expiry time 5 minutes from now
  });

  // Save the meal document
  await meal.save();

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("/quickAddMeal");
});

// Get Quick add workout page
app.get("/quickAddWorkout", async (req, res) => {
  res.render("quickAddWorkout");
});

// Post quick add workout data
app.post("/quickAddWorkout", async (req, res) => {
  const itemId = req.body.item;
  const duration = req.body.duration || 0; // If no duration is specified, set it to 0
  const userId = req.session.USER.id;
  let workoutToAdd = await Exercise.findOne({ _id: new ObjectId(itemId) });

  // Get current date and time
  const date = new Date();

  // Create a new workout document
  const workout = new Workout({
    userId: userId,
    exercises: [
      {
        name: workoutToAdd.name,
        duration: duration,
        bodyPart: workoutToAdd.bodyPart,
      },
    ],
    expireTime: new Date(date.getTime() + 5 * 60 * 1000), // Set the expiry time 5 minutes from now
  });

  // Save the workout document
  await workout.save();

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("/quickAddWorkout");
});

// Get workout logs
app.get("/workoutLogs", (req, res) => {
  res.render("workoutLogs");
});

// Get snake game
app.get("/snake", (req, res) => {
  res.sendFile("public/snake.html", { root: __dirname });
});

// Get favorite meals page
app.get("/favoriteMeals", async (req, res) => {
  let userId = req.session.USER.id;
  let meals = await FavoriteMeal.find({ userId: userId });

  let mealsParsed = meals.map((meal) => {
    let totalCalories = 0;
    meal.items.forEach((item) => {
      totalCalories += item.Calories;
    });

    return {
      _id: meal._id,
      name: meal.items[0].Food + " Meal",
      calories: totalCalories,
      items: meal.items,
    };
  });

  res.render("favoriteMeals", { meals: mealsParsed });
});

// Get favorite workouts page
app.get("/favoriteWorkouts", async (req, res) => {
  let userId = req.session.USER.id;
  let workouts = await FavoriteWorkout.find({ userId: userId });

  console.log(workouts);

  let workoutsParsed = workouts.map((workout) => {
    let totalDuration = 0;
    workout.exercises.forEach((exercise) => {
      totalDuration += exercise.duration;
    });

    return {
      _id: workout._id,
      name: workout.exercises[0].name + " Workout",
      duration: totalDuration,
      exercises: workout.exercises,
    };
  });

  res.render("favoriteWorkouts", { workouts: workoutsParsed });
});

// Connect to port
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
