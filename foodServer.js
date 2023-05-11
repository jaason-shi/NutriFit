const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ejs = require("ejs");
const { string, number } = require("joi");
require("dotenv").config();

app.set("view engine", "ejs");

const foodSchema = {
  Food: String,
  Measure: Number,
  Grams: Number,
  Calories: Number,
  Protein: String,
  Fat: Number,
  Sat: String,
  Fiber: Number,
  Carbs: Number,
};

const Food = mongoose.model("Food", foodSchema);

app.get("/", (req, res) => {
  Food.find({}, function (err, foods) {
    res.render("foodPageTest", {
      foodsList: foods,
    });
  });
});

//calorie input for prompt
const calorieInput = req.query.calorieInput;

// route to generate meals with queryChatGPT using calorie filter
const mealsPrompt =
  "make a meal plans with " +
  calorieInput +
  "calories and give me the list of meals, the ingredients, and the calories for each meal.";

// function to query chatgpt api
async function queryChatGPT(mealsPrompt) {
  const request = require("request");

  const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

  const options = {
    url: OPENAI_API_ENDPOINT,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Organization": OPENAI_ORG_KEY,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: mealsPrompt }],
      temperature: 0.7,
    }),
  };

  return new Promise((resolve, reject) => {
    request.post(options, (error, response, body) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        console.log(body);
        resolve(body);
      }
    });
  });
}

// route to generate meal plan with queryChatGPT
app.get("/mealFilter", async (req, res) => {
  try {
    const calorieInput = req.query.calorieInput;
    const mealsPrompt =
      "make a meal plans with " +
      calorieInput +
      "calories and give me the name of the meals, calories, and grams for each meal. Respond to me in a javascript code block in a list of json objects in this format:" +
      "{name: String, calories: integer, grams: integer}. Do not make any variables, I just want the list of json objects and no extra code. Do not provide any explanations or any other kind of text outside of the code block. Use real food items.";
    const response = await queryChatGPT(mealsPrompt);
    const mealPlan = JSON.parse(response).choices[0].message.content;
    res.render("generatedMeals", { mealPlan });
    console.log(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
