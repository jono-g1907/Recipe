// T3 Import the Angular tools, shared form, and services needed to edit recipes.
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../auth/auth';
import { Recipe } from '../recipe.model';
import { RecipeForm, RecipeFormValue } from '../recipe-form/recipe-form';
import { RecipePayload, RecipeService } from '../recipe.service';

@Component({
  selector: 'app-recipe-edit',
  standalone: true,
  imports: [RecipeForm, RouterLink],
  templateUrl: './recipe-edit.html',
  styleUrl: './recipe-edit.css'
})
export class RecipeEdit implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly auth = inject(Auth);

  private subscription?: Subscription;

  // T3 Mirror the create flow by exposing loading status, user, and recipe data.
  readonly loading = this.recipeService.loading;
  readonly currentUser = computed(() => this.auth.currentUser);
  readonly recipe = signal<Recipe | null>(null);
  readonly error = signal('');
  readonly success = signal('');

  ngOnInit(): void {
    // T3 Read the recipe ID from the URL so refreshes and deep links keep working.
    this.subscription = this.route.paramMap.subscribe((params) => {
      const recipeId = params.get('recipeId');
      if (!recipeId) {
        this.error.set('Recipe not found.');
        return;
      }
      this.fetchRecipe(recipeId);
    });
  }

  ngOnDestroy(): void {
    // T3 Clean up the route listener when the component is destroyed.
    this.subscription?.unsubscribe();
  }

  // T3 Validate permissions, merge form values, and send the update request.
  handleSubmit(value: RecipeFormValue): void {
    const current = this.recipe();
    const user = this.auth.currentUser;
    if (!current || !user) {
      this.error.set('You need to be logged in as the recipe owner to edit this recipe.');
      return;
    }

    const payload: Partial<RecipePayload> = {
      ...value,
      userId: user.userId
    };

    this.error.set('');
    this.success.set('');

    this.recipeService.update(current.recipeId, payload).subscribe({
      next: (recipe) => {
        this.recipe.set(recipe);
        this.success.set('Recipe updated successfully.');
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to update recipe.');
      }
    });
  }

  // T3 Fetch the recipe so the form fields are pre-filled with existing data.
  private fetchRecipe(recipeId: string): void {
    this.error.set('');
    this.recipeService.get(recipeId).subscribe({
      next: (recipe) => {
        this.recipe.set(recipe);
      },
      error: (err) => {
        this.error.set(err.message || 'Unable to load recipe.');
      }
    });
  }

  // T3 Provide a shortcut back to the detail page after saving changes.
  goToDetails(): void {
    const recipe = this.recipe();
    if (recipe) {
      this.router.navigate(['/recipes', `${recipe.recipeId}-31477046`]);
    }
  }
}
