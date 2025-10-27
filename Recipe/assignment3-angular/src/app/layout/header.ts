import { Component, Input, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthUser } from '../auth/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  @Input() appTitle = '';
  @Input() user: AuthUser | null = null;

  readonly logoUrl = 'icons/icon-72x72.png';

  protected readonly isNavOpen = signal(false);
  protected readonly isMenuOpen = signal(false);

  readonly userInitials = computed(() => {
    if (!this.user?.fullname) {
      return '';
    }

    return this.user.fullname
      .split(' ')
      .filter(Boolean)
      .map((name) => name.charAt(0).toUpperCase())
      .join('');
  });

  toggleNavigation(): void {
    this.isNavOpen.update((open) => !open);
  }

  toggleUserMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeOverlays(): void {
    this.isNavOpen.set(false);
    this.isMenuOpen.set(false);
  }
}
