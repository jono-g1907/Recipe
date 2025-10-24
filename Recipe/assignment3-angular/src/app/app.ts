import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  private subscription?: Subscription;

  protected readonly title = signal('Recipe Hub');
  private readonly userSignal = signal<AuthUser | null>(this.auth.currentUser);
  readonly currentUser = computed(() => this.userSignal());

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe((user) => {
      this.userSignal.set(user);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
