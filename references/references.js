app.get("/filterMeals", async (req, res) => {
    const filterType = req.query.filterType;
  
    const today = new Date();
    let startDate, endDate;
  
    if (filterType === "day") {
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    } else if (filterType === "week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      startDate = firstDayOfWeek;
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);
      endDate = lastDayOfWeek;
    } else if (filterType === "month") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
  
    // Fetch meals from the database using the filter
    const userId = req.session.USER.id;
    const meals = await Meal.find({ userId: userId });
    let filteredMeals = [];
  
    meals.forEach((meal) => {
      if (meal.createdTime >= startDate && meal.createdTime <= endDate) {
        filteredMeals.push(meal);
      }
    });
  
    // Calculate total calories
    let totalCalories = 0;
  
    filteredMeals.forEach((meal) => {
      let mealTotalCalories = 0;
  
      meal.items.forEach((item) => {
        mealTotalCalories += item.Calories;
      });
  
      meal.caloriesPerMeal = mealTotalCalories;
      totalCalories += mealTotalCalories;
    });
  
    // Calculate total calories of each meal and add it to the meal object
    filteredMeals = filteredMeals.map((meal) => {
      let mealTotalCalories = 0;
  
      meal.items.forEach((item) => {
        mealTotalCalories += item.Calories;
      });
  
      meal.caloriesPerMeal = mealTotalCalories;
      return meal;
    });
  
    console.log("Filtered meals with calories:", filteredMeals);
  
    res.render("mealLogs", { meals: filteredMeals, totalCalories, filterType });
  });