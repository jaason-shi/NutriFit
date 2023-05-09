const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const ejs = require("ejs");

require("dotenv").config();

const app = express();
const Schema = mongoose.Schema;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

// Set up MongoDB
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true });
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB Atlas.");
});

var sessionStore = MongoStore.create({
  mongoUrl: uri,
  cypto: {
    secret: process.env.SESSION_KEY,
  },
});

// Set up sessions
app.use(
  session({
    secret: process.env.SESSION_KEY,
    store: sessionStore,
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// The '$ : {} ()' characters is used to get information from mongoDB, so it is not allowed. e.g. username: {$exists: true}}
const idSchema = Joi.string()
  .regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/)
  .required();
const emailSchema = Joi.string()
  .email({ minDomainSegments: 2 })
  .regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/)
  .required();
const passwordSchema = Joi.string()
  .regex(/^[a-zA-Z0-9!@#%^&*_+=[\]\\|;'",.<>/?~`-]+$/)
  .required();

// Input Model
const inputSchema = new Schema({
  input: { type: String, required: true },
});

// User Model
const userSchema = new Schema({
  id: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

InputTest = mongoose.model("InputTest", inputSchema);

// Basic landing page
app.get("/", (req, res) => {
  res.send(`Hello world
    <form style="margin-bottom:2px" action="/postInput" method="post">
        <input style="margin-bottom:2px" type="input" id="input" name="input" placeholder="input"><br>
        <input type="submit" id="submit" value="Post Data">
    </form>
                    `);
});

// Get login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Get signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Post signup page data
app.post("/signup", async (req, res) => {
  const id = req.body.id;
  const email = req.body.email;
  let password = req.body.password;

  if (idSchema.validate(id).error != null) {
    req.session.INVALID_FIELD = "ID";
    res.redirect("/invalidFormData");
  } else if (emailSchema.validate(email).error != null) {
    req.session.INVALID_FIELD = "Email";
    res.redirect("/invalidFormData");
  } else if (passwordSchema.validate(password).error != null) {
    req.session.INVALID_FIELD = "Password";
    res.redirect("/invalidFormData");
  } else {
    password = await bcrypt.hash(req.body.password, saltRounds);

    // Check if the fields already exist in the database
    const matchID = await User.findOne({ id: id });
    const matchEmail = await User.findOne({ email: email });

    if (matchID != undefined) {
      req.session.MATCH = "name";
      return res.redirect("/alreadyExists");
    }

    if (matchEmail != undefined) {
      req.session.MATCH = "email";
      return res.redirect("/alreadyExists");
    }

    const newUser = new User({
      id,
      email,
      password,
    });

    newUser.save().then(async () => {
      req.session.USER = await User.findOne({ id: req.body.id });
      req.session.AUTH = true;
      req.session.ROLE = "User";
      res.redirect("/members");
    });
  }
});

// Get login page
app.get("/login", (req, res) => {
  res.render("login", { primaryUser: req.session.USER });
});

// Post login page
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const emailValidationResult = idSchema.validate(email);
  const passwordValidationResult = passwordSchema.validate(password);

  User.find({ $or: [{ email: email }, { id: email }] })
    .exec()
    .then(async (users) => {
      if (emailValidationResult.error != null) {
        req.session.INVALID_FIELD = "Email or ID";
        res.redirect("/invalidFormData");
      } else if (passwordValidationResult.error != null) {
        req.session.INVALID_FIELD = "Password";
        res.redirect("/invalidFormData");
      } else {
        if (users.length === 0) {
          req.session.AUTH = false;
          req.session.FAIL_FORM = true;
        } else {
          if (await bcrypt.compare(password, users[0].password)) {
            req.session.AUTH = true;
            req.session.ROLE = users[0].role;
            req.session.USER = users[0];
          } else {
            req.session.AUTH = false;
            req.session.FAIL_FORM = true;
          }
        }
        res.redirect("/members");
      }
    });
});

// Get invalid form data page
app.get("/invalidFormData", (req, res) => {
  res.render("invalidFormData", {
    invalidField: req.session.INVALID_FIELD,
    referer: req.headers.referer,
  });
});

// Middleware: Checks if the user is authenticated
const checkAuth = (req, res, next) => {
  if (!req.session.AUTH) {
    if (req.session.FAIL_FORM) {
      delete req.session.FAIL_FORM;
      return res.redirect("/authFail");
    } else {
      delete req.session.FAIL_FORM;
      return res.redirect("/login");
    }
  }
  next();
};

// Post logout page
app.post("/logOut", (req, res) => {
  req.session.destroy();
  res.redirect("./");
});

// Get authentication failure page
app.get("/authFail", (req, res) => {
  res.render("authFailRoute", {
    primaryUser: req.session.USER,
    referer: req.headers.referer,
  });
});

// Get members page
app.get("/members", checkAuth, (req, res) => {
  res.render("members", {
    primaryUser: req.session.USER,
  });
});

app.post("/postInput", (req, res) => {
  const input = req.body.input;
  const newInput = new InputTest({
    input,
  });
  newInput.save().then(() => {
    res.redirect("/");
  });
});

// Connect to port
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}; http://localhost:${port}`);
});
