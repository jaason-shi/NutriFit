/**
 * Food model for Food collection access
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const foodSchema = new Schema({
    Food: String,
    Measure: String,
    Grams: String,
    Calories: String,
    Protein: String,
    Fat: String,
    'Sat.Fat': String,
    Fiber: String,
    Carbs: String,
    Category: String
}, { collection: 'food' });

const Food = mongoose.model('Food', foodSchema)

module.exports = Food;