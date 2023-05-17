const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favWorkoutSchema = new Schema({
  userId: { type: String, ref: "User" },
  workoutName: String,
  exercises: [
    {
      name: String,
      duration: Number,
      bodyPart: String,
    },
  ],
  
});

const favWorkout = mongoose.model("FavoriteWorkout", favWorkoutSchema);

module.exports = favWorkout;
