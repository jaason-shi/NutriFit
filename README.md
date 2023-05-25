# 2800-202310-DTC18 NutriFit

## Project Description

Our team NutriFit (DTC18), developed a meal and exercise generator application to help people interested in healthy living by providing an application that will generate meals and exercises based on their needs with the power of AI.

## Technologies Used

### Frontend

- HTML v5
- CSS v3
- JavaScript ES6
- EJS (Embedded JavaScript)
- Bootstrap 4.5.0 & 5.3.0
- jQuery 3.5.1

### Backend

- Node.js v18.12.1
- Express.js v4.18.2 (session v1.17.3)
- Bcrypt v5.1.0 for password hashing
- Body-parser v1.20.2 for parsing JSON
- CSV-parser v3.0.0 for parsing CSV files
- JOI v17.9.2 for data validation

### Database

- MongoDB v5.4.0
  - Atlas v6.0
  - Studio 3T v2023.4.1
  - Mongoose v7.1.0
  - Session v3.1.1

### AI services

- OpenAI's GPT-3.5 Turbo v1.0.0

### Other tech tools that we used

- Git for version control
- Kaggle Datasets for data
- Cyclic for hosting
- dotenv v16.0.3 for environment variables
- fs v0.0.1-security for file system
- https v1.0.0 for secure HTTP requests
- request v2.88.2 for HTTP requests
- URL v0.11.0 for URL parsing

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

This project assumes you have an IDE like Visual Studio Code installed on your computer. If you do not, please install one before proceeding.

1. Install the latest version of Node.js (<https://nodejs.org/>). This will also install npm for package management.
2. Clone this repository: `git clone https://github.com/Emildore/2800-202310-DTC18.git`
3. Navigate into the project directory: `cd 2800-202310-DTC18`
4. Install the dependencies: `npm install`
5. Start the application: `npm start`
6. Visit `http://localhost:3000` in your web browser.

You will need a chatGPT API key in order run our project. Additionally, you will need a MongoDB Atlas URI to connect to the database. Please ensure to configure a .env file with the following variables:

- ATLAS_URI
- SESSION_KEY
- GPT_API_KEY
- GPT_ORG_ID

### Testing Logs

`https://docs.google.com/spreadsheets/d/1J3MCXIx_lzFY_PRPW3lFdsiPnllT0M7EfoMN05QxevY/edit?usp=sharing`

## How to use the product (Features)

- **AI-Powered Meal Generation:** NutriFit generates meal plans tailored to your specific dietary needs and preferences.

1. Assume you are signed in. If you are not, please sign in or sign up.
2. On the member's page, click on the "Generate Meals" button.
3. The app will generate a meal plan for you.

- **AI-Powered Workout Planning:** NutriFit crafts a personalized exercise routine for you, based on your fitness goals and current fitness level.

1. Assume you are signed in. If you are not, please sign in or sign up.
2. On the member's page, click on the "Generate Workouts" button.
3. The app will generate a workout plan for you.

- **Meal Tracking:** Keep track of your meal intake with intuitive progress reports.

1. Assume you are signed in. If you are not, please sign in or sign up.
2. On the member's page, click on the "Logs" button.
3. On the logs page, click on the "Meal Logs" button.
4. View your logs; filter by time period if desired.

- **Workout Tracking:** Keep track of your fitness journey with intuitive progress reports.

1. Assume you are signed in. If you are not, please sign in or sign up.
2. On the member's page, click on the "Logs" button.
3. On the logs page, click on the "Workout Logs" button.
4. View your logs; filter by time period if desired.

- **Easter Egg:** NutriFit has a hidden easter egg. Can you find it?

## Credits, References, and Licenses

- Credits: NutriFit Team
- References: Kaggle Datasets, OpenAI's GPT-3.5 Turbo

## AI usage

1. **AI in App Creation:** We used AI to generate the name of the app, the slogan, syntax, and to check code errors.

2. **AI in Data Sets:** AI was used to create a dataset of meals and workouts. We queried for an array of JSON objects. We then matched the structure of the response with our Kaggle dataset.

3. **AI in App Functionality:** NutriFit uses AI to generate personalized meal plans and workout routines for the user. Additionally, the user can add certain parameters, such as the amount of calories they want to consume or the amount of time they want to spend working out.

4. **Limitations and Solutions:** Due to the non-deterministic nature of the AI, we had to account for the edge cases. For example, if the response did not conform to our expected structure, the server would crash. We overcame this by catching the errors and redirecting to an error page.

## Contact Information & Authors

### This project was created as a school assignment by

- Emily Tran: <etran21@my.bcit.ca>
- Sean Sollestre: <ssollestre@my.bcit.ca>
- Jason Shi: <jshi26@my.bcit.ca>
- Sam Tam: <stam84@my.bcit.ca>

### For any additional questions or comments, please contact us via email.
