import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, switchMap, timer } from 'rxjs';
import { getDashboardStatsUrl } from '../shared/api-config';

export interface DashboardStats {
  recipeCount: number;
  inventoryCount: number;
  userCount: number;
  cuisineCount: number;
  inventoryValue: number;
}

interface DashboardStatsResponse {
  success: boolean;
  stats?: DashboardStats;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  private readonly refreshInterval = 30000; // 30 seconds

  readonly stats$: Observable<DashboardStats> = timer(0, this.refreshInterval).pipe(
    switchMap(() => this.fetchStats()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private fetchStats(): Observable<DashboardStats> {
    const url = getDashboardStatsUrl();

    return this.http.get<DashboardStatsResponse>(url).pipe(
      map((response) => {
        if (!response.success || !response.stats) {
          throw new Error(response.message || 'Unable to load dashboard statistics.');
        }
        return response.stats;
      }),
      catchError(() =>
        of({ recipeCount: 0, inventoryCount: 0, userCount: 0, cuisineCount: 0, inventoryValue: 0 })
      )
    );
  }
}
