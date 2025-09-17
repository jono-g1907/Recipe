File: src/views/add-recipe-31477046.html
Purpose: Form for creating recipes via HTML interface with client-side validation.

At a glance: Presents fields for recipe metadata, ingredients, and instructions; posts to `/add-recipe-31477046`. Contains inline script enforcing formatting and duplicate ID checks via `/api/recipes-APP_ID`.

Imports & dependencies:
- `<link href="/bootstrap.min.css" rel="stylesheet">` for styling.
- Inline script relies on `XMLHttpRequest` (no external libraries).
- Server handler: `POST /add-recipe-31477046` in `src/server.js` processes submissions.

Configuration/Constants:
- Hard-coded `APP_ID = '31477046'` inside script; must match `constants.APP_ID`.

Main content (annotated walkthrough):
- Form fields align with `Recipe` model fields (`title`, `recipeId`, `chef`, `mealType`, `cuisineType`, `difficulty`, `prepTime`, `servings`, `createdDate`).
- Ingredients textarea expects lines formatted `name | quantity | unit`; instructions textarea expects one step per line.
- Buttons provide navigation back to recipes list.

Script logic:
1. Captures form refs (`recipeIdInput`, `ingredientsInput`).
2. `toTrimmed` helper normalises whitespace.
3. `validateIngredients` ensures each non-empty line splits into three parts with positive quantity and non-empty name/unit. Sets custom validity message when invalid.
4. `checkDuplicateId(cb)` issues GET `/api/recipes-APP_ID`, parses JSON, checks if `recipeId` already exists, sets custom validity accordingly.
5. Event listeners:
   - Ingredients input -> revalidate on each change.
   - Recipe ID input -> clear validity on change; `blur` triggers duplicate check.
   - `submit` handler prevents default, runs validations, then only submits when `form.checkValidity()` passes (to avoid double submission issues).

Edge cases & errors:
- Duplicate check relies on network call; if API fails, script silently continues with assumption of uniqueness (validity reset to empty string).
- No debouncing; repeated blur triggers requests.

Security notes:
- No CSRF tokens. Client-side validation supplements but does not replace server-side model validation.

Related files: `docs/line-by-line/src_server.js.md` (POST handler), `docs/line-by-line/src_models_Recipe.js.md` (final validation).
