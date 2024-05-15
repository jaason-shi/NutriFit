/**
 * Main server file
 */

// Set up dependencies
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
require("dotenv").config();

// Port to connect to
const port = 3000;

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

// FavoriteMeal model
const FavoriteMeal = require("./models/favMealModel");

// FavoriteWorkout model
const FavoriteWorkout = require("./models/favWorkoutModel");

// User model
const User = require("./models/userModel");

// Basic landing page
app.get("/", (req, res) => {
  if (req.session.AUTH) {
    return res.redirect("/members");
  }
  res.render("general/landingPage");
});

// Routers
const userRouter = require("./routes/userRoute");
const generatedMealsRouter = require("./routes/generatedMealsRoute");
const generatedWorkoutsRouter = require("./routes/generatedWorkoutsRoute");
const workoutTrackingRouter = require("./routes/workoutTrackingRoute");
const mealTrackingRouter = require("./routes/mealTrackingRoute");

/**
 * Checks if the user is authenticated and redirects them if they are not based on the context of their arrival.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 * @param {Function} next - the function that passes control to the next middleware function or route handler
 */
function checkAuth(req, res, next) {
  if (!req.session.AUTH) {
    if (req.session.FAIL_FORM) {
      delete req.session.FAIL_FORM;
      return res.redirect("user/invalidFormData");
    } else {
      return res.redirect("/authFail");
    }
  }
  next();
}

/**
 * Route handlers start
 */

// User route
app.use("/user", userRouter);

// The routes below require authentication to access
// Generated Meal route
app.use("/generatedMeals", checkAuth, generatedMealsRouter);

// Generated Workout route
app.use("/generatedWorkouts", checkAuth, generatedWorkoutsRouter);

// Workout Tracking route
app.use("/workoutTracking", checkAuth, workoutTrackingRouter);

// Meal Tracking route
app.use("/mealTracking", checkAuth, mealTrackingRouter);

/**
 * Route handlers end
 */

/**
 * Logs out the user by destroying the session and redirecting back to the home page.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.post("/logOut", (req, res) => {
  req.session.destroy();
  res.redirect("./");
});

/**
 * Renders the "authFail" view with User and referer in the response.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/authFail", (req, res) => {
  res.render("errors/authFail", {
    primaryUser: req.session.USER,
    referer: req.headers.referer,
  });
});

/**
 * Renders the "members" view with User in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/members", checkAuth, (req, res) => {
  res.render("general/members", {
    primaryUser: req.session.USER,
  });
});

/**
 * Renders the "userProfile" view with User in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/userProfile", checkAuth, (req, res) => {
  res.render("general/userProfile", {
    primaryUser: req.session.USER,
  });
});

/**
 * Renders the "logs" view in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/logs", checkAuth, async (req, res) => {
  res.render("logs/logs");
});

/**
 * Renders the "exerciseLogs" view in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/exerciseLogs", checkAuth, async (req, res) => {
  res.render("exerciseLogs");
});

/**
 * Renders the "favorites" view in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/favorites", checkAuth, (req, res) => {
  res.render("favorites/favorites");
});

/**
 * Serves the "snake.html" file in the response.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/snake", (req, res) => {
  res.sendFile("public/snake.html", { root: __dirname });
});

/**
 * Renders the "favoriteMeals" view with the user's favorite meals in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/favoriteMeals", checkAuth, async (req, res) => {
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
  console.log("Meals parsed");
  console.log(mealsParsed);

  res.render("favorites/favoriteMeals", { meals: mealsParsed });
});

/**
 * Renders the "badAPiResponse" view in the response.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/badApiResponse", (req, res) => {
  res.render("errors/badApiResponse");
});

/**
 * Renders the "favoriteWorkouts" view with the user's favorite workouts in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/favoriteWorkouts", checkAuth, async (req, res) => {
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

  res.render("favorites/favoriteWorkouts", { workouts: workoutsParsed });
});

/**
 * Renders the "alreadyExists" view with the field that already exists in the response.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/alreadyExists", (req, res) => {
  res.render("errors/alreadyExists", { match: req.session.MATCH });
});

/**
 * Renders the "waitingApi" view in the response and sets the calories of the current user.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("/waitingApi", async (req, res) => {
  let user = req.session.USER;
  let type = req.query.type;
  console.log("data");
  console.log(req.query);
  if (type === "meal") {
    if (req.query.calories != undefined) {
      await User.updateOne(
        { id: user.id },
        { $set: { calories: req.query.calories } }
      );
    } else if (!req.session.USER.calories) {
      await User.updateOne({ id: user.id }, { $set: { calories: 500 } });
    }
  } else {
    if (req.query.duration != undefined) {
      await User.updateOne(
        { id: user.id },
        { $set: { duration: req.query.duration } }
      );
    } else if (!req.session.USER.duration) {
      await User.updateOne({ id: user.id }, { $set: { duration: 10 } });
    }
  }
  res.render("general/waitingAPI", {
    type: type,
  });
});

/**
 * Renders the "404" view with the user's favorite workouts in the response after checking if they are authenticated.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
app.get("*", (req, res) => {
  res.render("errors/404");
});

/**
 * Starts the server and listens on the specified port
 *
 * @param {number} port - The port number to listen on.
 */
app.listen(port, () => {
  console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
