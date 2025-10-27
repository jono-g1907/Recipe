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

  private readonly loadingSignal = signal(false);
  readonly loading = computed(() => this.loadingSignal());

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

  delete(recipeId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiBase}/recipes/${recipeId}-31477046`, {
        headers: this.buildHeaders()
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private buildHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    const user = this.auth.currentUser;
    if (user?.userId) {
      headers['x-user-id'] = user.userId;
    }
    return new HttpHeaders(headers);
  }

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
