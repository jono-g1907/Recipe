export interface RecipeIngredient {
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  recipeId: string;
  userId: string;
  title: string;
  chef: string;
  mealType: string;
  cuisineType: string;
  difficulty: string;
  prepTime: number;
  servings: number;
  createdDate: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  user?: {
    fullname: string;
    role: string;
    userId: string;
  };
}

export interface RecipeListResponse {
  recipes: Recipe[];
  page: number;
  total: number;
}
