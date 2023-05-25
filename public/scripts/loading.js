/**
 * Queries the OpenAI GPT-3.5 Turbo model for chat completions using the given prompt.
 * 
 * @async
 * @param {string} prompt the prompt to query the AI
 * @returns {Promise<string>} a Promise that resolves as a string with the response from the API.
 */
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


/**
 * Parses the response into an array of JSON objects.
 * 
 * @param {String} response - the response from the GPT API
 * @returns {Array<Object>|undefined} - the array of JSON objects or undefined if parsing fails
 */
function parseResponse(response) {
    // const initialParse = JSON.parse(response).choices[0].message.content;
    let initialParse;
    try {
        initialParse = JSON.parse(response).choices[0].message.content;
    } catch (error) {
        console.error(error)
        return undefined
    }

    console.log(`The response we get: ${initialParse}\n\n`);

    const codeBlockRegex = /```javascript([\s\S]+?)```/g;
    let matches = initialParse.match(codeBlockRegex);

    console.log(`After regex filter: ${matches}\n\n`);
    if (matches == null) {
        matches = initialParse.match(/\[[^\[\]]*\]/);
        console.log(`After regex filter Second: ${matches}\n\n`);
    }

    if (!matches) {
        return undefined;
    }
    let codeBlockContent;

    if (matches && matches.length > 0) {
        codeBlockContent = matches.map((match) =>
            match.replace(/```javascript|```/g, "").trim()
        );
    }

    const objectArray = JSON.parse(codeBlockContent[0]);
    return objectArray
}


/**
 * Queries the GPT API to generate a meal based on user conditions.
 * 
 * @async
 * @param {number} calories - the calories that the meal will query to have
 * @param {Object} user - an object representing the current user
 * @returns {Array<Object>|undefined} - the meal as an array of JSON objects or undefined if parsing fails
 */
async function mealGenerationQuery(calories, user) {
    let includedFood = JSON.stringify(user.includeFood) ?? [];
    let excludedFood = JSON.stringify(user.excludeFood) ?? [];
    let includedTags = user.foodTagInclude ?? [];
    let excludedTags = user.foodTagExclude ?? [];

    const mealsPrompt =
        `Respond to me in this format:` +
        ' ```javascript[{ "Food": String, "Calories": int, "Grams": int}, ...]```' +
        `. Make me a sample ${calories} calorie meal. It must be within 100 calories of ${calories} Do not provide any extra text outside of` +
        ' ```javascript[{ "name": String, "calories": int, "grams": int }, ...]```.' +
        `These json objects must be included: ${includedFood}. These are the themes of the meal: ${includedTags}. These json objects must not be included: ${excludedFood}. Do not provide meals related to: ${excludedTags}. Remove all white space.`;

    console.log(`Initial Prompt: ${mealsPrompt}\n\n`);

    const response = await queryChatGPT(mealsPrompt);
    let mealParsed = parseResponse(response);

    if (!mealParsed) {
        return undefined;
    }

    console.log("Final Product\n");
    console.log(mealParsed);

    return mealParsed;
}


function setup() {
    let user = $('#user').text()
    let calories = Number($('#calories').text())
    let userParsed = JSON.parse(user)
    console.log("Hello world!")
    console.log(calories)
    console.log(userParsed)
    $.get('./loadingData', { q: "test" }, (data) => {
        console.log("Data:")
        console.log(data)
    }).then(() => {
        window.location.href = "/"
    })

}

$(document).ready(setup)