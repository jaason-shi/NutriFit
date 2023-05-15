/**
 * Exercise model for Exercise collection access
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const exerciseSchema = new Schema({
    bodyPart: String,
    equipment: String,
    gifIrl: String,
    id: Number,
    name: String,
    target: String
}, { collection: 'exercise' });

const Exercise = mongoose.model('Exercise', exerciseSchema)

module.exports = Exercise;