const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const saltRounds = 10
const ejs = require('ejs');

require('dotenv').config();

const app = express();
const Schema = mongoose.Schema;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'))


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


// The '$ : {} ()' characters is used to get information from mongoDB, so it is not allowed. e.g. username: {$exists: true}}
const nameSchema = Joi.string().regex(/^[a-zA-Z]+$/).required();
const emailSchema = Joi.string().email({ minDomainSegments: 2 }).regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();
const passwordSchema = Joi.string().regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();


// Input Model
const inputSchema = new Schema({
    input: { type: String, required: true },
});

// User Model
const userSchema = new Schema({
    ID: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

InputTest = mongoose.model('InputTest', inputSchema);

// Basic landing page 
app.get('/', (req, res) => {
    res.send(`Hello world
    <form style="margin-bottom:2px" action="/postInput" method="post">
        <input style="margin-bottom:2px" type="input" id="input" name="input" placeholder="input"><br>
        <input type="submit" id="submit" value="Post Data">
    </form>
                    `)
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
    const name = req.body.name;
    const email = req.body.email;
    let password = req.body.password;

    if (nameSchema.validate(name).error != null) {
        req.session.INVALID_FIELD = 'Name'
        res.redirect('/invalidFormData')
    } else if (emailSchema.validate(email).error != null) {
        req.session.INVALID_FIELD = 'Email'
        res.redirect('/invalidFormData')
    } else if (passwordSchema.validate(password).error != null) {
        req.session.INVALID_FIELD = 'Password'
        res.redirect('/invalidFormData')
    } else {
        password = await bcrypt.hash(req.body.password, saltRounds);

        // Check if the fields already exist in the database
        const matchName = await User.findOne({ name: name })
        const matchEmail = await User.findOne({ email: email })

        if (matchName != undefined) {
            req.session.MATCH = 'name';
            return res.redirect('/alreadyExists')
        }

        if (matchEmail != undefined) {
            req.session.MATCH = 'email';
            return res.redirect('/alreadyExists')
        }

        const newUser = new User({
            name,
            email,
            password,
            role: 'User'
        })

        newUser.save().then(async () => {
            req.session.USER = await User.findOne({ name: req.body.name })
            req.session.AUTH = true;
            req.session.ROLE = 'User'
            res.redirect('/success')
        })
    }
});

// Get invalid form data page
app.get('/invalidFormData', (req, res) => {
    res.render('invalidFormDataRoute', {
        invalidField: req.session.INVALID_FIELD,
        referer: req.headers.referer
    })
})


// Get success
app.get('/success', (req, res) => {
    res.send('Success')
})

app.post('/postInput', (req, res) => {
    const input = req.body.input;
    const newInput = new InputTest({
        input
    });
    newInput.save().then(() => {
        res.redirect('/');
    })
})

// Connect to port
const port = 3000;
app.listen((port), () => {
    console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
