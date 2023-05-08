const express = require('express');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const Schema = mongoose.Schema;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'))

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true });

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
