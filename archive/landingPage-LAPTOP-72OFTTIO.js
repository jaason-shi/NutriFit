require("../utils.js");

require("dotenv").config();
const express = require("express");
const saltRounds = 12;

const port = process.env.PORT || 3020;

const app = express();

const expireTime = 60 * 60 * 1000; //this expires after an hour (minutes * seconds * milliseconds)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

app.use(express.urlencoded({ extended: false }));

//landing page
app.get("/", (req, res) => {
  res.send(`this is the landing page
  <br>
  <div>
    <button onclick="window.location.href='/generateMealPlan'">Generate Meal Plan</button>
    </div>
    <div>
    <button onclick="window.location.href='/generateWorkoutRoutine'">Generate Workout Routine</button>
    </div>
    <div>
    <button onclick="window.location.href='/favourites'">Favourites</button>
    </div>
    <div>
    <button onclick="window.location.href='/quickAdd'">Quick Add</button>
    </div>

    <div>
      <button onclick="window.location.href='/userForm.html'">User Form</button>
    </div>`);
});

app.listen(port, () => {
  console.log("listening on port " + port);
});
