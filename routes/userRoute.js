/**
 * Router to handle requests to endpoints related to user creation and authentication.
 */

// Set up dependencies
const express = require('express');
const userRouter = express.Router();
const Joi = require('joi');
const bcrypt = require('bcrypt');
const saltRounds = 10
const User = require('../models/userModel')

/**
 * Set up form field validation to protect against DB query attacks.
 * The '$ : {} ()' characters is used to get information from mongoDB, so it is not allowed. e.g. username: {$exists: true}}
 */
const basicStringSchema = Joi.string().regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();
const emailSchema = Joi.string().email({ minDomainSegments: 2 }).regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();
const passwordSchema = Joi.string().regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/).required();


/**
 * Renders the "login" view in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/login', (req, res) => {
    res.render('user/login')
})


/**
 * Renders the "signup" view in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/signup', (req, res) => {
    res.render('user/signup')
})


/**
 * Renders the "getEmail" page in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/getEmail', (req, res) => {
    res.render('user/getEmail')
})


/**
 * Renders the "checkSecurity" view with the user in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/checkSecurity', (req, res) => {
    res.render('user/checkSecurity', {
        primaryUser: req.session.USER
    })
})


/**
 * Renders the "changePassword" view in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/changePassword', (req, res) => {
    res.render('user/changePassword.ejs')
})


/**
 * Renders the "changePasswordSuccess" view in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/changePasswordSuccess', (req, res) => {
    res.render('user/changePasswordSuccess')
})


/**
 * Renders the "invalidFormData" view with the previous page and the invalidity reason in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/invalidFormData', (req, res) => {
    res.render('user/invalidFormData', {
        referer: req.headers.referer,
        invalidField: req.session.INVALID_FIELD
    })
})


/**
 * Renders the "noMatchFound" view with the previous page and the invalidity reason in the response.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.get('/noMatchFound', (req, res) => {
    res.render('user/noMatchFound', {
        referer: req.headers.referer,
        invalidField: req.session.INVALID_FIELD
    })
})


/**
 * Creates a new user using user-provided information.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {string} id - the ID of the new user
 * @param {string} email - the email of the new user
 * @param {string} password - the password of the new user
 * @param {string} answer - the answer of the new user
 */
async function createNewUser(req, id, email, password, answer) {
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
    })
}


/**
 * Checks if the fields already exist.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {string} id - the ID to check if it exists
 * @param {string} email - the email to check if it exists
 * @returns true if any matching emails or ids are found
 */
async function checkAlreadyExists(req, id, email) {
    // Check if the fields already exist in the database
    const matchID = await User.findOne({ id: id })
    const matchEmail = await User.findOne({ email: email })

    if (matchID != undefined) {
        req.session.MATCH = 'id';
        return true
    } else if (matchEmail != undefined) {
        req.session.MATCH = 'email';
        return true
    } else {
        return false
    }
}


/**
 * Validates the user provided values.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {*} id - the ID to validate
 * @param {*} email - the email to validate
 * @param {*} password - the password to validate
 * @param {*} answer - the answer to validate
 * @returns 
 */
function validateValues(req, id, email, password, answer) {
    if (basicStringSchema.validate(id).error != null) {
        req.session.INVALID_FIELD = 'ID'
        return true
    } else if (emailSchema.validate(email).error != null) {
        req.session.INVALID_FIELD = 'Email'
        return true
    } else if (passwordSchema.validate(password).error != null) {
        req.session.INVALID_FIELD = 'Password'
        return true
    } else if (basicStringSchema.validate(answer).error != null) {
        req.session.INVALID_FIELD = 'Answer'
        return true
    }
}


/**
 * Handles the POST request to create a new user by signing up.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.post('/signup', async (req, res) => {
    const id = req.body.id;
    const email = req.body.email;
    let password = req.body.password;
    let answer = req.body.answer;

    if (validateValues(req, id, email, password, answer)) {
        res.redirect('./invalidFormData')
    } else {
        password = await bcrypt.hash(password, saltRounds);
        answer = await bcrypt.hash(answer, saltRounds)

        if (await checkAlreadyExists(req, id, email)) {
            return res.redirect('/alreadyExists')
        }

        await createNewUser(req, id, email, password, answer)
        res.redirect('/members')
    }
});


/**
 * Checks if the password entered matches the user's password.
 * 
 * @param {string} password the password to check for a match
 * @param {Object} user - an object representing the user to check
 * @param {Express.Request} req - the request object representing the received request
 * @returns true if the password entered matches the user's password
 */
async function isPasswordValid(password, user, req) {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
        req.session.AUTH = true;
        req.session.ROLE = user.role;
        req.session.USER = user;
        return true
    } else {
        req.session.AUTH = false;
        req.session.FAIL_FORM = true;
        req.session.INVALID_FIELD = 'Email and Password';
        return false
    }
}


/**
 * Handles the post request to login a user.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const emailValidationResult = basicStringSchema.validate(email);
    const passwordValidationResult = passwordSchema.validate(password);

    let user = await User.findOne({ $or: [{ email: email }, { id: email }] });

    if (emailValidationResult.error != null) {
        req.session.INVALID_FIELD = 'Email or ID';
        return res.redirect('./invalidFormData');
    } else if (passwordValidationResult.error != null) {
        req.session.INVALID_FIELD = 'Password';
        return res.redirect('./invalidFormData');
    } else if (!user) {
        req.session.AUTH = false;
        req.session.FAIL_FORM = true;
        req.session.INVALID_FIELD = 'Email and Password';
        return res.redirect('./noMatchFound');
    } else {

        if (await isPasswordValid(password, user, req)) {
            return res.redirect('/members');
        } else {
            return res.redirect('./noMatchFound');
        }
    }
});


/**
 * Handles the POST request to find which user is changing their password.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.post('/getEmail', async (req, res) => {
    const email = req.body.email;
    if (emailSchema.validate(email).error != null) {
        req.session.INVALID_FIELD = 'Email'
        return res.redirect('./invalidFormData')
    }
    let user = await User.findOne({ email: email })
    if (!user) {
        req.session.INVALID_FIELD = 'Email'
        return res.redirect('./noMatchFound')
    }
    User.findOne({ email: email }).then((user) => {
        req.session.USER = user;
        return res.redirect('./checkSecurity')
    })

})


/**
 * Handles the POST request to check if the passed security answer is correct.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.post('/checkSecurity', async (req, res) => {
    let answer = req.body.answer;
    answer = await bcrypt.hash(answer, saltRounds)
    if (bcrypt.compare(answer, req.session.USER.answer)) {
        return res.redirect('./changePassword')
    } else {
        return res.redirect('./incorrectAnswer')
    }
})


/**
 * Handles the POST request to change a user's password.
 * 
 * @param {Express.Request} req - the request object representing the received request
 * @param {Express.Response} res - the response object representing the server response
 */
userRouter.post('/changePassword', async (req, res) => {
    let password = req.body.password
    if (passwordSchema.validate(password).error != null) {
        req.session.INVALID_FIELD = 'Password'
        return res.redirect('./invalidFormData')
    }
    password = await bcrypt.hash(req.body.password, saltRounds);
    await User.updateOne({ email: req.session.USER.email }, { $set: { password: password } })
    delete req.session.USER
    return res.redirect('./changePasswordSuccess')
})

// Export userRouter
module.exports = userRouter