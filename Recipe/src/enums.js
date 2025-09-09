/** @enum {string} */
const Difficulty = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
};

/** @enum {string} */
const MealType = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner',
    SNACK: 'Snack'
};

/** @enum {string} */
const Location = {
    PANTRY: 'Pantry',
    FRIDGE: 'Fridge',
    FREEZER: 'Freezer'
};

module.exports = { Difficulty: Difficulty, MealType: MealType, Location: Location };
