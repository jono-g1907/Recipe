// T3 Load Angular utilities, routing, and the shared form used to capture recipes.
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../auth/auth';
import { RecipeForm, RecipeFormValue } from '../recipe-form/recipe-form';
import { RecipePayload, RecipeService } from '../recipe.service';

@Component({
  selector: 'app-recipe-create',
  standalone: true,
  imports: [CommonModule, RecipeForm, RouterLink],
  templateUrl: './recipe-create.html',
  styleUrl: './recipe-create.css'
})
export class RecipeCreate {
  private readonly auth = inject(Auth);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  // T3 Reuse the service's loading signal so the submit button can show a spinner.
  readonly loading = this.recipeService.loading;
  // T3 Capture who is logged in to confirm they have permission to add recipes.
  readonly currentUser = computed(() => this.auth.currentUser);

  // T3 Track success and error messages to guide the chef through the workflow.
  readonly error = signal('');
  readonly success = signal('');

  // T3 Gather the form values, attach the user ID, and call the API to create a recipe.
  handleSubmit(value: RecipeFormValue): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('You need to be logged in as a chef to add recipes.');
      return;
    }

    const payload: RecipePayload = {
      ...value,
      userId: user.userId
    };

    this.error.set('');
    this.success.set('');

    this.recipeService.create(payload).subscribe({
      next: (recipe) => {
        this.success.set('Recipe created successfully!');
        this.router.navigate(['/recipes', `${recipe.recipeId}-31477046`]);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to create recipe.');
      }
    });
  }
}
