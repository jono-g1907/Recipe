// T2 Importing Angular and RxJS utilities so we can request data and refresh it on a schedule.
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, switchMap, timer } from 'rxjs';
// T2 Centralized API URL keeps the service connected to the same backend endpoint as the rest of the app.
import { DASHBOARD_STATS_URL } from '../shared/api-config';

// T2 Interface describes the stats shape so TypeScript can guide us when using the live data.
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

// T2 Injectable decorator makes Angular create one shared instance of this service for the whole app.
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // T2 HttpClient handles communication with the backend, and the stored URL points to the stats endpoint.
  private readonly http = inject(HttpClient);
  private readonly statsUrl = DASHBOARD_STATS_URL;

  // T2 Refresh interval controls how often we pull new dashboard data; here it is every 30 seconds.
  private readonly refreshInterval = 30000; // 30 seconds

  // T2 stats$ sets up a repeating timer that fetches fresh numbers and shares the latest result with all listeners.
  readonly stats$: Observable<DashboardStats> = timer(0, this.refreshInterval).pipe(
    switchMap(() => this.fetchStats()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private fetchStats(): Observable<DashboardStats> {
    // T2 Call the backend for statistics, validating the response and falling back to zeros if anything fails.
    return this.http.get<DashboardStatsResponse>(this.statsUrl).pipe(
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
