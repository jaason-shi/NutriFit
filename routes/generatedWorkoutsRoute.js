const express = require('express');
const generatedMealsRouter = express.Router();
const User = require('../models/userModel')
const Exercise = require('../models/exerciseModel')
const { ObjectId } = require('mongodb');


module.exports = generatedMealsRouter