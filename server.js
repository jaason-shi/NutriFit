/**
 * Main server file
 */

// Set up dependencies
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const saltRounds = 10
const { ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const url = require('url');
require('dotenv').config();

// Set up app (express)
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(bodyParser.json());

// Set up MongoDB connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true });
mongoose.connection.once('open', () => {
    console.log("Connected to MongoDB Atlas.")
})

// Set up MongoDB Session store
var sessionStore = MongoStore.create({
    mongoUrl: uri,
    cypto: {
        secret: process.env.SESSION_KEY
    }
})

// Set up sessions
app.use(session({
    secret: process.env.SESSION_KEY,
    store: sessionStore,
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: 60 * 60 * 1000 }
}))

/**
 * Set up form field validation to protect against DB query attacks.
 * The '$ : {} ()' characters is used to get information from mongoDB, so it is not allowed. e.g. username: {$exists: true}}
 */
const basicStringSchema = Joi.string().regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();
const emailSchema = Joi.string().email({ minDomainSegments: 2 }).regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();
const passwordSchema = Joi.string().regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();

// User model
const User = require('./models/userModel')

// Food model
const Food = require('./models/foodModel')

// Exercise model
const Exercise = require('./models/exerciseModel')

// Basic landing page 
app.get('/', (req, res) => {
    if (req.session.AUTH) {
        return res.redirect('/members')
    }
    res.render('home')
})

// Get login page
app.get('/login', (req, res) => {
    res.render('login')
})


// Get signup page
app.get('/signup', (req, res) => {
    res.render('signup')
})

// Post signup page data
app.post('/signup', async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    let password = req.body.password;
    let answer = req.body.answer;

    if (basicStringSchema.validate(id).error != null) {
        req.session.INVALID_FIELD = 'ID'
        res.redirect('/invalidFormData')
    } else if (emailSchema.validate(email).error != null) {
        req.session.INVALID_FIELD = 'Email'
        res.redirect('/invalidFormData')
    } else if (passwordSchema.validate(password).error != null) {
        req.session.INVALID_FIELD = 'Password'
        res.redirect('/invalidFormData')
    } else if (basicStringSchema.validate(answer).error != null) {
        req.session.INVALID_FIELD = 'Answer'
        res.redirect('/invalidFormData')
    } else {
        password = await bcrypt.hash(password, saltRounds);
        answer = await bcrypt.hash(answer, saltRounds)

        // Check if the fields already exist in the database
        const matchID = await User.findOne({ id: id })
        const matchEmail = await User.findOne({ email: email })

        if (matchID != undefined) {
            req.session.MATCH = 'name';
            return res.redirect('/alreadyExists')
        }

        if (matchEmail != undefined) {
            req.session.MATCH = 'email';
            return res.redirect('/alreadyExists')
        }

        const newUser = new User({
            id: id,
            email: email,
            password: password,
            answer: answer,
        })

        newUser.save().then(async () => {
            req.session.USER = await User.findOne({ id: req.body.id })
            req.session.AUTH = true;
            req.session.ROLE = 'User'
            res.redirect('/members')
        })
    }
});


// Get login page
app.get('/login', (req, res) => {
    res.render('login', { primaryUser: req.session.USER });
})


// Get email page for changing passwords
app.get('/getEmail', (req, res) => {
    res.render('getEmail')
})


// Post email page data for changing passwords
app.post('/getEmail', async (req, res) => {
    const email = req.body.email;
    if (emailSchema.validate(email).error != null) {
        req.session.INVALID_FIELD = 'Email'
        return res.redirect('/invalidFormData')
    }
    User.findOne({ email: email }).then((user) => {
        req.session.USER = user;
        return res.redirect('/checkSecurity')
    })

})


// Get answer security question page
app.get('/checkSecurity', (req, res) => {
    res.render('checkSecurity', {
        primaryUser: req.session.USER
    })
})

// Post answer security question page
app.post('/checkSecurity', async (req, res) => {
    let answer = req.body.answer;
    answer = await bcrypt.hash(answer, saltRounds)
    if (bcrypt.compare(answer, req.session.USER.answer)) {
        return res.redirect('/changePassword')
    } else {
        return res.redirect('/incorrectAnswer')
    }
})


// Get incorrect answer page
app.get('/incorrectAnswer', (req, res) => {
    res.render('incorrectAnswer', {
        referer: req.headers.referer
    })
})


// Get change password page
app.get('/changePassword', (req, res) => {
    res.render('changePassword.ejs')
})


// Post change password page
app.post('/changePassword', async (req, res) => {
    let password = req.body.password
    if (passwordSchema.validate(password).error != null) {
        req.session.INVALID_FIELD = 'Password'
        return res.redirect('/invalidFormData')
    }
    password = await bcrypt.hash(req.body.password, saltRounds);
    await User.updateOne({ email: req.session.USER.email }, { $set: { password: password } })
    const user = await User.findOne({ email: req.session.USER.email })
    delete req.session.USER
    return res.redirect('/changePasswordSuccess')
})


// Get change password success page
app.get('/changePasswordSuccess', (req, res) => {
    res.render('changePasswordSuccess')
})


// Post login page
app.post(('/login'), async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const emailValidationResult = basicStringSchema.validate(email);
    const passwordValidationResult = passwordSchema.validate(password);

    let user = await User.findOne({ $or: [{ email: email }, { id: email }] })
    if (emailValidationResult.error != null) {
        req.session.INVALID_FIELD = 'Email or ID'
        res.redirect('/invalidFormData')
    } else if (passwordValidationResult.error != null) {
        req.session.INVALID_FIELD = 'Password'
        res.redirect('/invalidFormData')
    } else {
        if (user === undefined) {
            req.session.AUTH = false;
            req.session.FAIL_FORM = true;
        } else {
            if (await bcrypt.compare(password, user.password)) {
                req.session.AUTH = true;
                req.session.ROLE = user.role;
                req.session.USER = user
            } else {
                req.session.AUTH = false;
                req.session.FAIL_FORM = true;
            }
        }
        res.redirect('/members');
    }
})



// Get invalid form data page
app.get('/invalidFormData', (req, res) => {
    res.render('invalidFormData', {
        invalidField: req.session.INVALID_FIELD,
        referer: req.headers.referer
    })
})


// Middleware: Checks if the user is authenticated
const checkAuth = (req, res, next) => {
    if (!req.session.AUTH) {
        if (req.session.FAIL_FORM) {
            delete req.session.FAIL_FORM
            return res.redirect('/authFail');
        } else {
            delete req.session.FAIL_FORM
            return res.redirect('/login');
        }
    }
    next();
};


// Post logout page
app.post('/logOut', (req, res) => {
    req.session.destroy();
    res.redirect('./');
})


// Get authentication failure page
app.get('/authFail', (req, res) => {
    res.render('authFail', {
        primaryUser: req.session.USER,
        referer: req.headers.referer
    })
})


// Get members page
app.get('/members', checkAuth, (req, res) => {
    res.render('members', {
        primaryUser: req.session.USER,
    })
});


// Get user profile page
app.get('/userProfile', (req, res) => {
    res.render('userProfile', {
        primaryUser: req.session.USER
    })
})


// function to query chatgpt api
async function queryChatGPT(mealsPrompt) {
    const request = require("request");

    const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

    const options = {
        url: OPENAI_API_ENDPOINT,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GPT_API_KEY}`,
            "OpenAI-Organization": process.env.GPT_ORG_ID,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: mealsPrompt }],
            temperature: 0.7,
        }),
    };

    return new Promise((resolve, reject) => {
        request.post(options, (error, response, body) => {
            if (error) {
                console.error(error);
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}


async function mealGenerationQuery(calories, user) {

    let includedFood = JSON.stringify(user.includeFood);
    let excludedFood = JSON.stringify(user.excludeFood);
    let includedTags = user.foodTagInclude;
    let excludedTags = user.foodTagExclude;

    if (includedFood == undefined) {
        includedFood = [];
    }
    if (excludedFood == undefined) {
        excludedFood = [];
    }
    if (includedTags == undefined) {
        includedTags = [];
    }
    if (excludedTags == undefined) {
        excludedTags = [];
    }

    const mealsPrompt =
        `Respond to me in this format:` + ' ```javascript[{ "name": String, "calories": int, "grams": int}, ...]```' + `. Make me a sample ${calories} calorie meal. Do not provide any extra text outside of` + ' ```javascript[{ "name": String, "calories": int, "grams": int }, ...]```.' + `Include these food items: ${includedFood}. Include these categories: ${includedTags}. Exclude these food items: ${excludedFood}. Exclude these categories: ${excludedTags}. Remove all white space. Do not go over the calorie limit of the meal. Give me a response`

    console.log(`Initial Prompt: ${mealsPrompt}\n\n`)

    const response = await queryChatGPT(mealsPrompt);
    const mealPlan = JSON.parse(response).choices[0].message.content;

    console.log(`The response we get: ${mealPlan}\n\n`)

    const codeBlockRegex = /```javascript([\s\S]+?)```/g;
    let matches = mealPlan.match(codeBlockRegex);

    console.log(`After regex filter: ${matches}\n\n`)
    if (matches == null) {
        matches = mealPlan.match(/\[[^\[\]]*\]/)
        console.log(`After regex filter Second: ${matches}\n\n`)
    }

    if (matches == null) {
        console.log("REGENERATING\n\n")
        return mealGenerationQuery(calories, user)
    }
    let codeBlockContent;

    if (matches && matches.length > 0) {
        codeBlockContent = matches.map(match => match.replace(/```javascript|```/g, '').trim());
    }

    const mealPlanParsed = JSON.parse(codeBlockContent[0])
    const stringify = JSON.stringify(mealPlanParsed)

    return mealPlanParsed;
}


// Get generated meals
app.get('/generatedMeals', async (req, res) => {
    let calories;
    if (req.query.calories != undefined) {
        calories = req.query.calories;
    } else {
        calories = 500;
    }
    console.log(`Calories: ${calories}\n\n`)
    mealGenerationQuery(calories, req.session.USER).then((mealPlan) => {
        let totalCalories = 0;
        mealPlan.forEach((item) => {
            totalCalories += item.calories
        })
        res.render('generatedMeals', {
            foodItems: mealPlan,
            totalCalories: totalCalories,
            userSpecifiedCalories: req.query.calories
        })
    })
})


const foodCategory = [
    { name: 'Dairy products' },
    { name: 'Fats, Oils, Shortenings' },
    { name: 'Meat, Poultry' },
    { name: 'Fish, Seafood' },
    { name: 'Vegetables A-E' },
    { name: 'Vegetables F-P' },
    { name: 'Vegetables R-Z' },
    { name: 'Fruits A-F' },
    { name: 'Fruits G-P' },
    { name: 'Fruits R-Z' },
    { name: 'Breads, cereals, fastfood, grains' },
    { name: 'Soups' },
    { name: 'Desserts, sweets' },
    { name: 'Jams, Jellies' },
    { name: 'Seeds and Nuts' },
    { name: 'Drinks,Alcohol, Beverages' },
];


// Get meal filters
app.get('/mealFilters', async (req, res) => {
    const user = req.session.USER
    res.render('mealFilters', {
        tagsList: foodCategory,
        userInclude: user.includeFood,
        userExclude: user.excludeFood,
        primaryUser: user

    })
})


// Get meal catalog page to include
app.get('/foodCatalogInclude', (req, res) => {
    res.render('foodCatalogInclude')
})


// Search for food
app.get('/searchFood', async (req, res) => {
    const searchQuery = req.query.q;
    let foodQuery = await Food.find({ Food: new RegExp(searchQuery, 'i') })
    let parsedResponse = foodQuery.map((foodObject) => {
        return {
            name: foodObject.Food,
            measure: foodObject.Measure,
            id: foodObject._id
        }
    })

    res.json(parsedResponse)
});


// Select food to include or exclude
app.post('/selectFood', async (req, res) => {
    const itemId = req.body.item;
    const userId = req.session.USER.id;
    let foodToAdd = await Food.findOne({ _id: new ObjectId(itemId) })

    let reqUrl = req.get('Referrer')
    let parsedUrl = url.parse(reqUrl)
    let path = parsedUrl.pathname;

    if (path === '/foodCatalogInclude') {
        await User.updateOne({ id: userId },
            {
                $addToSet: {
                    includeFood: {
                        $each: [{
                            Food: foodToAdd.Food,
                            Calories: foodToAdd.Calories,
                            Grams: foodToAdd.Grams
                        }]
                    }
                }
            }
        )
    } else {
        await User.updateOne({ id: userId },
            {
                $addToSet: {
                    excludeFood: {
                        $each: [{
                            Food: foodToAdd.Food,
                            Calories: foodToAdd.Calories,
                            Grams: foodToAdd.Grams
                        }]
                    }
                }
            }
        )
    }

    let updatedUser = await User.findOne({ id: userId })
    req.session.USER = updatedUser;
    res.redirect('/mealFilters');
});


// Modify food tag
app.post('/modifyFoodTag', async (req, res) => {
    const foodTag = req.body.foodTag;
    const userId = req.session.USER.id
    const type = req.body.type
    let user = await User.findOne({ id: userId });

    if (type === 'include') {
        if (user.foodTagInclude && user.foodTagInclude.includes(foodTag)) {
            // If the tag is already present, remove it
            await User.updateOne(
                { id: userId },
                { $pull: { foodTagInclude: foodTag } }
            );
        } else {
            // Otherwise, add the tag
            await User.updateOne(
                { id: userId },
                { $addToSet: { foodTagInclude: foodTag } }
            );
        }
    } else {
        if (user.foodTagExclude && user.foodTagExclude.includes(foodTag)) {
            // If the tag is already present, remove it
            await User.updateOne(
                { id: userId },
                { $pull: { foodTagExclude: foodTag } }
            );
        } else {
            // Otherwise, add the tag
            await User.updateOne(
                { id: userId },
                { $addToSet: { foodTagExclude: foodTag } }
            );
        }
    }

    let updatedUser = await User.findOne({ id: userId })
    req.session.USER = updatedUser;
    res.redirect('/mealFilters');
});


// Get meal catalog page to exclude
app.get('/foodCatalogExclude', (req, res) => {
    res.render('foodCatalogExclude')
})


// Remove food item from filter
app.post('/deleteFood', async (req, res) => {
    const foodName = req.body.item;
    const userId = req.session.USER.id
    const type = req.body.type

    let foodToDelete = await Food.findOne({ Food: foodName })

    if (type === 'include') {
        await User.updateOne(
            { id: userId },
            {
                $pull: {
                    includeFood: {
                        Food: foodToDelete.Food,
                        Calories: foodToDelete.Calories,
                        Grams: foodToDelete.Grams
                    }
                }
            }
        )
    } else {
        await User.updateOne(
            { id: userId },
            {
                $pull: {
                    excludeFood: {
                        Food: foodToDelete.Food,
                        Calories: foodToDelete.Calories,
                        Grams: foodToDelete.Grams
                    }
                }
            }
        )
    }

    let updatedUser = await User.findOne({ id: userId })
    req.session.USER = updatedUser;
    res.redirect('/mealFilters');
});

app.get('/logs', async (req, res) => {
    res.render('logs')
})

app.get('/favourites', (req, res) => {
    res.render('favourites')
})

// Get favorite meals
app.get('/favoriteMeals', (req, res) => {
    res.render('favoriteMeals')
})


async function workoutGenerationQuery(duration, user) {

    let includedExercise = JSON.stringify(user.includeExercise);
    let excludedExercise = JSON.stringify(user.excludeExercise);
    let includedTags = user.exerciseTagInclude;
    let excludedTags = user.exerciseTagExclude;

    if (includedExercise == undefined) {
        includedExercise = [];
    }
    if (excludedExercise == undefined) {
        excludedExercise = [];
    }
    if (includedTags == undefined) {
        includedTags = [];
    }
    if (excludedTags == undefined) {
        excludedTags = [];
    }

    const exercisesPrompt =
        `Respond to me in this format:` + ' ```javascript[{ "name": String, "duration": int, "bodyPart": String}, ...]```' + `. Make me a sample ${duration} minute workout. The unit of the duration field is in minutes. Do not provide any extra text outside of` + ' ```javascript[{ "name": String, "duration": int, "bodyPart": String }, ...]```.' + `Include these exercises: ${includedExercise}. Include these categories: ${includedTags}. Exclude these exercises: ${excludedExercise}. Exclude these categories: ${excludedTags}. Remove all white space. Do not go over the duration of the workout.`

    console.log(`Initial Prompt: ${exercisesPrompt}\n\n`)

    const response = await queryChatGPT(exercisesPrompt);
    const workout = JSON.parse(response).choices[0].message.content;

    console.log(`Response we get: ${workout}\n\n`)

    const codeBlockRegex = /```javascript([\s\S]+?)```/g;

    let matches = workout.match(codeBlockRegex);
    console.log(`\n\nAfter regex filter: ${matches}\n\n`)
    if (matches == null) {
        matches = workout.match(/\[[^\[\]]*\]/)
        console.log(`\n\nAfter regex filter Second: ${matches}\n\n`)
    }

    let codeBlockContent;

    if (matches && matches.length > 0) {
        codeBlockContent = matches.map(match => match.replace(/```javascript|```/g, '').trim());
    }

    const workoutParsed = JSON.parse(codeBlockContent[0])
    const stringify = JSON.stringify(workoutParsed)

    return workoutParsed;
}


// Get generated exercises
app.get('/generatedWorkouts', (req, res) => {
    let duration;
    if (req.query.duration != undefined) {
        duration = req.query.duration;
    } else {
        duration = 10;
    }
    console.log(`Duration: ${duration}\n\n`)
    console.log("\n\n\nBREAK\n\n\n")
    workoutGenerationQuery(duration, req.session.USER).then((workout) => {
        let totalDuration = 0;
        workout.forEach((item) => {
            totalDuration += item.duration
        })
        res.render('generatedWorkouts', {
            workout: workout,
            totalDuration: totalDuration
        })
    })
})

// Exercise tags
const exerciseCategory = [
    { name: 'back' },
    { name: 'cardio' },
    { name: 'chest' },
    { name: 'lower arms' },
    { name: 'lower legs' },
    { name: 'shoulders' },
    { name: 'upper arms' },
    { name: 'upper legs' },
    { name: 'neck' },
    { name: 'waist' },
];


// Get exercise filters
app.get('/workoutFilters', (req, res) => {
    let user = req.session.USER;
    res.render('workoutFilters', {
        tagsList: exerciseCategory,
        primaryUser: user,
        userInclude: user.includeExercise,
        userExclude: user.excludeExercise
    })
})


// Modify exercise tag
app.post('/modifyExerciseTag', async (req, res) => {

    const exerciseTag = req.body.exerciseTag;
    const userId = req.session.USER.id
    const type = req.body.type
    let user = await User.findOne({ id: userId });

    if (type === 'include') {
        if (user.exerciseTagInclude && user.exerciseTagInclude.includes(exerciseTag)) {
            // If the tag is already present, remove it
            await User.updateOne(
                { id: userId },
                { $pull: { exerciseTagInclude: exerciseTag } }
            );
        } else {
            // Otherwise, add the tag
            await User.updateOne(
                { id: userId },
                { $addToSet: { exerciseTagInclude: exerciseTag } }
            );
        }
    } else {
        if (user.exerciseTagExclude && user.exerciseTagExclude.includes(exerciseTag)) {
            // If the tag is already present, remove it
            await User.updateOne(
                { id: userId },
                { $pull: { exerciseTagExclude: exerciseTag } }
            );
        } else {
            // Otherwise, add the tag
            await User.updateOne(
                { id: userId },
                { $addToSet: { exerciseTagExclude: exerciseTag } }
            );
        }
    }

    let updatedUser = await User.findOne({ id: userId })
    req.session.USER = updatedUser;
    res.redirect('/workoutFilters');
});


// Get exercise catalog Include
app.get('/exerciseCatalogInclude', (req, res) => {
    res.render('exerciseCatalogInclude')
})


// Search for exercises
app.get('/searchExercise', async (req, res) => {
    const searchQuery = req.query.q;
    let exerciseQuery = await Exercise.find({ name: new RegExp(searchQuery, 'i') })
    let parsedResponse = exerciseQuery.map((exerciseObject) => {
        return {
            name: exerciseObject.name,
            bodyPart: exerciseObject.bodyPart,
            id: exerciseObject._id
        }
    })

    res.json(parsedResponse)
});


// Select exercise to include or exclude
app.post('/selectExercise', async (req, res) => {
    const itemId = req.body.item;
    const userId = req.session.USER.id;
    let exerciseToAdd = await Exercise.findOne({ _id: new ObjectId(itemId) })

    let reqUrl = req.get('Referrer')
    let parsedUrl = url.parse(reqUrl)
    let path = parsedUrl.pathname;

    if (path === '/exerciseCatalogInclude') {
        await User.updateOne({ id: userId },
            {
                $addToSet: {
                    includeExercise: {
                        $each: [{
                            name: exerciseToAdd.name,
                            bodyPart: exerciseToAdd.bodyPart
                        }]
                    }
                }
            }
        )
    } else {
        await User.updateOne({ id: userId },
            {
                $addToSet: {
                    excludeExercise: {
                        $each: [{
                            name: exerciseToAdd.name,
                            bodyPart: exerciseToAdd.bodyPart
                        }]
                    }
                }
            }
        )
    }

    let updatedUser = await User.findOne({ id: userId })
    req.session.USER = updatedUser;
    res.redirect('/workoutFilters');
});


// Remove exercise from filter
app.post('/deleteExercise', async (req, res) => {
    const exerciseName = req.body.item;
    const userId = req.session.USER.id
    const type = req.body.type

    let exerciseToDelete = await Exercise.findOne({ name: exerciseName })

    if (type === 'include') {
        await User.updateOne(
            { id: userId },
            {
                $pull: {
                    includeExercise: {
                        name: exerciseToDelete.name,
                        bodyPart: exerciseToDelete.bodyPart
                    }
                }
            }
        )
    } else {
        await User.updateOne(
            { id: userId },
            {
                $pull: {
                    excludeExercise: {
                        name: exerciseToDelete.name,
                        bodyPart: exerciseToDelete.bodyPart
                    }
                }
            }
        )
    }

    let updatedUser = await User.findOne({ id: userId })
    req.session.USER = updatedUser;
    res.redirect('/workoutFilters');
});


// Get exercise catalog Exclude
app.get('/exerciseCatalogExclude', (req, res) => {
    res.render('exerciseCatalogExclude')
})


// Get workout logs
app.get('/workoutLogs', (req, res) => {
    res.render('workoutLogs')
})


// Connect to port
const port = 3000;
app.listen((port), () => {
    console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
