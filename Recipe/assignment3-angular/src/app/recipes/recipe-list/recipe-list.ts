// T3 Bring in Angular building blocks, routing, and recipe utilities for the list screen.
import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';
import { Recipe } from '../recipe.model';
import { RecipeService } from '../recipe.service';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [DatePipe, RouterLink, NgClass],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeList implements OnInit {
  private readonly recipeService = inject(RecipeService);
  private readonly auth = inject(Auth);

  // T3 Watch the logged-in user so we can tailor messaging and permissions.
  readonly currentUser = computed(() => this.auth.currentUser);

  // T3 Hold the recipe data, spinner states, and delete modal info for the template.
  readonly recipes = signal<Recipe[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly deleteError = signal('');
  readonly scope = signal<'mine' | 'all'>('mine');
  readonly selectedRecipe = signal<Recipe | null>(null);

  ngOnInit(): void {
    // T3 Default to showing the chef's own recipes as soon as the page loads.
    this.loadRecipes('mine');
  }

  // T3 Retrieve recipes for the chosen tab and gracefully handle missing logins or failures.
  loadRecipes(scope: 'mine' | 'all'): void {
    this.scope.set(scope);
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('Please log in with your chef account to view recipes.');
      this.recipes.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.recipeService.list(scope).subscribe({
      next: (recipes) => {
        this.recipes.set(recipes);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load recipes.');
        this.recipes.set([]);
        this.loading.set(false);
      }
    });
  }

  // T3 Open the confirmation dialog and remember which recipe is being removed.
  openDeleteModal(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
    this.deleteError.set('');
  }

  // T3 Close the dialog and clear any previous error message.
  closeDeleteModal(): void {
    this.selectedRecipe.set(null);
    this.deleteError.set('');
  }

  // T3 Call the API to delete the highlighted recipe and update the table instantly.
  deleteSelectedRecipe(): void {
    const recipe = this.selectedRecipe();
    if (!recipe) {
      return;
    }

    this.deleteError.set('');
    this.recipeService.delete(recipe.recipeId).subscribe({
      next: () => {
        this.recipes.update((list) => list.filter((item) => item.recipeId !== recipe.recipeId));
        this.closeDeleteModal();
      },
      error: (err) => {
        this.deleteError.set(err.message || 'Failed to delete recipe.');
      }
    });
  }

  // T3 Help Angular reuse table rows efficiently by referencing the recipe ID.
  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.recipeId;
  }
}
