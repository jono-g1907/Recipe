// T5 Import Angular helpers so the header can react to user interaction and routing state.
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
  // T5 The parent passes in the app title so the header can display the right branding.
  @Input() appTitle = '';
  // T5 The current user is optional, letting the header switch menus depending on sign-in status.
  @Input() user: AuthUser | null = null;

  // T5 This static logo path keeps the image consistent across the application.
  readonly logoUrl = 'icons/icon-72x72.png';

  // T5 Signals track whether the navigation drawer or user menu should be visible.
  protected readonly isNavOpen = signal(false);
  protected readonly isMenuOpen = signal(false);

  // T5 Compute initials from the name so the avatar always shows a friendly shorthand.
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

  // T5 Flips the navigation drawer open or closed when the toggler is pressed.
  toggleNavigation(): void {
    this.isNavOpen.update((open) => !open);
  }

  // T5 Toggles the personal account menu for quick profile and logout actions.
  toggleUserMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  // T5 Closes both overlays so navigating between pages leaves the header neat.
  closeOverlays(): void {
    this.isNavOpen.set(false);
    this.isMenuOpen.set(false);
  }
}
