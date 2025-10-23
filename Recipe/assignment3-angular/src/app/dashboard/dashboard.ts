import { AsyncPipe, CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth, AuthUser } from '../auth/auth';
import { DashboardService } from './dashboard.service';

interface QuickAction {
  label: string;
  description: string;
  link: string;
  variant: 'success' | 'info' | 'warning';
  useRouter?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe, NgClass, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);

  readonly stats$ = this.dashboardService.stats$;

  readonly studentName = 'Jonathan Gan';
  readonly studentId = '31477046';
  readonly logoUrl = 'assets/dashboard-logo.svg';

  private readonly userSignal = signal<AuthUser | null>(this.auth.currentUser);
  readonly user = computed(() => this.userSignal());

  welcomeMessage = signal('');

  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe((user) => {
      this.userSignal.set(user);
      if (!user) {
        this.welcomeMessage.set('Welcome! Please log in to access your dashboard.');
        this.router.navigate(['/login']);
      } else {
        const greeting = this.buildGreeting(user.fullname);
        this.welcomeMessage.set(`${greeting}, ${user.fullname}! Here's a look at your kitchen hub.`);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get quickActions(): QuickAction[] {
    return [
      {
        label: 'Create Recipe',
        description: 'Add a brand new recipe to the collection.',
        link: '/add-recipe-31477046',
        variant: 'success'
      },
      {
        label: 'Inventory Dashboard',
        description: 'Review and update shared inventory items.',
        link: '/inventory-dashboard-31477046',
        variant: 'info'
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
