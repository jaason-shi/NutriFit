async function setup() {
    let type = $('#type').text().trim()
    console.log(type)
    console.log(typeof type)
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

$(document).ready(setup)