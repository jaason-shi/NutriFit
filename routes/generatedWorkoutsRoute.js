const express = require('express');
const generatedWorkoutsRouter = express.Router();
const User = require('../models/userModel')
const Exercise = require('../models/exerciseModel')
const { ObjectId } = require('mongodb');
// Workout model
const Workout = require("../models/workoutModel");
// FavoriteWorkout model
const FavoriteWorkout = require("../models/favWorkoutModel");

// Available exercise tags
const exerciseCategory = [
    { name: "back" },
    { name: "cardio" },
    { name: "chest" },
    { name: "lower arms" },
    { name: "lower legs" },
    { name: "shoulders" },
    { name: "upper arms" },
    { name: "upper legs" },
    { name: "neck" },
    { name: "waist" },
];


// Sends an API post request to the GPT 3.5 endpoint
async function queryChatGPT(prompt) {
    const request = require("request");

    const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

    const options = {
        url: OPENAI_API_ENDPOINT,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GPT_API_KEY}`,
            "OpenAI-Organization": process.env.GPT_ORG_ID,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        }),
    };

    return new Promise((resolve, reject) => {
        request.post(options, (error, response, body) => {
            if (error) {
                console.error(error);
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}


// Queries the GPT 3.5 API for a workout
async function workoutGenerationQuery(duration, user) {
    let includedExercise = JSON.stringify(user.includeExercise);
    let excludedExercise = JSON.stringify(user.excludeExercise);
    let includedTags = user.exerciseTagInclude;
    let excludedTags = user.exerciseTagExclude;

    if (includedExercise == undefined) {
        includedExercise = [];
    }
    if (excludedExercise == undefined) {
        excludedExercise = [];
    }
    if (includedTags == undefined) {
        includedTags = [];
    }
    if (excludedTags == undefined) {
        excludedTags = [];
    }

    const exercisesPrompt =
        `Respond to me in this format:` +
        ' ```javascript[{ "name": String, "duration": int, "bodyPart": String}, ...]```' +
        `. Make me a sample ${duration} minute workout. The unit of the duration field is in minutes. Do not provide any extra text outside of` +
        ' ```javascript[{ "name": String, "duration": int, "bodyPart": String }, ...]```.' +
        `These json objects must be included: ${includedExercise}. Give them a duration. Include these categories: ${includedTags}. Exclude these exercises: ${excludedExercise}. Exclude these categories: ${excludedTags}. Remove all white space. Do not go over the duration of the workout.`;

    console.log(`Initial Prompt: ${exercisesPrompt}\n\n`);

    const response = await queryChatGPT(exercisesPrompt);
    const workout = JSON.parse(response).choices[0].message.content;

    console.log(`Response we get: ${workout}\n\n`);

    const codeBlockRegex = /```javascript([\s\S]+?)```/g;

    let matches = workout.match(codeBlockRegex);
    console.log(`\n\nAfter regex filter: ${matches}\n\n`);
    if (matches == null) {
        matches = workout.match(/\[[^\[\]]*\]/);
        console.log(`\n\nAfter regex filter Second: ${matches}\n\n`);
    }

    if (matches == null) {
        return undefined;
    }

    let codeBlockContent;

    if (matches && matches.length > 0) {
        codeBlockContent = matches.map((match) =>
            match.replace(/```javascript|```/g, "").trim()
        );
    }

    const workoutParsed = JSON.parse(codeBlockContent[0]);

    console.log("Final Product\n");
    console.log(workoutParsed);

    return workoutParsed;
}


// Get generated workouts
generatedWorkoutsRouter.get("/", async (req, res) => {
    let duration;
    let user = req.session.USER;
    if (req.query.duration != undefined) {
        duration = req.query.duration;
    } else {
        duration = 10;
    }
    let workout = await workoutGenerationQuery(duration, user);
    // variable to store the workout in the session
    req.session.WORKOUT = workout;

    if (workout === undefined) {
        return res.redirect("/badApiResponse");
    } else {
        let totalDuration = 0;
        workout.forEach((exercise) => {
            totalDuration += exercise.duration;
        });
        res.render("generatedWorkouts/generatedWorkouts", {
            workout: workout,
            totalDuration: totalDuration,
        });
    }
});


// Get Quick add workout page
generatedWorkoutsRouter.get("/quickAddWorkout", async (req, res) => {
    res.render("generatedWorkouts/quickAddWorkout");
});


// Post quick add workout data
generatedWorkoutsRouter.post("/quickAddWorkout", async (req, res) => {
    const itemId = req.body.item;
    const duration = req.body.duration || 0; // If no duration is specified, set it to 0
    const userId = req.session.USER.id;
    let workoutToAdd = await Exercise.findOne({ _id: new ObjectId(itemId) });

    // Get current date and time
    const date = new Date();

    // Create a new workout document
    const workout = new Workout({
        userId: userId,
        workoutName: workoutToAdd.name,
        exercises: [
            {
            name: workoutToAdd.name,
            duration: duration,
            bodyPart: workoutToAdd.bodyPart,
            },
        ],
        expireTime: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000), // set the expiry time 30 days from now
        createdTime: new Date(),
    });

    // Save the workout document
    await workout.save();

    let updatedUser = await User.findOne({ id: userId });
    req.session.USER = updatedUser;
    res.redirect("/workoutTracking/workoutLogs");
});


// Get workout filters
generatedWorkoutsRouter.get("/workoutFilters", (req, res) => {
    let user = req.session.USER;

    res.render("generatedWorkouts/workoutFilters", {
        tagsList: exerciseCategory,
        primaryUser: user,
        userInclude: user.includeExercise,
        userExclude: user.excludeExercise,
    });
});


// Get exercise catalog pages
generatedWorkoutsRouter.get("/exerciseCatalog", (req, res) => {
    let type = req.query.type;
    res.render("generatedWorkouts/exerciseCatalog", {
        type: type,
    });
});


// Get bad api response page
generatedWorkoutsRouter.get("/badApiResponse", (req, res) => {
    res.render("badApiResponse");
});


// Modify exercise tag
generatedWorkoutsRouter.post("/modifyExerciseTag", async (req, res) => {
    const exerciseTag = req.body.exerciseTag;
    const userId = req.session.USER.id;
    const type = req.body.type;
    let user = await User.findOne({ id: userId });

    if (type === "include") {
        if (
            user.exerciseTagInclude &&
            user.exerciseTagInclude.includes(exerciseTag)
        ) {
            // If the tag is already present, remove it
            await User.updateOne(
                { id: userId },
                { $pull: { exerciseTagInclude: exerciseTag } }
            );
        } else {
            // Otherwise, add the tag
            await User.updateOne(
                { id: userId },
                { $addToSet: { exerciseTagInclude: exerciseTag } }
            );
        }
    } else {
        if (
            user.exerciseTagExclude &&
            user.exerciseTagExclude.includes(exerciseTag)
        ) {
            // If the tag is already present, remove it
            await User.updateOne(
                { id: userId },
                { $pull: { exerciseTagExclude: exerciseTag } }
            );
        } else {
            // Otherwise, add the tag
            await User.updateOne(
                { id: userId },
                { $addToSet: { exerciseTagExclude: exerciseTag } }
            );
        }
    }

    let updatedUser = await User.findOne({ id: userId });
    req.session.USER = updatedUser;
    res.redirect("./workoutFilters");
});


// Search for exercises
generatedWorkoutsRouter.get("/searchExercise", async (req, res) => {
    const searchQuery = req.query.q;
    let exerciseQuery = await Exercise.find({
        name: new RegExp(searchQuery, "i"),
    });
    let parsedResponse = exerciseQuery.map((exerciseObject) => {
        return {
            name: exerciseObject.name,
            bodyPart: exerciseObject.bodyPart,
            id: exerciseObject._id,
        };
    });

    res.json(parsedResponse);
});


// Select exercise to include or exclude
generatedWorkoutsRouter.post("/selectExercise", async (req, res) => {
    const itemId = req.body.item;
    const userId = req.session.USER.id;
    let exerciseToAdd = await Exercise.findOne({ _id: new ObjectId(itemId) });

    let reqUrl = req.get("Referrer");
    let parsedUrl = new URL(reqUrl);
    let params = parsedUrl.searchParams;
    let type = params.get("type");

    if (type === "include") {
        await User.updateOne(
            { id: userId },
            {
                $addToSet: {
                    includeExercise: {
                        $each: [
                            {
                                name: exerciseToAdd.name,
                                bodyPart: exerciseToAdd.bodyPart,
                            },
                        ],
                    },
                },
            }
        );
    } else {
        await User.updateOne(
            { id: userId },
            {
                $addToSet: {
                    excludeExercise: {
                        $each: [
                            {
                                name: exerciseToAdd.name,
                                bodyPart: exerciseToAdd.bodyPart,
                            },
                        ],
                    },
                },
            }
        );
    }

    let updatedUser = await User.findOne({ id: userId });
    req.session.USER = updatedUser;
    res.redirect("./workoutFilters");
});


// Remove exercise from filter
generatedWorkoutsRouter.post("/deleteExercise", async (req, res) => {
    const exerciseName = req.body.item;
    const userId = req.session.USER.id;
    const type = req.body.type;

    let exerciseToDelete = await Exercise.findOne({ name: exerciseName });

    if (type === "include") {
        await User.updateOne(
            { id: userId },
            {
                $pull: {
                    includeExercise: {
                        name: exerciseToDelete.name,
                        bodyPart: exerciseToDelete.bodyPart,
                    },
                },
            }
        );
    } else {
        await User.updateOne(
            { id: userId },
            {
                $pull: {
                    excludeExercise: {
                        name: exerciseToDelete.name,
                        bodyPart: exerciseToDelete.bodyPart,
                    },
                },
            }
        );
    }

    let updatedUser = await User.findOne({ id: userId });
    req.session.USER = updatedUser;
    res.redirect("./workoutFilters");
});


// POST favorite workouts  favoriteWorkouts
generatedWorkoutsRouter.post("/favoriteWorkouts", async (req, res) => {
    console.log("session workout: ");
    console.log(req.session.WORKOUT);
    // add the workout to the user's favorite workouts
    const workout = req.session.WORKOUT;
    const userId = req.session.USER.id;
    // ADD workout to FavoriteWorkout collection
    const favWorkout = new FavoriteWorkout({
        userId: userId,
        workoutName: workout[0].name,
        exercises: workout,
    });
    await favWorkout.save();
    // delete session variables
    delete req.session.WORKOUT;
    res.redirect("/favoriteWorkouts");
});


module.exports = generatedWorkoutsRouter