// T3 Import Angular helpers, HTTP tools, and data models used for every recipe request.
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, finalize, map, throwError } from 'rxjs';
import { Auth } from '../auth/auth';
import { Recipe, RecipeListResponse } from './recipe.model';
import { API_BASE_URL } from '../shared/api-config';

export interface RecipePayload {
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
  ingredients: {
    ingredientName: string;
    quantity: number;
    unit: string;
  }[];
  instructions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiBase = API_BASE_URL;

  // T3 Track whether the app is waiting on the API so buttons and loaders can react instantly.
  private readonly loadingSignal = signal(false);
  readonly loading = computed(() => this.loadingSignal());

  // T3 Load every recipe for the chosen scope, handling owner-only and global views.
  list(scope: 'mine' | 'all' = 'mine'): Observable<Recipe[]> {
    const params = scope === 'mine' ? '?scope=mine' : '';
    return this.http
      .get<RecipeListResponse>(`${this.apiBase}/recipes-list-31477046${params}`, {
        headers: this.buildHeaders()
      })
      .pipe(
        map((response) => response.recipes || []),
        catchError((error) => this.handleError(error))
      );
  }

  // T3 Fetch the full details for one recipe so detail and edit screens can fill in content.
  get(recipeId: string): Observable<Recipe> {
    return this.http
      .get<{ recipe: Recipe }>(`${this.apiBase}/recipes/${recipeId}-31477046`, {
        headers: this.buildHeaders()
      })
      .pipe(
        map((response) => response.recipe),
        catchError((error) => this.handleError(error))
      );
  }

  // T3 Send the new recipe form data to the backend and report loading and errors to the UI.
  create(payload: RecipePayload): Observable<Recipe> {
    this.loadingSignal.set(true);
    return this.http
      .post<{ recipe: Recipe }>(`${this.apiBase}/add-recipe-31477046`, payload, {
        headers: this.buildHeaders()
      })
      .pipe(
        map((response) => response.recipe),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  // T3 Update an existing recipe while reusing the loading indicator so the submit button is disabled.
  update(recipeId: string, payload: Partial<RecipePayload>): Observable<Recipe> {
    this.loadingSignal.set(true);
    return this.http
      .post<{ recipe: Recipe }>(`${this.apiBase}/recipes/${recipeId}/update-31477046`, payload, {
        headers: this.buildHeaders()
      })
      .pipe(
        map((response) => response.recipe),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  // T3 Remove a recipe permanently when the user confirms deletion in the list view.
  delete(recipeId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiBase}/recipes/${recipeId}-31477046`, {
        headers: this.buildHeaders()
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // T3 Attach the logged-in chef's ID so the backend knows which recipes belong to them.
  private buildHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    const user = this.auth.currentUser;
    if (user?.userId) {
      headers['x-user-id'] = user.userId;
    }
    return new HttpHeaders(headers);
  }

  // T3 Convert backend error shapes into friendly messages the interface can show to the user.
  private handleError(error: HttpErrorResponse) {
    const serverError = error.error as {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    };

    const defaultMessage = 'Something went wrong. Please try again.';
    let message = defaultMessage;

    if (serverError) {
      const details = Array.isArray(serverError.details)
        ? serverError.details
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item)
        : [];

      if (details.length) {
        message = details.join(' ');
      } else if (typeof serverError.message === 'string' && serverError.message.trim()) {
        message = serverError.message.trim();
      } else if (typeof serverError.error === 'string' && serverError.error.trim()) {
        message = serverError.error.trim();
      }
    }

    if (message === defaultMessage && error.message) {
      message = error.message;
    }
    
    return throwError(() => new Error(message));
  }

}
