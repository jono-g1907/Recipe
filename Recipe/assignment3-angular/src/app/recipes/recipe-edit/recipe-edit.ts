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

  readonly loading = this.recipeService.loading;
  readonly currentUser = computed(() => this.auth.currentUser);
  readonly recipe = signal<Recipe | null>(null);
  readonly error = signal('');
  readonly success = signal('');

  ngOnInit(): void {
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
    this.subscription?.unsubscribe();
  }

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

  goToDetails(): void {
    const recipe = this.recipe();
    if (recipe) {
      this.router.navigate(['/recipes', `${recipe.recipeId}-31477046`]);
    }
  }
}
