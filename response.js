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
const exerciseCategory = [
  { name: 'back' },
  { name: 'cardio' },
  { name: 'chest' },
  { name: 'lower arms' },
  { name: 'lower legs' },
  { name: 'shoulders' },
  { name: 'upper arms' },
  { name: 'upper legs' },
  { name: 'neck' },
  { name: 'waist' },
];

app.use((req, res, next) => {
  app.locals.foodCategory = foodCategory;
  app.locals.exerciseCategory = exerciseCategory;
  next();
});


app.get('/', (req, res) => {
  res.render('home.ejs');
});

let selectedItems = [];

app.get('/food', (req, res) => {
  res.render('foodFilter.ejs');
});

app.get('/foodEx', (req, res) => {
  res.render('foodFilterEx.ejs');
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
            res.redirect('/selectedFood');
          })
      } else {
        res.status(404).send('Item not found');
      }
    })
});

app.post('/excludeFood', (req, res) => {
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
            res.redirect('/selectedFood');
          })
      } else {
        res.status(404).send('Item not found');
      }
    })
});

app.post('/addFoodTag', async (req, res) => {
  const foodTag = req.body.foodTag;
  const userId = 'SeanGuy'; // Assuming you send user ID with request

  try {
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.foodTag && user.foodTag.includes(foodTag)) {
      // If the tag is already present, remove it
      await usersCollection.updateOne(
        { id: userId },
        { $pull: { foodTag: foodTag } }
      );
    } else {
      // Otherwise, add the tag
      await usersCollection.updateOne(
        { id: userId },
        { $addToSet: { foodTag: foodTag } }
      );
    }

    res.redirect('/selectedFood');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/addFoodTagEx', async (req, res) => {
  const foodTagEx = req.body.foodTagEx;
  const userId = 'SeanGuy'; // Assuming you send user ID with request

  try {
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.excludeFoodTag && user.excludeFoodTag.includes(foodTagEx)) {
      // If the tag is already present, remove it
      await usersCollection.updateOne(
        { id: userId },
        { $pull: { excludeFoodTag: foodTagEx } }
      );
    } else {
      // Otherwise, add the tag
      await usersCollection.updateOne(
        { id: userId },
        { $addToSet: { excludeFoodTag: foodTagEx } }
      );
    }

    res.redirect('/selectedFood');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});


app.get('/selectedFood', (req, res) => {
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  usersCollection.findOne({ id: userId })
    .then(user => {
      if (user) {
        res.render('selectedFood.ejs', {
          food: user.includeFood,
          userId: userId,
          foodTag: user.foodTag,
          excludeFood: user.excludeFood,
          foodTagEx: user.excludeFoodTag
        });
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

app.post('/removeFoodEx', (req, res) => {
  const foodName = req.body.item;
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  const collection = db.collection('food');
  collection.findOne({ Food: foodName })
    .then(item => {
      if (item) {
        // Remove from users collection
        usersCollection.updateOne(
          { id: userId },
          { $pull: { excludeFood: item.Food } },
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

app.get('/exerciseEx', (req, res) => {
  res.render('exerciseFilterEx.ejs');
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

app.post('/addExerciseTag', (req, res) => {
  const exerciseTag = req.body.exerciseTag;
  const userId = 'SeanGuy';
  usersCollection.findOne({ id: userId })
    .then(user => {
      if (user) {
        if (user.exerciseTag && user.exerciseTag.includes(exerciseTag)) {
          // If the tag already exists, remove it
          usersCollection.updateOne(
            { id: userId },
            { $pull: { exerciseTag: exerciseTag } },
          )
            .then(() => {
              res.redirect('/selectedExercise');
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error');
            });
        } else {
          // If the tag doesn't exist, add it
          usersCollection.updateOne(
            { id: userId },
            { $addToSet: { exerciseTag: exerciseTag } },
          )
            .then(() => {
              res.redirect('/selectedExercise');
            })
            .catch(error => {
              console.error(error);
              res.status(500).send('Internal server error');
            });
        }
      } else {
        res.status(404).send('User not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal server error');
    });
});

app.post('/addExerciseTagEx', async (req, res) => {
  const exerciseTagEx = req.body.exerciseTagEx; // Corrected variable name
  const userId = 'SeanGuy'; // Assuming you send user ID with request

  try {
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.excludeExerciseTag && user.excludeExerciseTag.includes(exerciseTagEx)) {
      // If the tag is already present, remove it
      await usersCollection.updateOne(
        { id: userId },
        { $pull: { excludeExerciseTag: exerciseTagEx } }
      );
    } else {
      // Otherwise, add the tag
      await usersCollection.updateOne(
        { id: userId },
        { $addToSet: { excludeExerciseTag: exerciseTagEx } }
      );
    }

    res.redirect('/selectedExercise');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.get('/selectedExercise', (req, res) => {
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  usersCollection.findOne({ id: userId })
    .then(user => {
      if (user) {
        const selectedExerciseNames = user.includeExercise; // Get the selected exercise names from the user
        const excludeExerciseNames = user.excludeExercise; // Get the excluded exercise names from the user
        const exercisePromises = [
          exerciseCollection.find({ name: { $in: selectedExerciseNames } }).toArray(), // Find the included exercises with matching names
          exerciseCollection.find({ name: { $in: excludeExerciseNames } }).toArray() // Find the excluded exercises with matching names
        ];
        Promise.all(exercisePromises)
          .then(([exercises, excludeExercises]) => {
            res.render('selectedExercise.ejs', { exercise: exercises, excludeExercise: excludeExercises, userId: userId, exerciseTag: user.exerciseTag, exerciseTagEx: user.excludeExerciseTag });
          })
      } else {
        res.status(404).send('User not found');
      }
    })
});

app.post('/excludeExercise', (req, res) => {
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
          { $addToSet: { excludeExercise: item.name } },
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

app.post('/removeExerciseEx', (req, res) => {
  const exerciseName = req.body.item;
  const userId = 'SeanGuy'; // Assuming you send user ID with request
  usersCollection.updateOne(
    { id: userId },
    { $pull: { excludeExercise: exerciseName } }
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