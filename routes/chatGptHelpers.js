/**
 * Helper functions related to querying the Chat GPT API.
 */

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
    const mealPlan = JSON.parse(response).choices[0].message.content;

    console.log(`The response we get: ${mealPlan}\n\n`);

    const codeBlockRegex = /```javascript([\s\S]+?)```/g;
    let matches = mealPlan.match(codeBlockRegex);

    console.log(`After regex filter: ${matches}\n\n`);
    if (matches == null) {
        matches = mealPlan.match(/\[[^\[\]]*\]/);
        console.log(`After regex filter Second: ${matches}\n\n`);
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

    const mealParsed = JSON.parse(codeBlockContent[0]);
    return mealParsed
}


module.exports = {
    queryChatGPT: queryChatGPT,
    parseResponse: parseResponse
}; 