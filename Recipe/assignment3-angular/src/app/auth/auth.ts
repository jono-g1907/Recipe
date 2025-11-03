import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { AUTH_BASE_URL } from '../shared/api-config';

export interface AuthUser {
  userId: string;
  email: string;
  fullname: string;
  role: string;
  phone: string;
  isLoggedIn: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  fullname: string;
  role: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser | null;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // T1 Acts as the single gateway between the components and the pre-existing API.
  // T1 Centralising HTTP calls keeps the UI focused on handling forms and messages.
  private readonly apiBase = AUTH_BASE_URL;
  private readonly storageKey = 'recipe-hub-auth-user';
  // T1 BehaviorSubject stores the most recent logged-in user for instant updates.
  // T1 Other parts of the app subscribe to know immediately when auth state changes.
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  register(payload: RegisterPayload): Observable<AuthUser> {
    // T1 Sends the registration form data to the backend and returns the new user.
    // T1 Error messages from the API are passed back so the form can explain issues.
    return this.http
      .post<AuthResponse>(`${this.apiBase}/register-31477046`, payload)
      .pipe(
        map((response) => this.handleAuthResponse(response)),
        catchError((error) => this.handleError(error))
      );
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    // T1 Verifies login credentials with the backend and caches the returned user.
    // T1 Server errors (wrong password, missing account, etc.) become clear messages.
    return this.http
      .post<AuthResponse>(`${this.apiBase}/login-31477046`, payload)
      .pipe(
        map((response) => this.handleAuthResponse(response)),
        tap((user) => this.saveUser(user)),
        catchError((error) => this.handleError(error))
      );
  }

  logout(userId: string): Observable<string> {
    // T1 Tells the backend the user is signing out and clears the cached session.
    // T1 Removing the stored user helps protected routes notice the logout quickly.
    return this.http
      .post<AuthResponse>(`${this.apiBase}/logout-31477046`, { userId })
      .pipe(
        tap(() => this.clearUser()),
        map((response) => response.message || 'You have been logged out.'),
        catchError((error) => this.handleError(error))
      );
  }

  clearUser(): void {
    // T1 Resets the in-memory and on-disk record of the logged-in user.
    // T1 Prevents private data from sticking around after a logout or failed request.
    this.currentUserSubject.next(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.storageKey);
    }
  }

  private handleAuthResponse(response: AuthResponse): AuthUser {
    // T1 The API response has a `success` flag so we can detect failures quickly.
    // T1 Throwing an error passes the message back to the component for display.
    if (!response.success || !response.user) {
      const message = response.message || 'Request failed. Please try again.';
      throw new Error(message);
    }
    return response.user;
  }

  private saveUser(user: AuthUser): void {
    // T1 Persists a successful login so the browser remembers the session.
    // T1 Local storage lets the session survive page refreshes or reopened tabs.
    this.currentUserSubject.next(user);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  private loadUser(): AuthUser | null {
    // T1 Reads any stored session when the page loads to restore the signed-in user.
    // T1 Invalid data is ignored so the app can start in a clean state.
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch (err) {
      return null;
    }
  }

  private handleError(error: HttpErrorResponse) {
    // T1 Extracts a helpful message from the HTTP error for UI feedback.
    // T1 `throwError` returns it to the caller so the form can show what went wrong.
    const message =
      (error.error && (error.error.message || error.error.error)) || error.message ||
      'Request failed. Please try again.';
    return throwError(() => new Error(message));
  }
}
