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
  })
  .catch(error => console.error(error));

let selectedItems = [];

app.get('/', (req, res) => {
  res.render('filter.ejs');
});

app.get('/search', (req, res) => {
  const searchQuery = req.query.q;
  foodCollection.find({ Food: new RegExp(searchQuery, 'i') }).toArray()
    .then(results => {
      res.json(results.map(item => ({ name: item.Food, measure: item.Measure, id: item._id })));
    })
    .catch(error => console.error(error));
});

app.get('/selected', (req, res) => {
  res.render('selected.ejs', { food: selectedItems });
});

app.post('/select', (req, res) => {
  const itemId = req.body.item;
  const collection = db.collection('food');
  collection.findOne({ _id: new ObjectId(itemId) })
    .then(item => {
      if (item) {
        selectedItems.push(item);
        res.redirect('/selected');
      } else {
        res.status(404).send('Item not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});