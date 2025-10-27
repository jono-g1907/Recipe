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
  private readonly apiBase = AUTH_BASE_URL;
  private readonly storageKey = 'recipe-hub-auth-user';
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/register-31477046`, payload)
      .pipe(
        map((response) => this.handleAuthResponse(response)),
        catchError((error) => this.handleError(error))
      );
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/login-31477046`, payload)
      .pipe(
        map((response) => this.handleAuthResponse(response)),
        tap((user) => this.saveUser(user)),
        catchError((error) => this.handleError(error))
      );
  }

  logout(userId: string): Observable<string> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/logout-31477046`, { userId })
      .pipe(
        tap(() => this.clearUser()),
        map((response) => response.message || 'You have been logged out.'),
        catchError((error) => this.handleError(error))
      );
  }

  clearUser(): void {
    this.currentUserSubject.next(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.storageKey);
    }
  }

  private handleAuthResponse(response: AuthResponse): AuthUser {
    if (!response.success || !response.user) {
      const message = response.message || 'Request failed. Please try again.';
      throw new Error(message);
    }
    return response.user;
  }

  private saveUser(user: AuthUser): void {
    this.currentUserSubject.next(user);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  private loadUser(): AuthUser | null {
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
    const message =
      (error.error && (error.error.message || error.error.error)) || error.message ||
      'Request failed. Please try again.';
    return throwError(() => new Error(message));
  }
}
