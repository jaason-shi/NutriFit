/**
 * User model for User collection access
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    id: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    answer: { type: String, required: true },
    foodTagInclude: [Schema.Types.Mixed],
    foodTagExclude: [Schema.Types.Mixed],
    exerciseTagInclude: [Schema.Types.Mixed],
    exerciseTagExclude: [Schema.Types.Mixed],
    includeExercise: [Schema.Types.Mixed],
    excludeExercise: [Schema.Types.Mixed],
    includeFood: [Schema.Types.Mixed],
    excludeFood: [Schema.Types.Mixed],
    generatedWorkouts: [Schema.Types.Mixed],
    generatedMeals: [Schema.Types.Mixed],
    favouriteWorkouts: [Schema.Types.Mixed],
    favouriteFoods: [Schema.Types.Mixed],
    workoutLogs: [Schema.Types.Mixed],
    foodLogs: [Schema.Types.Mixed],

});

const User = mongoose.model('User', userSchema)

module.exports = User;