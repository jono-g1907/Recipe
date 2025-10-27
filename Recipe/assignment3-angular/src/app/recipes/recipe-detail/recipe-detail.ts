import { DatePipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../auth/auth';
import { Recipe } from '../recipe.model';
import { RecipeService } from '../recipe.service';
import { RecipeHealthAnalysis, RecipeHealthService } from '../recipe-health.service';

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
  private readonly recipeHealthService = inject(RecipeHealthService);
  private readonly appIdSuffix = '-31477046';

  private subscription?: Subscription;

  readonly currentUser = computed(() => this.auth.currentUser);
  readonly recipe = signal<Recipe | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly analyzing = signal(false);
  readonly analysis = signal<RecipeHealthAnalysis | null>(null);
  readonly analysisError = signal('');

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const recipeKey = params.get('recipeKey') ?? params.get('recipeId');
      const recipeId = this.extractRecipeId(recipeKey);
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
    this.analyzing.set(false);
    this.analysis.set(null);
    this.analysisError.set('');
    this.recipeService.get(recipeId).subscribe({
      next: (recipe) => {
        this.recipe.set(recipe);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Unable to load recipe.');
        this.loading.set(false);
        this.analyzing.set(false);
        this.analysis.set(null);
      }
    });
  }

  goToEdit(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.recipeId, 'update-31477046']);
  }

  analyzeHealth(recipe: Recipe | null): void {
    if (!recipe) {
      return;
    }

    const ingredients = (recipe.ingredients || []).map((item) => ({
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      unit: item.unit
    }));

    this.analyzing.set(true);
    this.analysisError.set('');
    this.analysis.set(null);

    this.recipeHealthService.analyze(ingredients).subscribe({
      next: (analysis) => {
        this.analysis.set(analysis);
        this.analyzing.set(false);
      },
      error: (err) => {
        this.analysisError.set(err.message || 'Unable to analyze recipe health.');
        this.analyzing.set(false);
      }
    });
  }
  private extractRecipeId(raw: string | null): string | null {
    if (!raw) {
      return null;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.endsWith(this.appIdSuffix)) {
      return trimmed.slice(0, -this.appIdSuffix.length).toUpperCase();
    }

    return trimmed.toUpperCase();
  }
}
