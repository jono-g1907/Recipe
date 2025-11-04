import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../shared/api-config';
import { Auth } from '../auth/auth';

export interface RecipeHealthAnalysis {
  summary: string;
  score: number;
  concerns: string[];
  suggestions: string[];
}

export interface RecipeHealthResponse {
  analysis: RecipeHealthAnalysis;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeHealthService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiBase = API_BASE_URL;

  // HD1 Posts the chef's ingredient list to our backend endpoint that talks with the AI nutrition model.
  analyze(ingredients: unknown[]): Observable<RecipeHealthAnalysis> {
    return this.http
      .post<RecipeHealthResponse>(`${this.apiBase}/ai/analyze-31477046`, { ingredients }, {
        headers: this.buildHeaders()
      })
      .pipe(
        map((response) => response.analysis),
        catchError((error) => this.handleError(error))
      );
  }

  // HD1 Adds the signed-in cook's ID so the backend can personalize or secure the AI request.
  private buildHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    const user = this.auth.currentUser;
    if (user?.userId) {
      headers['x-user-id'] = user.userId;
    }
    return new HttpHeaders(headers);
  }

  // HD1 Converts low-level server errors into a friendly AI analysis message for the interface.
  private handleError(error: HttpErrorResponse) {
    const serverError = error.error as { message?: string } | undefined;
    const message = serverError?.message || 'Unable to analyze recipe health right now.';
    return throwError(() => new Error(message));
  }
}
