const express = require('express');
const generatedMealsRouter = express.Router();
const User = require('../models/userModel')
const Food = require('../models/foodModel')



module.exports = generatedMealsRouter