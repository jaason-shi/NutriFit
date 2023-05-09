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
  const collection = db.collection('food');
  collection.findOne({ _id: new ObjectId(itemId) })
    .then(item => {
      if (item) {
        selectedItems.push(item);
        res.redirect('/selectedFood');
      } else {
        res.status(404).send('Item not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
});

app.get('/selectedFood', (req, res) => {
  res.render('selectedFood.ejs', { food: selectedItems });
});

app.post('/removeFood', (req, res) => {
  const itemId = req.body.item;
  const index = selectedItems.findIndex(item => item._id.equals(new ObjectId(itemId)));
  if (index !== -1) {
    selectedItems.splice(index, 1);
  }
  res.redirect('/selectedFood');
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
  const collection = db.collection('exercise');
  collection.findOne({ _id: new ObjectId(itemId) })
    .then(item => {
      if (item) {
        selectedExerciseItems.push(item);
        res.redirect('/selectedExercise');
      } else {
        res.status(404).send('Exercise not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
});

app.get('/selectedExercise', (req, res) => {
  res.render('selectedExercise.ejs', { exercise: selectedExerciseItems });
});

app.post('/removeExercise', (req, res) => {
  const itemId = req.body.item;
  const index = selectedExerciseItems.findIndex(item => item._id.equals(new ObjectId(itemId)));
  if (index !== -1) {
    selectedExerciseItems.splice(index, 1);
  }
  res.redirect('/selectedExercise');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});