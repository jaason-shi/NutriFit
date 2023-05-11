const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const app = express();
const port = 3000;

require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

let db;
const uri = process.env.ATLAS_URI;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database');
    db = client.db('NutriFit');
    foodCollection = db.collection('food');
    exerciseCollection = db.collection('exercise');
    usersCollection = db.collection('users');
  })
  .catch(error => console.error(error));

let selectedItems = [];

app.get('/food', (req, res) => {
  res.render('foodFilter.ejs');
});

app.get('/searchFood', (req, res) => {
  const searchQuery = req.query.q;
  foodCollection.find({ Food: new RegExp(searchQuery, 'i') }).toArray()
    .then(results => {
      res.json(results.map(item => ({ name: item.Food, measure: item.Measure, id: item._id })));
    })
    .catch(error => console.error(error));
});

app.post('/selectFood', (req, res) => {
  const itemId = req.body.item;
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  const collection = db.collection('food');
  collection.findOne({ _id: new ObjectId(itemId) })
    .then(item => {
      if (item) {
        selectedItems.push(item);
        // Add to users collection
        console.log(`Updating user: ${userId}`); // Debugging line
        usersCollection.updateOne(
          { id: userId },
          { $addToSet: { includeFood: item.Food } },
        )
        .then(result => {
          console.log(result); // Debugging line
          res.redirect('/selectedFood');
        })
      } else {
        res.status(404).send('Item not found');
      }
    })
});

app.get('/selectedFood', (req, res) => {
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  usersCollection.findOne({ id: userId })
    .then(user => {
      if (user) {
        res.render('selectedFood.ejs', { food: user.includeFood, userId: userId });
      } else {
        res.status(404).send('User not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
});

app.post('/removeFood', (req, res) => {
  const foodName = req.body.item;
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  const collection = db.collection('food');
  collection.findOne({ Food: foodName })
    .then(item => {
      if (item) {
        // Remove from users collection
        usersCollection.updateOne(
          { id: userId },
          { $pull: { includeFood: item.Food } },
        )
        .then(() => {
          res.redirect('/selectedFood');
        })
      } else {
        res.status(404).send('Item not found');
      }
    })
});


let selectedExerciseItems = [];

app.get('/exercise', (req, res) => {
  res.render('exerciseFilter.ejs');
});

app.get('/searchExercise', (req, res) => {
  const searchQuery = req.query.q;
  exerciseCollection.find({ name: new RegExp(searchQuery, 'i') }).toArray()
    .then(results => {
      res.json(results.map(item => ({ name: item.name, bodyPart: item.bodyPart, equipment: item.equipment, id: item._id })));
    })
    .catch(error => console.error(error));
});


app.post('/selectExercise', (req, res) => {
  const itemId = req.body.item;
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  const collection = db.collection('exercise');
  collection.findOne({ _id: new ObjectId(itemId) })
    .then(item => {
      if (item) {
        selectedExerciseItems.push(item);
        // Add to users collection
        console.log(`Updating user: ${userId}`); // Debugging line
        usersCollection.updateOne(
          { id: userId },
          { $addToSet: { includeExercise: item.name } },
        )
        .then(result => {
          console.log(result); // Debugging line
          res.redirect('/selectedExercise');
        })
      } else {
        res.status(404).send('Exercise not found');
      }
    })
});

app.get('/selectedExercise', (req, res) => {
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  usersCollection.findOne({ id: userId })
    .then(user => {
      if (user) {
        const selectedExerciseNames = user.includeExercise; // Get the selected exercise names from the user
        exerciseCollection.find({ name: { $in: selectedExerciseNames } }).toArray() // Find the exercises with matching names
          .then(exercises => {
            res.render('selectedExercise.ejs', { exercise: exercises, userId: userId });
          })
      } else {
        res.status(404).send('User not found');
      }
    })
});

app.post('/removeExercise', (req, res) => {
  const exerciseName = req.body.item;
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  usersCollection.updateOne(
    { id: userId },
    { $pull: { includeExercise: exerciseName } }
  )
    .then(() => {
      res.redirect('/selectedExercise');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});