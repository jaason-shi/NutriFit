/**
 * User route handler
 */

const express = require('express');
const userRouter = express.Router();

// Get login page
userRouter.get('/login', (req, res) => {
    res.render('user/login')
})

// Get signup page
userRouter.get('/signup', (req, res) => {
    res.render('user/signup')
})

// Get email page for changing passwords
userRouter.get('/getEmail', (req, res) => {
    res.render('user/getEmail')
})

// Get answer security question page
userRouter.get('/checkSecurity', (req, res) => {
    res.render('user/checkSecurity', {
        primaryUser: req.session.USER
    })
})

// Get change password page
userRouter.get('/changePassword', (req, res) => {
    res.render('user/changePassword.ejs')
})

// Get change password success page
userRouter.get('/changePasswordSuccess', (req, res) => {
    res.render('user/changePasswordSuccess')
})

// Post signup page data
userRouter.post('/signup', async (req, res) => {
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

// Post login page
userRouter.post(('/login'), async (req, res) => {
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

// Post email page data for changing passwords
userRouter.post('/getEmail', async (req, res) => {
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

// Post answer security question page
userRouter.post('/checkSecurity', async (req, res) => {
    let answer = req.body.answer;
    answer = await bcrypt.hash(answer, saltRounds)
    if (bcrypt.compare(answer, req.session.USER.answer)) {
        return res.redirect('/changePassword')
    } else {
        return res.redirect('/incorrectAnswer')
    }
})

// Post change password page
userRouter.post('/changePassword', async (req, res) => {
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


module.exports = userRouter