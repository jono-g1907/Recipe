import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, throwError } from 'rxjs';
import { Auth } from '../auth/auth';
import {
  InventoryItem,
  InventoryListResponse,
  InventoryValueResponse
} from './inventory.model';
import { apiBaseUrl } from '../shared/api-base';

export interface InventoryPayload {
  inventoryId: string;
  userId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;
  purchaseDate: string;
  expirationDate: string;
  location: string;
  cost: number;
  createdDate: string;
}

export interface InventoryFilters {
  q?: string;
  category?: string;
  location?: string;
  unit?: string;
  sort?: string;
  expiringBy?: string;
  lowStockBelow?: number | null;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiBase = apiBaseUrl();

  private readonly loadingSignal = signal(false);
  readonly loading = computed(() => this.loadingSignal());

  list(filters: InventoryFilters = {}): Observable<InventoryListResponse> {
    const params = this.buildParams(filters);
    return this.http
      .get<InventoryListResponse>(`${this.apiBase}/inventory-dashboard-31477046`, {
        headers: this.buildHeaders(),
        params
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  get(inventoryId: string): Observable<InventoryItem> {
    return this.http
      .get<{ item: InventoryItem }>(`${this.apiBase}/inventory-dashboard/${inventoryId}-31477046`, {
        headers: this.buildHeaders()
      })
      .pipe(
        map((response) => response.item),
        catchError((error) => this.handleError(error))
      );
  }

  create(payload: InventoryPayload): Observable<InventoryItem> {
    this.loadingSignal.set(true);
    return this.http
      .post<{ item: InventoryItem }>(`${this.apiBase}/add-inventory-31477046`, payload, {
        headers: this.buildHeaders()
      })
      .pipe(
        map((response) => response.item),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  update(inventoryId: string, payload: Partial<InventoryPayload>): Observable<InventoryItem> {
    this.loadingSignal.set(true);
    return this.http
      .post<{ item: InventoryItem }>(
        `${this.apiBase}/inventory-dashboard/${inventoryId}/update-31477046`,
        payload,
        {
          headers: this.buildHeaders()
        }
      )
      .pipe(
        map((response) => response.item),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  delete(inventoryId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiBase}/inventory-dashboard/${inventoryId}-31477046`, {
        headers: this.buildHeaders()
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  value(groupBy?: 'category' | 'location'): Observable<InventoryValueResponse> {
    let params = new HttpParams();
    if (groupBy) {
      params = params.set('groupBy', groupBy);
    }
    return this.http
      .get<InventoryValueResponse>(`${this.apiBase}/inventory/value-31477046`, {
        headers: this.buildHeaders(),
        params
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private buildParams(filters: InventoryFilters): HttpParams {
    let params = new HttpParams();

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }
    if (filters.location) {
      params = params.set('location', filters.location);
    }
    if (filters.unit) {
      params = params.set('unit', filters.unit);
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.expiringBy) {
      params = params.set('expiringBy', filters.expiringBy);
    }
    if (filters.lowStockBelow !== undefined && filters.lowStockBelow !== null) {
      params = params.set('lowStockBelow', String(filters.lowStockBelow));
    }

    return params;
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
    const serverError = error.error as { error?: unknown; message?: unknown; details?: unknown };
    const defaultMessage = 'Inventory request failed. Please try again.';
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
