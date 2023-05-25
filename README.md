# 2800-202310-DTC18# NutriFit

## Project Description

NutriFit is a comprehensive fitness and nutrition management application powered by AI, offering personalized meal and workout planning, progress tracking, and even a hidden snake game.

Our team NutriFit (DTC18), developed a meal and exercise generator application to help people interested in healthy living by providing an application that will generate meals and exercises based on their needs with the power of AI.

## Technologies used

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express.js

Database: MongoDB

AI services: OpenAI's GPT-3 for generating meal and workout plans

Other tech tools: Git for version control

## Listing of File Contents of folder

```
.
C:.
|   .DS_Store
|   .env
|   .gitignore
|   devLog.txt
|   package-lock.json
|   package.json
|   README.md
|   server.js
|   upload.js
|   utils.js
|
+---archive
|       bottomNav.ejs
|       bottomNav.js
|       exerciseFilter.ejs
|       exerciseFilterEx.ejs
|       exerciseLogs.ejs
|       favoriteExercises.ejs
|       favouritesMeals.ejs
|       foodCatalogExclude.ejs
|       foodCatalogInclude.ejs
|       foodFilter.ejs
|       foodFilterEx.ejs
|       foodPageTest.ejs
|       foodServer.js
|       landingPage-LAPTOP-72OFTTIO.js
|       landingPage.js
|       login.html
|       response.js
|       seanLogin.html
|       seanSignUp.html
|       searchFood.js
|       selectedExercise.ejs
|       selectedFood.ejs
|       serverS.js
|       server_sam.js
|       style.css
|
+---models
|       exerciseModel.js
|       favMealModel.js
|       favWorkoutModel.js
|       foodModel.js
|       mealModel.js
|       userModel.js
|       workoutModel.js
|
+---node_modules
|   |   .package-lock.json
│   └───scripts
│           exerciseCatalog.js
│           foodCatalog.js
│           snake.js
│
├───references
│       references.js
│
├───routes
│       chatGptHelpers.js
│       generatedMealsRoute.js
│       generatedWorkoutsRoute.js
│       mealTrackingRoute.js
│       userRoute.js
│       workoutTrackingRoute.js
│
\---views
    +---errors
    |       403.ejs
    |       404.ejs
    |       alreadyExists.ejs
    |       authFail.ejs
    |       badApiResponse.ejs
    |
    +---favorites
    |       favoriteMeals.ejs
    |       favorites.ejs
    |       favoriteWorkouts.ejs
    |
    +---general
    |       landingPage.ejs
    |       members.ejs
    |       userProfile.ejs
    |       waitingAPI.ejs
    |
    +---generatedMeals
    |       foodCatalog.ejs
    |       generatedMeals.ejs
    |       mealFilters.ejs
    |       quickAddMeal.ejs
    |
    +---generatedWorkouts
    |       exerciseCatalog.ejs
    |       generatedWorkouts.ejs
    |       quickAddWorkout.ejs
    |       workoutFilters.ejs
    |
    +---logs
    |       logs.ejs
    |       mealLogs.ejs
    |       workoutLogs.ejs
    |
    +---partials
    |       foodItem.ejs
    |       header.ejs
    |       meta.ejs
    |       navbar.ejs
    |
    \---user
            changePassword.ejs
            changePasswordSuccess.ejs
            checkSecurity.ejs
            getEmail.ejs
            incorrectAnswer.ejs
            invalidFormData.ejs
            login.ejs
            noMatchFound.ejs
            signup.ejs
```

## How to install or run the project

1. Install the latest version of Node.js (https://nodejs.org/). This will also install npm for package management.
2. Clone this repository: `git clone https://github.com/Emildore/2800-202310-DTC18.git`
3. Navigate into the project directory: `cd 2800-202310-DTC18`
4. Install the dependencies: `npm install`
5. Start the application: `npm start`
6. Visit `http://localhost:3000` in your web browser.

Please ensure that you also have the necessary API keys for any third-party APIs used. You should place these in your environment variables or in your configuration files (depending on how the application is set up).

## How to use the product (Features)

1. **AI-Powered Meal Generation:** NutriFit generates meal plans tailored to your specific dietary needs and preferences.

2. **AI-Powered Workout Planning:** NutriFit crafts a personalized exercise routine for you, based on your fitness goals and current fitness level.

3. **Progress Tracking:** Keep track of your fitness journey with intuitive progress reports.

4. **Easter Egg (Hidden Snake Game):** Navigate the snake to the food to grow longer, but avoid hitting the walls and your own tail!

## Credits, References, and Licenses

- Credits: NutriFit Team
- References:
- License:

## AI usage

1. **AI in App Creation:** OpenAI's GPT-3 was used to generate meal and workout plans.

2. **AI in Data Sets:** AI was used to generate a comprehensive dataset of meal and workout plans.

3. **AI in App Functionality:** NutriFit uses AI to generate personalized meal plans and workout routines for each user.

4. **Limitations and Solutions:** AI requires a significant amount of data to produce accurate recommendations. We overcame this by using a comprehensive dataset for meal and workout plans.

## Contact Information & Authors

This project was created as a school assignment by:

- Emily Tran
- Sean Sollestre
- Jason Shi
- Sam Tam

For any additional questions or comments, please contact ---.