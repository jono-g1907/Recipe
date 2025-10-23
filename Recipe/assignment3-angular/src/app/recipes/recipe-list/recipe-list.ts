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

  readonly currentUser = computed(() => this.auth.currentUser);

  readonly recipes = signal<Recipe[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly deleteError = signal('');
  readonly scope = signal<'mine' | 'all'>('mine');
  readonly selectedRecipe = signal<Recipe | null>(null);

  ngOnInit(): void {
    this.loadRecipes('mine');
  }

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

  openDeleteModal(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
    this.deleteError.set('');
  }

  closeDeleteModal(): void {
    this.selectedRecipe.set(null);
    this.deleteError.set('');
  }

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

  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.recipeId;
  }
}
