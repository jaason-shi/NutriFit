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
});

const User = mongoose.model('User', userSchema)

module.exports = User;