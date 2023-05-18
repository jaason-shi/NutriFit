const express = require("express");
const workoutTrackingRouter = express.Router();
const User = require("../models/userModel");
const Workout = require("../models/workoutModel");
const Exercise = require("../models/exerciseModel");
const { ObjectID } = require("mongodb");
// FavoriteWorkout model
const FavoriteWorkout = require("../models/favWorkoutModel");

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

// POST Workout Logs page
workoutTrackingRouter.post("/workoutLogs", async (req, res) => {
  const date = new Date();

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
    console.log("Parsed workout: ");
    console.log(parsedWorkout);
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
    console.log("Parsed workout: ");
    console.log(parsedWorkout);
  }

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
    expireTime: new Date(date.getTime() + 5 * 60 * 1000),
  });

  await workoutLog.save();
  console.log("Saved");

  // delete session variables
  delete req.session.WORKOUT;

  res.redirect("/");
});


// Get workout logs
workoutTrackingRouter.get("/workoutLogs", async (req, res) => {
  let userId = req.session.USER.id
  let workouts = await Workout.find({ userId: userId })
  let totalDuration = 0
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      totalDuration += exercise.duration
    })
  })

  let bodyParts = workouts.map(workout => {
    return workout.exercises.map(exercise => {
      console.log(exercise)
      return exercise.bodyPart
    })
  })

  bodyParts = bodyParts.flat()

  console.log(bodyParts)
  const bodyPartSet = new Set(bodyParts);
  console.log(bodyPartSet)
  bodyParts = [...bodyPartSet]
  console.log(bodyParts)


  res.render("workoutLogs", {
    totalDuration: totalDuration,
    workouts: workouts,
    bodyParts: bodyParts
  });
});

module.exports = workoutTrackingRouter;
