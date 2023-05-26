/**
 * Script file for loading page logic.
 */

/**
 * Sets up the ajax call to the meal or workout endpoint to generate meals or workouts
 */
async function setup() {
    let type = $('#type').text().trim()
    if (type === 'meal') {
        console.log("Loading meal")
        await $.get('/generatedMeals/loadingData')
        window.location.href = "/generatedMeals"
    } else {
        console.log("Loading workout")
        await $.get('/generatedWorkouts/loadingData')
        window.location.href = "/generatedWorkouts"
    }
}

/**
 * Adds event listeners only when document is fully loaded.
 */
$(document).ready(setup)
