import { DatePipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../auth/auth';
import { Recipe } from '../recipe.model';
import { RecipeService } from '../recipe.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly auth = inject(Auth);

  private subscription?: Subscription;

  readonly currentUser = computed(() => this.auth.currentUser);
  readonly recipe = signal<Recipe | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const recipeId = params.get('recipeId');
      if (!recipeId) {
        this.error.set('Recipe not found.');
        this.loading.set(false);
        return;
      }
      this.fetchRecipe(recipeId);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private fetchRecipe(recipeId: string): void {
    this.loading.set(true);
    this.error.set('');
    this.recipeService.get(recipeId).subscribe({
      next: (recipe) => {
        this.recipe.set(recipe);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Unable to load recipe.');
        this.loading.set(false);
      }
    });
  }

  goToEdit(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.recipeId, 'update-31477046']);
  }
}
