/**
 * Workout model for Workout collection access.
 * This model is used for the user's logged workouts.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workoutSchema = new Schema({
  userId: { type: String, ref: 'User' },
  workoutName: String,
  exercises: [
    {
      name: String,
      duration: Number,
      bodyPart: String,
    },
  ],
  createdTime: { type: Date },
  expireTime: { type: Date, expires: 0 }
});

const Workout = mongoose.model('Workout', workoutSchema);

module.exports = Workout;