import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth, AuthUser } from './auth/auth';
import { HeaderComponent } from './layout/header';
import { FooterComponent } from './layout/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();

  protected readonly title = signal('Recipe Hub');
  private readonly userSignal = signal<AuthUser | null>(this.auth.currentUser);
  protected readonly navigationError = signal('');
  readonly currentUser = computed(() => this.userSignal());

  ngOnInit(): void {
    const authSubscription = this.auth.currentUser$.subscribe((user) => {
      this.userSignal.set(user);
    });

    const routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationError) {
        const message = event.error?.message || 'Something went wrong while navigating.';
        this.navigationError.set(message);
      }

      if (event instanceof NavigationEnd) {
        this.navigationError.set('');
      }
    });

    this.subscriptions.add(authSubscription);
    this.subscriptions.add(routerSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  dismissNavigationError(): void {
    this.navigationError.set('');
  }
}
