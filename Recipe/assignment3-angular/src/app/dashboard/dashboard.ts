// T2 Bringing in Angular helpers and pipes that let the dashboard display data like currency and react to live updates.
import { AsyncPipe, CommonModule, CurrencyPipe, NgClass } from '@angular/common';
// T2 Using Angular core features to create the component, track lifecycle events, and manage reactive values.
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
// T2 Accessing navigation tools so we can guide users between pages such as login or inventory.
import { Router, RouterLink } from '@angular/router';
// T2 Subscription keeps track of ongoing data streams so we can stop listening when the dashboard closes.
import { Subscription } from 'rxjs';
// T2 Auth services let us show the logged-in user's information and respond when it changes.
import { Auth, AuthUser } from '../auth/auth';
// T2 Dashboard service taps into the backend to retrieve the statistics that power the cards.
import { DashboardService } from './dashboard.service';

interface QuickAction {
  label: string;
  description: string;
  link: string;
  variant: 'success' | 'info' | 'warning';
  useRouter?: boolean;
}

// T2 Component decorator defines how Angular should build, style, and recognize this dashboard screen.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe, NgClass, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  // T2 Injecting the authentication, router, and stats services so this class can use them without manual wiring.
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);

  // T2 Exposing the live statistics stream so the template can automatically refresh every update cycle.
  readonly stats$ = this.dashboardService.stats$;

  // T2 Student information and custom logo paths personalize the dashboard for the course submission.
  readonly studentName = 'Jonathan Gan';
  readonly studentId = '31477046';
  readonly logoUrl = 'assets/dashboard-logo.svg';

  // T2 Signals keep track of the active user and let other values respond instantly when the user changes.
  private readonly userSignal = signal<AuthUser | null>(this.auth.currentUser);
  readonly user = computed(() => this.userSignal());

  // T2 Welcome message signal stores the friendly greeting shown at the top of the dashboard.
  welcomeMessage = signal('');

  // T2 Subscription reference lets us cleanly stop listening to authentication updates when leaving the page.
  private subscription?: Subscription;

  ngOnInit(): void {
    // T2 When the dashboard loads, start watching the authentication stream for user updates in real time.
    this.subscription = this.auth.currentUser$.subscribe((user) => {
      // T2 Keep the reactive user signal in sync with the latest login details from the backend.
      this.userSignal.set(user);
      if (!user) {
        // T2 If nobody is logged in, show a helpful prompt and direct them back to the login page.
        this.welcomeMessage.set('Welcome! Please log in to access your dashboard.');
        this.router.navigate(['/login']);
      } else {
        // T2 Craft a friendly greeting tailored to the time of day and the user's full name.
        const greeting = this.buildGreeting(user.fullname);
        this.welcomeMessage.set(`${greeting}, ${user.fullname}! Here's a look at your kitchen hub.`);
      }
    });
  }

  ngOnDestroy(): void {
    // T2 Stop listening to the authentication stream so the component frees resources when it closes.
    this.subscription?.unsubscribe();
  }

  get quickActions(): QuickAction[] {
    // T2 Provide handy shortcuts so users can jump straight to popular actions from the dashboard.
    return [
      {
        label: 'Create Recipe',
        description: 'Add a brand new recipe to the collection.',
        link: '/add-recipe-31477046',
        variant: 'success',
        useRouter: true
      },
      {
        label: 'Inventory Dashboard',
        description: 'Review and update shared inventory items.',
        link: '/inventory-dashboard-31477046',
        variant: 'info',
        useRouter: true
      },
      {
        label: 'Sign Out',
        description: 'Finish your session securely.',
        link: '/logout',
        variant: 'warning',
        useRouter: true
      }
    ];
  }

  private buildGreeting(fullname: string): string {
    // T2 Check the current hour so the dashboard can greet the user appropriately.
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  }
}
