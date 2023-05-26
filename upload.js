/**
 * This is a script to upload a csv to mongodb.
 */

const csvParser = require('csv-parser');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config();

const uri = process.env.ATLAS_URI;
const dbName = 'NutriFit'; // Name of your database
const collectionName = 'food'; // Name of the collection

const results = [];

// Read from this stream aka your CSV
fs.createReadStream('csvName.csv')
    // Write to this stream
    .pipe(csvParser()) // Parser converts data to JSON object
    .on('data', (data) => { // When a piece of data is finished converting, add to the results array
        results.push(data);
    })
    .on('end', () => { // When all of the data has been parsed, establish a connection to mongodb 
        MongoClient.connect(uri, { useNewUrlParser: true })
            .then((client) => {
                // Connect to the specific database and collection
                const collection = client.db(dbName).collection(collectionName);
                // Insert the results array content to the collection you are connected to
                return collection.insertMany(results);
            })
            .then(() => {
                console.log('Data inserted successfully');
            })
            .catch((error) => {
                console.error('Error inserting data:', error);
            });
    });
