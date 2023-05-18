const express = require("express");
const workoutTrackingRouter = express.Router();
const User = require("../models/userModel");
const Workout = require("../models/workoutModel");
const Exercise = require("../models/exerciseModel");
const { ObjectID } = require("mongodb");

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

module.exports = workoutTrackingRouter;
