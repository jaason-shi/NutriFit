/**
 * Router to handle requests to endpoints related to generated meals.
 */

// Set up dependencies
const express = require("express");
const generatedWorkoutsRouter = express.Router();
const User = require("../models/userModel");
const Exercise = require("../models/exerciseModel");
const { ObjectId } = require("mongodb");

// Workout model
const Workout = require("../models/workoutModel");
// FavoriteWorkout model
const FavoriteWorkout = require("../models/favWorkoutModel");
// Import function to query chatGPT
const { queryChatGPT, parseResponse } = require("./chatGptHelpers");

// Available exercise tags
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

/**
 * Queries the GPT API to generate a workout based on user conditions.
 *
 * @async
 * @param {number} duration - the duration that the workout will query to have
 * @param {Object} user - an object representing the current user
 * @returns {Array<Object>|undefined} - the workout as an array of JSON objects or undefined if parsing fails
 */
async function workoutGenerationQuery(duration, user) {
  let includedExercise = JSON.stringify(user.includeExercise) ?? [];
  let excludedExercise = JSON.stringify(user.excludeExercise) ?? [];
  let includedTags = user.exerciseTagInclude ?? [];
  let excludedTags = user.exerciseTagExclude ?? [];

  const exercisesPrompt =
    `Respond to me in this format:` +
    ' ```javascript[{ "name": String, "duration": int, "bodyPart": String}, ...]```' +
    `. Make me a sample ${duration} minute workout. The unit of the duration field is in minutes. Do not provide any extra text outside of` +
    ' ```javascript[{ "name": String, "duration": int, "bodyPart": String }, ...]```.' +
    `These json objects must be included: ${includedExercise}. Give them a duration. Include these categories: ${includedTags}. Exclude these exercises: ${excludedExercise}. Exclude these categories: ${excludedTags}. Remove all white space. Do not go over the duration of the workout.`;

  console.log(`Initial Prompt: ${exercisesPrompt}\n\n`);

  const response = await queryChatGPT(exercisesPrompt);
  let workoutParsed = parseResponse(response);

  console.log("Final Product\n");
  console.log(workoutParsed);

  return workoutParsed;
}

/**
 * Renders the "generatedMeals" view with data in the response.
 * The data contains the following:
 * - the workout
 * - the duration of the workout
 * - the user's included tags
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.get("/", async (req, res) => {
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
    res.render("generatedWorkouts/generatedWorkouts", {
      workout: workout,
      totalDuration: totalDuration,
      tagsList: user.exerciseTagInclude,
    });
  }
});

/**
 * Renders the "quickAddWorkout" view in the response.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.get("/quickAddWorkout", async (req, res) => {
  res.render("generatedWorkouts/quickAddWorkout");
});

/**
 * Handles the POST request to quick add a workout.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.post("/quickAddWorkout", async (req, res) => {
  const itemId = req.body.item;
  const duration = req.body.duration || 10; // If no duration is specified, set it to 10 min by default
  const userId = req.session.USER.id;
  let workoutToAdd = await Exercise.findOne({ _id: new ObjectId(itemId) });

  // Get current date and time
  const date = new Date();

  // Create a new workout document
  const workout = new Workout({
    userId: userId,
    workoutName: workoutToAdd.name,
    exercises: [
      {
        name: workoutToAdd.name,
        duration: duration,
        bodyPart: workoutToAdd.bodyPart,
      },
    ],
    expireTime: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000), // set the expiry time 30 days from now
    createdTime: new Date(),
  });

  // Save the workout document
  await workout.save();

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("/workoutTracking/workoutLogs");
});

/**
 * Renders the "workoutFilters" view with data in the response.
 * The data includes the following:
 * - the current user
 * - the user's included exercises
 * - the user's excluded exercises
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.get("/workoutFilters", (req, res) => {
  let user = req.session.USER;

  res.render("generatedWorkouts/workoutFilters", {
    tagsList: exerciseCategory,
    primaryUser: user,
    userInclude: user.includeExercise,
    userExclude: user.excludeExercise,
  });
});

/**
 * Renders the "exerciseCatalog" view with the type of catalog in the response.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.get("/exerciseCatalog", (req, res) => {
  let type = req.query.type;
  res.render("generatedWorkouts/exerciseCatalog", {
    type: type,
  });
});

/**
 * Updates the user's exercise tag to include or exclude.
 *
 * @param {string} type - the type of the tag to update, include or exclude
 * @param {Object} user - an object representing the current user
 * @param {string} userId - the ID of the user to update
 * @param {string} exerciseTag - the name of the tag to include or exclude
 */
async function updateExerciseTag(type, user, userId, exerciseTag) {
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
}

/**
 * Handles the POST request to modify the exercise tags included or excluded
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.post("/modifyExerciseTag", async (req, res) => {
  const exerciseTag = req.body.exerciseTag;
  const userId = req.session.USER.id;
  const type = req.body.type;
  let user = await User.findOne({ id: userId });
  await updateExerciseTag(type, user, userId, exerciseTag);

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("./workoutFilters");
});

/**
 * Sends a JSON object in the response containing an array of objects that fit the search query.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.get("/searchExercise", async (req, res) => {
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

/**
 * Adds an exercise to the user's included or excluded exercises.
 *
 * @param {string} type - the type of the exercise, include or exclude
 * @param {string} userId - the ID of the current user
 * @param {Object} exerciseToAdd - the exercise to be included or excluded
 */
async function addExerciseUser(type, userId, exerciseToAdd) {
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
}

/**
 * Handles the POST request to add selected exercises to include or exclude
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.post("/selectExercise", async (req, res) => {
  const itemId = req.body.item;
  const userId = req.session.USER.id;
  let exerciseToAdd = await Exercise.findOne({ _id: new ObjectId(itemId) });

  let reqUrl = req.get("Referrer");
  let parsedUrl = new URL(reqUrl);
  let params = parsedUrl.searchParams;
  let type = params.get("type");

  await addExerciseUser(type, userId, exerciseToAdd);

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("./workoutFilters");
});

/**
 * Deletes an exercise from the current user's included or excluded exercises
 *
 * @param {string} type - the type of the exercise, include or exclude
 * @param {string} userId - the ID of the current user
 * @param {Object} exerciseToDelete - the exercise to be deleted
 */
async function deleteExerciseUser(type, userId, exerciseToDelete) {
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
}

/**
 * Handles the POST request to remove selected exercises to include or exclude
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.post("/deleteExercise", async (req, res) => {
  const exerciseName = req.body.item;
  const userId = req.session.USER.id;
  const type = req.body.type;

  let exerciseToDelete = await Exercise.findOne({ name: exerciseName });

  await deleteExerciseUser(type, userId, exerciseToDelete);

  let updatedUser = await User.findOne({ id: userId });
  req.session.USER = updatedUser;
  res.redirect("./workoutFilters");
});

/**
 * Handles the POST request for adding the generated workout to the current user's favorite workouts.
 *
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
generatedWorkoutsRouter.post("/favoriteWorkouts", async (req, res) => {
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
  res.redirect("/favoriteWorkouts");
});

/**
 * Handles the POST request for deleting a workout from the current user's favorite workouts.
 */
generatedWorkoutsRouter.post(
  "/deleteFromFavoriteWorkouts",
  async (req, res) => {
    const workout = req.body.WORKOUT;
    const userId = req.session.USER.id;
    try {
      await FavoriteWorkout.deleteOne({ userId: userId, _id: workout });
      res.redirect("/favoriteWorkouts");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error deleting workout from favorites");
    }
  }
);
// Export the generateWorkoutsRouter
module.exports = generatedWorkoutsRouter;
