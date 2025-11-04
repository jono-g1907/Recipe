// T3 Pull in Angular utilities plus the recipe and health services for the detail screen.
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
  // HD1 Connects this detail screen to the AI nutrition helper so we can request health feedback.
  private readonly recipeHealthService = inject(RecipeHealthService);
  private readonly appIdSuffix = '-31477046';

  private subscription?: Subscription;

  // T3 Watch the logged-in user to unlock editing controls for the recipe owner.
  readonly currentUser = computed(() => this.auth.currentUser);
  // T3 Manage recipe data, loading states, and AI health insights for the template.
  readonly recipe = signal<Recipe | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly analyzing = signal(false);
  readonly analysis = signal<RecipeHealthAnalysis | null>(null);
  readonly analysisError = signal('');

  ngOnInit(): void {
    // T3 React to route changes so deep links and refreshes still load the correct recipe.
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
    // T3 Prevent memory leaks by cleaning up the route subscription.
    this.subscription?.unsubscribe();
  }

  // T3 Load the recipe details and reset health analysis whenever a new ID is requested.
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

  // T3 Navigate the user to the edit form while preserving the unique recipe identifier.
  goToEdit(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.recipeId, 'update-31477046']);
  }

  // T3 Send the recipe ingredients to the health service to generate AI nutrition tips.
  // HD1 Triggers the AI review when the chef taps the Analyze button.
  analyzeHealth(recipe: Recipe | null): void {
    if (!recipe) {
      return;
    }

    // HD1 Collects each ingredient in a friendly format that the AI prompt understands.
    const ingredients = (recipe.ingredients || []).map((item) => ({
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      unit: item.unit
    }));

    // HD1 Shows a loading spinner and clears any earlier AI messages before asking for a new analysis.
    this.analyzing.set(true);
    this.analysisError.set('');
    this.analysis.set(null);

    // HD1 Sends the prepared ingredient list to the health service and stores the AI response for display.
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
  // T3 Normalize incoming route IDs by trimming suffixes and ensuring uppercase matches the API.
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
