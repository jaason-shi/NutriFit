/**
 * Router to handle requests to endpoints related to workout tracking.
 */

// Set up dependencies
const express = require("express");
const workoutTrackingRouter = express.Router();

// Models
const Workout = require("../models/workoutModel");
const FavoriteWorkout = require("../models/favWorkoutModel");


/**
 * Sets the session workout to the correctly parsed workout object.
 * Depending on where the request came from, it is parsed and handled differently.
 * 
 * @param {Express.Request} req - the request object representing the received request
 */
async function parseWorkoutSession(req) {
  if (req.body.favoriteWorkoutId) {
    let favoriteWorkoutId = req.body.favoriteWorkoutId;
    let favoriteWorkout = await FavoriteWorkout.findById(favoriteWorkoutId);
    let parsedWorkout = favoriteWorkout.exercises.map((item) => {
      return {
        _id: item._id,
        name: item.name,
        duration: item.duration,
        bodyPart: item.bodyPart,
      };
    });
    req.session.WORKOUT = parsedWorkout;
  } else if (req.body.workout) {
    let stringWorkout = req.body.workout;
    let parsedWorkout = JSON.parse(stringWorkout);
    parsedWorkout = parsedWorkout.map((item) => {
      return {
        _id: item._id,
        name: item.name,
        duration: item.duration,
        bodyPart: item.bodyPart,
      };
    });
    req.session.WORKOUT = parsedWorkout;
  }
}


/**
 * Handles the POST request to add a workout to the current user's workout logs
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
workoutTrackingRouter.post("/workoutLogs", async (req, res) => {
  const date = new Date();

  await parseWorkoutSession(req)

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
    workoutName: workout[0].name + " Workout",
    exercises: workout,
    totalDuration: totalDuration,
    createdTime: new Date(),
    expireTime: new Date(date.getTime() + 60 * 60 * 1000),
  });

  await workoutLog.save();
  console.log("Saved");

  // delete session variables
  delete req.session.WORKOUT;

  res.redirect("/workoutTracking/workoutLogs");
});


/**
 * Filters the current user's logged workouts by date.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
workoutTrackingRouter.get("/filterWorkouts", async (req, res) => {
  req.session.WORKOUTS_LOGGED = await Workout.find({
    userId: req.session.USER.id,
  });
  const filterType = req.query.filterType;
  const today = new Date();

  let startDate;

  // Which filter was picked
  if (filterType === "day") {
    startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  } else if (filterType === "week") {
    startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filterType === "month") {
    startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  const filteredWorkouts = req.session.WORKOUTS_LOGGED.filter((workout) => {
    let createdTime = new Date(Date.parse(workout.createdTime));
    return createdTime >= startDate;
  });

  let totalDuration = 0;
  filteredWorkouts.forEach((workout) => {
    totalDuration += workout.totalDuration;
  });

  console.log("***\nFILTERED\n***");
  console.log(filteredWorkouts);
  req.session.FILTERED_WORKOUTS = filteredWorkouts;
  res.redirect("./workoutLogs");
});


/**
 * Gets the body parts worked from an array of workout objects with no duplicates.
 * 
 * @param {Array.<Object>} workouts the user's logged workouts
 * @returns {Array.<string>} the body parts that have been worked
 */
function getBodyParts(workouts) {
  let bodyParts = workouts.map((workout) => {
    return workout.exercises.map((exercise) => {
      return exercise.bodyPart;
    });
  });

  bodyParts = bodyParts.flat();
  const bodyPartSet = new Set(bodyParts);
  bodyParts = [...bodyPartSet];
  return bodyParts
}


/**
 * Renders the "workoutLogs" view with data in the response.
 * The data contains the following:
 * - the total duration of the logged workouts
 * - the current user's logged workouts
 * - the body parts that have been worked by the logged workouts
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
workoutTrackingRouter.get("/workoutLogs", async (req, res) => {
  let userId = req.session.USER.id;
  let workouts;

  if (req.session.FILTERED_WORKOUTS) {
    workouts = req.session.FILTERED_WORKOUTS;
    delete req.session.FILTERED_WORKOUTS;
  } else {
    workouts = await Workout.find({ userId: userId });
  }

  let totalDuration = 0;
  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      totalDuration += exercise.duration;
    });
  });


  let bodyParts = getBodyParts(workouts)

  res.render("logs/workoutLogs", {
    totalDuration: totalDuration,
    workouts: workouts,
    bodyParts: bodyParts,
  });
});

// Export the workoutTrackingRouter
module.exports = workoutTrackingRouter;
