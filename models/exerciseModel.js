/**
 * Exercise model for Exercise collection access
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const exerciseSchema = new Schema({}, { collection: 'exercise' });

const Exercise = mongoose.model('Exercise', exerciseSchema)

module.exports = Exercise;