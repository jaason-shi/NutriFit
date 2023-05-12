const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const saltRounds = 10
const ejs = require('ejs');
const { ObjectId } = require('mongodb');
const bodyParser = require('body-parser');

require('dotenv').config();

const app = express();
const Schema = mongoose.Schema;
const MongoClient = require('mongodb').MongoClient;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(bodyParser.json());


// Set up MongoDB
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true });
mongoose.connection.once('open', () => {
    console.log("Connected to MongoDB Atlas.")
})

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


// The '$ : {} ()' characters is used to get information from mongoDB, so it is not allowed. e.g. username: {$exists: true}}
const idSchema = Joi.string().regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();
const emailSchema = Joi.string().email({ minDomainSegments: 2 }).regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();
const passwordSchema = Joi.string().regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();


// User Model
const userSchema = new Schema({
    id: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    answer: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);


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

    if (idSchema.validate(id).error != null) {
        req.session.INVALID_FIELD = 'ID'
        res.redirect('/invalidFormData')
    } else if (emailSchema.validate(email).error != null) {
        req.session.INVALID_FIELD = 'Email'
        res.redirect('/invalidFormData')
    } else if (passwordSchema.validate(password).error != null) {
        req.session.INVALID_FIELD = 'Password'
        res.redirect('/invalidFormData')
    } else if (idSchema.validate(answer).error != null) {
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
            id,
            email,
            password,
            answer
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
        console.log(req.session.USER)
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
app.post(('/login'), (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const emailValidationResult = idSchema.validate(email);
    const passwordValidationResult = passwordSchema.validate(password);

    User.find({ $or: [{ email: email }, { id: email }] }).exec().then(async (users) => {

        if (emailValidationResult.error != null) {
            req.session.INVALID_FIELD = 'Email or ID'
            res.redirect('/invalidFormData')
        } else if (passwordValidationResult.error != null) {
            req.session.INVALID_FIELD = 'Password'
            res.redirect('/invalidFormData')
        } else {
            if (users.length === 0) {
                req.session.AUTH = false;
                req.session.FAIL_FORM = true;
            } else {
                if (await bcrypt.compare(password, users[0].password)) {
                    req.session.AUTH = true;
                    req.session.ROLE = users[0].role;
                    req.session.USER = users[0]
                } else {
                    req.session.AUTH = false;
                    req.session.FAIL_FORM = true;
                }
            }
            res.redirect('/members');
        }
    })
});


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


// Simulate a request to the api

async function processRequest() {
    let Food;

    await MongoClient.connect(uri, { useNewUrlParser: true }).then((client) => {
        Food = client.db('NutriFit').collection('food');
    })
    const foodItem = await Food.findOne({ Food: "Buttermilk" })
    const foodItemParse = {
        "name": foodItem.Food,
        "calories": foodItem.Calories,
        "quantityG": foodItem.Grams
    }
    const stringParse = JSON.stringify(foodItemParse)
    let sampleRequest = `
Respond to me in a javascript code block in a list of json objects, in this format: {name: "apple", calories: 100, quantityG: 100". Make me a 1000 calorie meal. Do not make any variables, I just want the list of json objects, no extra code. Do not provide any explanations or any other kind of text outside of the code block. Use real food items. Include ${stringParse}
`

    // Multiple JSON object query

    const foodItems = await Food.find({
        $or: [{ Food: "Buttermilk" }, { Food: "Custard" }]
    }).toArray()

    const foodItemsParse = foodItems.map((foodItem) => {
        return {
            "name": foodItem.Food,
            "calories": foodItem.Calories,
            "quantityG": foodItem.Grams
        }
    })

    const stringParseArray = JSON.stringify(foodItemsParse)


    let sampleRequestMulti = `
Respond to me in a javascript code block in a list of json objects, in this format: {name: "apple", calories: 100, quantityG: 100". Make me a 1000 calorie meal. Do not make any variables, I just want the list of json objects, no extra code. Do not provide any explanations or any other kind of text outside of the code block. Use real food items. Include [{"name":"Buttermilk","calories":127,"quantityG":246},{"name":"Custard","calories":285,"quantityG":248},{"name":"Custard","calories":265,"quantityG":130}]. Add more food until it is 1000 calories. Stop adding food when it is 1000 calories.
`
}

processRequest()


// Simulate a response from the API
const response = '    ```javascript' +
    '[' +
    '{ "name": "apple", "calories": 100, "quantityG": 100 },' +
    '{ "name": "banana", "calories": 90, "quantityG": 120 },' +
    '{ "name": "orange", "calories": 80, "quantityG": 150 },' +
    '{ "name": "strawberries", "calories": 50, "quantityG": 200 },' +
    '{ "name": "blueberries", "calories": 60, "quantityG": 170 },' +
    '{ "name": "spinach", "calories": 10, "quantityG": 500 },' +
    '{ "name": "chicken breast", "calories": 165, "quantityG": 150 },' +
    '{ "name": "salmon", "calories": 200, "quantityG": 120 },' +
    '{ "name": "brown rice", "calories": 215, "quantityG": 100 },' +
    '{ "name": "quinoa", "calories": 222, "quantityG": 90 },' +
    '{ "name": "avocado", "calories": 160, "quantityG": 80 }' +
    ']' +
    '```' +
    'Here is a list of JSON objects representing food items with their respective name, calories, and quantityG properties. Each object in the list represents a food item and its associated calorie count and quantity in grams.'


// Filter the response to extract just the content inside the code block
const codeBlockRegex = /```javascript([\s\S]+?)```/g;
const matches = response.match(codeBlockRegex);
let codeBlockContent;

if (matches && matches.length > 0) {
    codeBlockContent = matches.map(match => match.replace(/```javascript|```/g, '').trim());
}


// Extract the list of JSON from the string
const jsonArray = JSON.parse(codeBlockContent[0])

// Sample json array
const foodItems = [{
    name: 'Potato',
    calories: 50,
    quantityG: 100
},
{
    name: 'Fries',
    calories: 100,
    quantityG: 100
},
{
    name: 'Croquette',
    calories: 150,
    quantityG: 100
}
]


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

async function mealGenerationQuery() {
    const calorieInput = '500';
    const mealsPrompt =
        "make a meal plans with " +
        calorieInput +
        "calories total and give me the name of the meals, calories, and grams for each meal. Respond to me in a ```javascript code block in a list of json objects in this format:" +
        `{"name": String, "calories": integer, "grams": integer}. Do not make any variables, I just ` + `want the list of json objects and no extra code. Do not provide any explanations or any other kind of text outside of the code block. Use real food items.`;
    const response = await queryChatGPT(mealsPrompt);
    const mealPlan = JSON.parse(response).choices[0].message.content;

    const codeBlockRegex = /```javascript([\s\S]+?)```/g;
    const matches = mealPlan.match(codeBlockRegex);
    let codeBlockContent;

    if (matches && matches.length > 0) {
        codeBlockContent = matches.map(match => match.replace(/```javascript|```/g, '').trim());
    }

    const mealPlanParsed = JSON.parse(codeBlockContent[0])
    const stringify = JSON.stringify(mealPlanParsed)



    // console.log("parsed\n**\n" + mealPlanParsed + "\n**\n");
    console.log("string\n**\n" + stringify + "\n**\n");
    return mealPlanParsed;
}




// Get generated meals
app.get('/generatedMeals', async (req, res) => {
    mealGenerationQuery().then((mealPlan) => {
        let totalCalories = 0;
        console.log(mealPlan)
        mealPlan.forEach((item) => {
            totalCalories += item.calories
        })
        res.render('generatedMeals', {
            foodItems: mealPlan,
            totalCalories: totalCalories
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
    console.log("Testing included food \n***\n" + user)
    res.render('mealFilters', {
        tagsList: foodCategory,
        userInclude: user.includeFood,
        userExclude: user.excludeFood,
        primaryUser: user

    })
})


// Get meal catalog page to include
app.get('/foodCatalogInclude', (req, res) => {
    console.log(req.originalUrl)
    res.render('foodCatalogInclude')
})


// Catalog search function
app.get('/searchFood', (req, res) => {
    MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(client => {
            console.log('Connected to Database');
            db = client.db('NutriFit');
            foodCollection = db.collection('food');

            const searchQuery = req.query.q;
            foodCollection.find({ Food: new RegExp(searchQuery, 'i') }).toArray()
                .then(results => {
                    res.json(results.map(item => ({ name: item.Food, measure: item.Measure, id: item._id })));
                }).catch(error => console.error(error));
        })
        .catch(error => console.error(error));
});


// Select included food
app.post('/selectFoodInclude', (req, res) => {
    MongoClient.connect(uri, { useNewUrlParser: true }).then((client) => {
        const usersCollection = client.db('NutriFit').collection('users');
        const Food = client.db('NutriFit').collection('food');

        const itemId = req.body.item;
        const userId = req.session.USER.id;
        const collection = Food
        let selectedItems = [];

        console.log("Item ID\n***\n" + itemId)

        collection.findOne({ _id: new ObjectId(itemId) })
            .then(item => {
                if (item) {
                    selectedItems.push(item);
                    // Add to users collection
                    console.log(`Updating user: ${userId}`); // Debugging line
                    usersCollection.updateOne(
                        { id: userId },
                        {
                            $addToSet: {
                                includeFood: {
                                    $each: [{
                                        Food: item.Food,
                                        Calories: item.Calories, Grams: item.Grams
                                    }]
                                }
                            }
                        },
                    )
                        .then(result => {
                            console.log(result); // Debugging line
                            usersCollection.findOne({ email: req.session.USER.email }).then((user) => {
                                console.log(user);
                                req.session.USER = user;
                                res.redirect('/mealFilters');
                            })

                        })
                } else {
                    res.status(404).send('Item not found');
                }
            })
    })
});


// Add food tag to include
app.post('/addFoodTagInclude', async (req, res) => {
    MongoClient.connect(uri, { useNewUrlParser: true }).then(async (client) => {
        const usersCollection = client.db('NutriFit').collection('users');
        const Food = client.db('NutriFit').collection('food');
        const foodTag = req.body.foodTag;
        const userId = req.session.USER.id
        console.log(foodTag)
        console.log(req.body.user)

        try {
            const user = await usersCollection.findOne({ id: userId });
            if (!user) {
                return res.status(404).send('User not found');
            }

            if (user.foodTagInclude && user.foodTagInclude.includes(foodTag)) {
                // If the tag is already present, remove it
                await usersCollection.updateOne(
                    { id: userId },
                    { $pull: { foodTagInclude: foodTag } }
                );
            } else {
                // Otherwise, add the tag
                await usersCollection.updateOne(
                    { id: userId },
                    { $addToSet: { foodTagInclude: foodTag } }
                );
            }
            usersCollection.findOne({ email: req.session.USER.email }).then((user) => {
                console.log(user);
                req.session.USER = user;
                res.redirect('/mealFilters');
            })
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    })
});


// Add food tag to exclude
app.post('/addFoodTagExclude', async (req, res) => {
    MongoClient.connect(uri, { useNewUrlParser: true }).then(async (client) => {
        const usersCollection = client.db('NutriFit').collection('users');
        const Food = client.db('NutriFit').collection('food');
        const foodTag = req.body.foodTag;
        const userId = req.session.USER.id
        console.log(foodTag)
        console.log(req.body.user)

        try {
            const user = await usersCollection.findOne({ id: userId });
            if (!user) {
                return res.status(404).send('User not found');
            }

            if (user.foodTagExclude && user.foodTagExclude.includes(foodTag)) {
                // If the tag is already present, remove it
                await usersCollection.updateOne(
                    { id: userId },
                    { $pull: { foodTagExclude: foodTag } }
                );
            } else {
                // Otherwise, add the tag
                await usersCollection.updateOne(
                    { id: userId },
                    { $addToSet: { foodTagExclude: foodTag } }
                );
            }
            usersCollection.findOne({ email: req.session.USER.email }).then((user) => {
                console.log(user);
                req.session.USER = user;
                res.redirect('/mealFilters');
            })
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    })
});


// Get meal catalog page to exclude
app.get('/foodCatalogExclude', (req, res) => {
    console.log(req.originalUrl)
    res.render('foodCatalogExclude', {
        currentURL: req.originalURL
    })
})


// Select excluded food
app.post('/selectFoodExclude', (req, res) => {
    MongoClient.connect(uri, { useNewUrlParser: true }).then((client) => {
        const usersCollection = client.db('NutriFit').collection('users');
        const collection = client.db('NutriFit').collection('food');

        const itemId = req.body.item;
        const userId = req.session.USER.id
        let selectedItems = []

        collection.findOne({ _id: new ObjectId(itemId) })
            .then(item => {
                if (item) {
                    selectedItems.push(item);
                    // Add to users collection
                    console.log(`Updating user: ${userId}`); // Debugging line
                    usersCollection.updateOne(
                        { id: userId },
                        {
                            $addToSet: {
                                excludeFood: {
                                    $each: [{
                                        Food: item.Food,
                                        Calories: item.Calories, Grams: item.Grams
                                    }]
                                }
                            }
                        }
                    )
                        .then(result => {
                            console.log(result); // Debugging line
                            usersCollection.findOne({ email: req.session.USER.email }).then((user) => {
                                console.log(user);
                                req.session.USER = user;
                                return res.redirect('/mealFilters');

                            })
                        })
                } else {
                    res.status(404).send('Item not found');
                }
            })
    })
});


// Remove included food
app.post('/deleteFoodInclude', (req, res) => {
    MongoClient.connect(uri, { useNewUrlParser: true }).then((client) => {
        const usersCollection = client.db('NutriFit').collection('users');
        const collection = client.db('NutriFit').collection('food');

        const foodName = req.body.item;
        console.log("Food name: " + req.body.item)
        console.log("User name: " + req.body.user)
        const userId = req.session.USER.id
        collection.findOne({ Food: foodName })
            .then(item => {
                if (item) {
                    // Remove from users collection
                    usersCollection.updateOne(
                        { id: userId },
                        {
                            $pull: {
                                includeFood: {
                                    Food: item.Food,
                                    Calories: item.Calories, Grams: item.Grams
                                }
                            }
                        }
                    )
                        .then(() => {
                            usersCollection.findOne({ email: req.session.USER.email }).then((user) => {
                                console.log(user);
                                req.session.USER = user;
                                res.redirect('/mealFilters');
                            })
                        })
                } else {
                    res.status(404).send('Item not found');
                }
            })
    })
});



// Remove excluded Food
app.post('/deleteFoodExclude', (req, res) => {
    console.log("hi :)")
    MongoClient.connect(uri, { useNewUrlParser: true }).then((client) => {
        const usersCollection = client.db('NutriFit').collection('users');
        const collection = client.db('NutriFit').collection('food');

        const foodName = req.body.item;
        console.log("Food name: " + req.body.item)
        console.log("User name: " + req.body.user)
        const userId = req.session.USER.id
        collection.findOne({ Food: foodName })
            .then(item => {
                console.log("Item Exclude: " + item.Food)
                if (item) {
                    console.log("Inside if")
                    // Remove from users collection
                    usersCollection.updateOne(
                        { id: userId },
                        {
                            $pull: {
                                excludeFood: {
                                    Food: item.Food,
                                    Calories: item.Calories, Grams: item.Grams
                                }
                            }
                        }
                    )
                        .then((result) => {
                            console.log("Update result: " + JSON.stringify(result))
                            usersCollection.findOne({ email: req.session.USER.email }).then((user) => {
                                console.log(user);
                                req.session.USER = user;
                                res.redirect('/mealFilters');
                            })
                        })
                } else {
                    res.status(404).send('Item not found');
                }
            })
    })
});

// Get favorite meals
app.get('/favoriteMeals', (req, res) => {
    res.render('favouritesMeals')
})


async function workoutGenerationQuery() {
    const durationInput = '15';
    const exercisesPrompt =
        "make a workout with " +
        durationInput +
        "minutes total and give me the name of the exercises, duration (in minutes), and body part for each exercise." +
        `Respond to me in a javascript code block in a list of json objects, in this format:` + '```javascript[{"name": "pushup", "duration": 5, "bodyPart": "lats"},...]```' + `. Make me a ${durationInput} minute workout. Do not make any variables, I just want the list of json objects, no extra code. Do not provide any explanations or any other kind of text outside of the code block. Use real exercises.`
    const response = await queryChatGPT(exercisesPrompt);
    const workout = JSON.parse(response).choices[0].message.content;

    console.log("Prompt Response\n***\n" + response)
    console.log("Prompt message\n***\n" + workout)

    const codeBlockRegex = /```javascript([\s\S]+?)```/g;
    const matches = workout.match(codeBlockRegex);
    let codeBlockContent;

    if (matches && matches.length > 0) {
        codeBlockContent = matches.map(match => match.replace(/```javascript|```/g, '').trim());
    }

    console.log("codeBlockContent\n***\n" + codeBlockContent)
    console.log("codeBlockContent Index\n***\n" + codeBlockContent[0])
    const workoutParsed = JSON.parse(codeBlockContent[0])
    const stringify = JSON.stringify(workoutParsed)

    console.log("parse\n***\n" + workoutParsed + "\n**\n");
    console.log("string\n***\n" + stringify + "\n**\n");
    return workoutParsed;
}


// Get generated exercises
app.get('/generatedExercises', (req, res) => {
    workoutGenerationQuery().then((workout) => {
        let totalDuration = 0;
        console.log(workout)
        workout.forEach((item) => {
            totalDuration += item.duration
        })
        res.render('generateWorkoutRoutine', {
            workout: workout,
            totalDuration: totalDuration
        })
    })
})


// Get exercise filters
app.get('/exerciseFilter', (req, res) => {
    res.render('exerciseFilterPage')
})


// Get exercise catalog Include
app.get('/exerciseCatalogInclude', (req, res) => {
    res.render('exerciseCatalog')
})


// Get exercise catalog Exclude
app.get('/exerciseCatalogExclude', (req, res) => {
    res.render('exerciseCatalog')
})


app.get('/workoutLogs', (req, res) => {
    res.render('workoutLogs')
})


// Connect to port
const port = 3000;
app.listen((port), () => {
    console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
