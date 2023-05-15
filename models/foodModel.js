/**
 * Food model for Food collection access
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const foodSchema = new Schema({}, { collection: 'food' });

const Food = mongoose.model('Food', foodSchema)

module.exports = Food;