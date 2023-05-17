/**
 * Main server file
 */

// Set up dependencies
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const { ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const url = require('url');
require('dotenv').config();

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
app.get('/', (req, res) => {
  if (req.session.AUTH) {
    return res.redirect('/members')
  }
  res.render('home')
})

// Routers
const userRouter = require('./routes/userRoute')
const generatedMealsRouter = require('./routes/generatedMealsRoute')
const generatedWorkoutsRouter = require('./routes/generatedWorkoutsRoute')

/**
 * Route handlers
 */

// User route
app.use('/user', userRouter)

// Generated Meal route
app.use('/generatedMeals', generatedMealsRouter)

// Generated Workout route
app.use('/generatedWorkouts', generatedWorkoutsRouter)


// Middleware: Checks if the user is authenticated
const checkAuth = (req, res, next) => {
  if (!req.session.AUTH) {
    if (req.session.FAIL_FORM) {
      delete req.session.FAIL_FORM
      return res.redirect('user/invalidFormData');
    } else {
      return res.redirect('/authFail');
    }
  }
  next();
}


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


// Get favorites page
app.get("/favourites", (req, res) => {
  res.render("favourites");
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
    exercises: workout
  });
  await favWorkout.save();
  // delete session variables
  delete req.session.WORKOUT;
  res.redirect("/");
});


// POST Workout Logs page
app.post("/workoutLogs", async (req, res) => {
  console.log("session workout logs: ");
  console.log(req.session.WORKOUT);
  // get total duration of the workouts
  let totalDuration = 0;
  req.session.WORKOUT.forEach((exercise) => {
    totalDuration += Number(exercise.duration);
  });
  // add the workout to the Workout collection
  const workout = req.session.WORKOUT;
  const userId = req.session.USER.id;
  const workoutLog = new Workout({
    userId: userId,
    workoutName: workout[0].name,
    exercises: workout,
    totalDuration: totalDuration,
  });
  await workoutLog.save();

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
    items: meal
  });
  await favMeal.save();
  console.log("Saved")

  // delete session variables
  delete req.session.MEAL;
  res.redirect("/");
});


// POST Meal Logs page
app.post("/foodLogs", async (req, res) => {
  console.log("session meal logs: ");
  console.log(req.session.MEAL);
  // get calories from the meal
  let totalCalories = 0;
  req.session.MEAL.forEach((food) => {
    totalCalories += Number(food.Calories);
  });
  // add the meal to meal collection
  const meal = req.session.MEAL;
  const userId = req.session.USER.id;
  const mealLog = new Meal({
    userId: userId,
    mealName: meal[0].mealName,
    items: meal,
    totalCalories: totalCalories,
  });
  await mealLog.save();


  // delete session variables
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
      }
    ],
    expireTime: new Date(date.getTime() + 5 * 60 * 1000) // set the expiry time 5 minutes from now
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
app.get('/snake', (req, res) => {
  res.sendFile('public/snake.html', { root: __dirname });
})


// Connect to port
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
