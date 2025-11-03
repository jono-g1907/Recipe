import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../auth';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './logout.html',
  styleUrl: './logout.css'
})
export class Logout implements OnInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  successMessage = '';
  errorMessage = '';
  submitting = false;

  ngOnInit(): void {
    // T1 If someone visits this page without being logged in, let them know right
    // T1 away instead of showing the logout button.
    if (!this.auth.currentUser) {
      this.errorMessage = 'You are not logged in.';
    }
  }

  get user() {
    // T1 Convenience getter so the template can show the user's name and email.
    return this.auth.currentUser;
  }

  onLogout(): void {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      // T1 Handles the edge case where the session expired between page load and
      // T1 button click.
      this.errorMessage = 'You are not logged in.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.logout(currentUser.userId).subscribe({
      next: (message) => {
        this.submitting = false;
        // T1 After logging out we display the confirmation locally and then route
        // T1 back to the login page with a friendly success banner.
        this.successMessage = message;
        this.router.navigate(['/login'], {
          queryParams: { success: message, email: currentUser.email }
        });
      },
      error: (error: Error) => {
        this.submitting = false;
        // T1 Pass the detailed error message back to the UI so the user knows if
        // T1 they should try again or contact support.
        this.errorMessage = error.message || 'Unable to log out at the moment.';
      }
    });
  }
}
