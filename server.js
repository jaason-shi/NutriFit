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

/**
 * Route handlers
 */

// User route
app.use('/user', userRouter)

// Authenticated Route
app.use('/generatedMeals', generatedMealsRouter)




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

// function to query chatgpt api
async function queryChatGPT(mealsPrompt) {
  const request = require("request");

  const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

  const options = {
    url: OPENAI_API_ENDPOINT,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GPT_API_KEY}`,
      "OpenAI-Organization": process.env.GPT_ORG_ID,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: mealsPrompt }],
      temperature: 0.7,
    }),
  };

  return new Promise((resolve, reject) => {
    request.post(options, (error, response, body) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}


// Get bad api response page
app.get("/badApiResponse", (req, res) => {
  res.render("badApiResponse");
});


// Get logs page
app.get("/logs", async (req, res) => {
  res.render("logs");
});


// Get favorites page
app.get("/favourites", (req, res) => {
  res.render("favourites");
});


// Get favorite workouts  favoriteWorkouts
app.get("/favoriteWorkouts", (req, res) => {
  console.log(req.session.WORKOUT);
  // add the workout to the user's favorite workouts
  const workout = req.session.WORKOUT;
  const userId = req.session.USER.id;
  User.updateOne(
    { id: userId },
    { $addToSet: { favouriteWorkouts: workout } }
  ).then(() => {
    res.redirect("/favoriteWorkouts");
  });
  // delete session variables
  delete req.session.WORKOUT;
});


// Get Workout Logs page
app.get("/workoutLogs", (req, res) => {
  console.log(req.session.WORKOUT);
  // get total duration of the workouts
  let totalDuration = 0;
  req.session.WORKOUT.forEach((exercise) => {
    totalDuration += Number(exercise.duration);
  });
  // add the workout to the user's favorite workouts
  const workout = req.session.WORKOUT;
  const userId = req.session.USER.id;
  User.updateOne({ id: userId }, { $addToSet: { workoutLogs: workout } }).then(
    () => {
      res.render("/workoutLogs", { totalDuration: totalDuration });
    }
  );
  // delete session variables
  delete req.session.WORKOUT;
});


// Get favorite meals
app.get("/favoriteMeals", (req, res) => {
  console.log(req.session.MEAL);
  // add the meal to the user's favorite meals
  const meal = req.session.MEAL;
  const userId = req.session.USER.id;
  User.updateOne({ id: userId }, { $addToSet: { favouriteMeals: meal } }).then(
    () => {
      res.redirect("/favoriteMeals");
    }
  );
  // delete session variables
  delete req.session.MEAL;
});


// Get Food Logs page
app.get("/foodLogs", (req, res) => {
  console.log(req.session.MEAL);
  // get calories from the meal
  let totalCalories = 0;
  req.session.MEAL.forEach((food) => {
    totalCalories += Number(food.Calories);
  });
  // add the meal to the user's logs
  const meal = req.session.MEAL;
  const userId = req.session.USER.id;
  User.updateOne({ id: userId }, { $addToSet: { foodLogs: meal } }).then(() => {
    res.render("/foodLogs", { totalCalories: totalCalories });
  });
  // delete session variables
  delete req.session.MEAL;
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
    const dateString = date.toISOString();
  
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
      expireTime: new Date(date.getTime() + 5*60*1000) // set the expiry time 5 minutes from now
    });
  
    // Save the meal document
    await meal.save();
  
    let updatedUser = await User.findOne({ id: userId });
    req.session.USER = updatedUser;
    res.redirect("/quickAddMeal");
  });

// Queries the GPT 3.5 API for a workout
async function workoutGenerationQuery(duration, user) {
  let includedExercise = JSON.stringify(user.includeExercise);
  let excludedExercise = JSON.stringify(user.excludeExercise);
  let includedTags = user.exerciseTagInclude;
  let excludedTags = user.exerciseTagExclude;

  if (includedExercise == undefined) {
    includedExercise = [];
  }
  if (excludedExercise == undefined) {
    excludedExercise = [];
  }
  if (includedTags == undefined) {
    includedTags = [];
  }
  if (excludedTags == undefined) {
    excludedTags = [];
  }

  const exercisesPrompt =
    `Respond to me in this format:` +
    ' ```javascript[{ "name": String, "duration": int, "bodyPart": String}, ...]```' +
    `. Make me a sample ${duration} minute workout. The unit of the duration field is in minutes. Do not provide any extra text outside of` +
    ' ```javascript[{ "name": String, "duration": int, "bodyPart": String }, ...]```.' +
    `These json objects must be included: ${includedExercise}. Give them a duration. Include these categories: ${includedTags}. Exclude these exercises: ${excludedExercise}. Exclude these categories: ${excludedTags}. Remove all white space. Do not go over the duration of the workout.`;

  console.log(`Initial Prompt: ${exercisesPrompt}\n\n`);

  const response = await queryChatGPT(exercisesPrompt);
  const workout = JSON.parse(response).choices[0].message.content;

  console.log(`Response we get: ${workout}\n\n`);

  const codeBlockRegex = /```javascript([\s\S]+?)```/g;

  let matches = workout.match(codeBlockRegex);
  console.log(`\n\nAfter regex filter: ${matches}\n\n`);
  if (matches == null) {
    matches = workout.match(/\[[^\[\]]*\]/);
    console.log(`\n\nAfter regex filter Second: ${matches}\n\n`);
  }

  if (matches == null) {
    return undefined;
  }

  let codeBlockContent;

  if (matches && matches.length > 0) {
    codeBlockContent = matches.map((match) =>
      match.replace(/```javascript|```/g, "").trim()
    );
  }

  const workoutParsed = JSON.parse(codeBlockContent[0]);

  console.log("Final Product\n");
  console.log(workoutParsed);

  return workoutParsed;
}


// Get generated workouts
app.get("/generatedWorkouts", async (req, res) => {
  let duration;
  let user = req.session.USER;
  if (req.query.duration != undefined) {
    duration = req.query.duration;
  } else {
    duration = 10;
  }
  let workout = await workoutGenerationQuery(duration, user);
  // variable to store the workout in the session
  req.session.WORKOUT = workout;

  if (workout === undefined) {
    return res.redirect("/badApiResponse");
  } else {
    let totalDuration = 0;
    workout.forEach((exercise) => {
      totalDuration += exercise.duration;
    });
    res.render("generatedWorkouts", {
      workout: workout,
      totalDuration: totalDuration,
    });
  }
});


// Exercise tags
const exerciseCategory = [
  { name: "back" },
  { name: "cardio" },
  { name: "chest" },
  { name: "lower arms" },
  { name: "lower legs" },
  { name: "shoulders" },
  { name: "upper arms" },
  { name: "upper legs" },
  { name: "neck" },
  { name: "waist" },
];


// Get exercise filters
app.get("/workoutFilters", (req, res) => {
  let user = req.session.USER;

  res.render("workoutFilters", {
    tagsList: exerciseCategory,
    primaryUser: user,
    userInclude: user.includeExercise,
    userExclude: user.excludeExercise,
  });
});


// Modify exercise tag
app.post("/modifyExerciseTag", async (req, res) => {
  const exerciseTag = req.body.exerciseTag;
  const userId = req.session.USER.id;
  const type = req.body.type;
  let user = await User.findOne({ id: userId });

  if (type === "include") {
    if (
      user.exerciseTagInclude &&
      user.exerciseTagInclude.includes(exerciseTag)
    ) {
      // If the tag is already present, remove it
      await User.updateOne(
        { id: userId },
        { $pull: { exerciseTagInclude: exerciseTag } }
      );
    } else {
      // Otherwise, add the tag
      await User.updateOne(
        { id: userId },
        { $addToSet: { exerciseTagInclude: exerciseTag } }
      );
    }
  } else {
    if (
      user.exerciseTagExclude &&
      user.exerciseTagExclude.includes(exerciseTag)
    ) {
      // If the tag is already present, remove it
      await User.updateOne(
        { id: userId },
        { $pull: { exerciseTagExclude: exerciseTag } }
      );
    } else {
      // Otherwise, add the tag
      await User.updateOne(
        { id: userId },
        { $addToSet: { exerciseTagExclude: exerciseTag } }
      );
    }
  }

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("/workoutFilters");
});


// Get exercise catalog pages
app.get("/exerciseCatalog", (req, res) => {
  let type = req.query.type;
  res.render("exerciseCatalog", {
    type: type,
  });
});


// Search for exercises
app.get("/searchExercise", async (req, res) => {
  const searchQuery = req.query.q;
  let exerciseQuery = await Exercise.find({
    name: new RegExp(searchQuery, "i"),
  });
  let parsedResponse = exerciseQuery.map((exerciseObject) => {
    return {
      name: exerciseObject.name,
      bodyPart: exerciseObject.bodyPart,
      id: exerciseObject._id,
    };
  });

  res.json(parsedResponse);
});


// Select exercise to include or exclude
app.post("/selectExercise", async (req, res) => {
  const itemId = req.body.item;
  const userId = req.session.USER.id;
  let exerciseToAdd = await Exercise.findOne({ _id: new ObjectId(itemId) });

  let reqUrl = req.get("Referrer");
  let parsedUrl = new URL(reqUrl);
  let params = parsedUrl.searchParams;
  let type = params.get("type");

  if (type === "include") {
    await User.updateOne(
      { id: userId },
      {
        $addToSet: {
          includeExercise: {
            $each: [
              {
                name: exerciseToAdd.name,
                bodyPart: exerciseToAdd.bodyPart,
              },
            ],
          },
        },
      }
    );
  } else {
    await User.updateOne(
      { id: userId },
      {
        $addToSet: {
          excludeExercise: {
            $each: [
              {
                name: exerciseToAdd.name,
                bodyPart: exerciseToAdd.bodyPart,
              },
            ],
          },
        },
      }
    );
  }

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("/workoutFilters");
});


// Remove exercise from filter
app.post("/deleteExercise", async (req, res) => {
  const exerciseName = req.body.item;
  const userId = req.session.USER.id;
  const type = req.body.type;

  let exerciseToDelete = await Exercise.findOne({ name: exerciseName });

  if (type === "include") {
    await User.updateOne(
      { id: userId },
      {
        $pull: {
          includeExercise: {
            name: exerciseToDelete.name,
            bodyPart: exerciseToDelete.bodyPart,
          },
        },
      }
    );
  } else {
    await User.updateOne(
      { id: userId },
      {
        $pull: {
          excludeExercise: {
            name: exerciseToDelete.name,
            bodyPart: exerciseToDelete.bodyPart,
          },
        },
      }
    );
  }

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("/workoutFilters");
});


// Get Quick add workout page
app.get("/quickAddWorkout", async (req, res) => {
  res.render("quickAddWorkout");
});


// Post quick add workout data
app.post("/quickAddWorkout", async (req, res) => {
    const itemId = req.body.item;
    const duration = req.body.duration;
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
      expireTime: new Date(date.getTime() + 5*60*1000), // Set the expiry time 5 minutes from now
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


// Connect to port
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
