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

// GET exercise logs depending on if the user clicks day, week, or month
workoutTrackingRouter.post("/filterWorkouts", async (req, res) => {
  req.session.WORKOUTS_LOGGED = await Workout.find({
    userId: req.session.USER.id,
  });
  const filterType = req.body.filterType;
  const today = new Date();

  console.log("Today");
  console.log(today);

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
    console.log(workout.workoutName);
    console.log("Created ");
    console.log(createdTime);
    console.log("Start");
    console.log(startDate);
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

// Get test populate button
workoutTrackingRouter.get("/testPopulate", (req, res) => {
  //console.log("Test populate")
  res.render("testPopulate");
});

// TestPostMealData
workoutTrackingRouter.post("/testPopulateWorkouts", async (req, res) => {
  let testWorkout = await Workout.findOne({ userId: req.session.USER.id });
  let currentDay = new Date();
  const yesterday = new Date(
    currentDay.getFullYear(),
    currentDay.getMonth(),
    currentDay.getDate() - 2
  );
  const week = new Date(
    currentDay.getFullYear(),
    currentDay.getMonth(),
    currentDay.getDate() - 8
  );
  // let month = new Date(currentDay.getTime() - 40 * 24 * 60 * 60 * 1000);
  const month = new Date(
    currentDay.getFullYear(),
    currentDay.getMonth() - 1,
    currentDay.getDate() - 1
  );

  let newWorkoutDay = new Workout({
    userId: testWorkout.userId,
    workoutName: testWorkout.workoutName + " Day",
    exercises: testWorkout.exercises,
    expireTime: testWorkout.expireTime,
    createdTime: yesterday,
  });

  let newWorkoutWeek = new Workout({
    userId: testWorkout.userId,
    workoutName: testWorkout.workoutName + " Week",
    exercises: testWorkout.exercises,
    expireTime: testWorkout.expireTime,
    createdTime: week,
  });

  let newWorkoutMonth = new Workout({
    userId: testWorkout.userId,
    workoutName: testWorkout.workoutName + " Month",
    exercises: testWorkout.exercises,
    expireTime: testWorkout.expireTime,
    createdTime: month,
  });

  await newWorkoutDay.save();
  await newWorkoutWeek.save();
  await newWorkoutMonth.save();

  //console.log("Populating...")
  res.redirect("./testPopulate");
});

// Get workout logs
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

  let bodyParts = workouts.map((workout) => {
    return workout.exercises.map((exercise) => {
      return exercise.bodyPart;
    });
  });

  bodyParts = bodyParts.flat();
  const bodyPartSet = new Set(bodyParts);
  bodyParts = [...bodyPartSet];

  res.render("workoutLogs", {
    totalDuration: totalDuration,
    workouts: workouts,
    bodyParts: bodyParts,
  });
});

workoutTrackingRouter.get("*", (req, res) => {
  const currentPage = "*";
  res.render("404", { currentPage });
});

module.exports = workoutTrackingRouter;
