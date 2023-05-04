const express = require('express');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const Schema = mongoose.Schema;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const uri = process.env.ETranATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true });

// Input Model
const inputSchema = new Schema({
  input: { type: String, required: true },
});

InputTest = mongoose.model('InputTest', inputSchema);

// Basic landing page 
app.get('/', (req, res) => {
  InputTest.find()
    .then(inputs => {
      res.send(`
        <html>
          <head>
            <title>Inputs</title>
          </head>
          <body>
            <h1>Inputs:</h1>
            <ul>
              ${inputs.map(input => `<li>${input.input}</li>`).join('')}
            </ul>
            <form style="margin-bottom:2px" action="/postInput" method="post">
              <input style="margin-bottom:2px" type="input" id="input" name="input" placeholder="input"><br>
              <input type="submit" id="submit" value="Post Data">
            </form>
          </body>
        </html>
      `);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal server error');
    });
});

app.post('/postInput', (req, res) => {
  const input = req.body.input;
  const newInput = new InputTest({
    input
  });
  newInput.save().then(() => {
    res.redirect('/');
  });
});

// Connect to port
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}; http://localhost:${port}`);
});