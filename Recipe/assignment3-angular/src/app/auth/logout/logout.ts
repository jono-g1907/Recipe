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
    if (!this.auth.currentUser) {
      this.errorMessage = 'You are not logged in.';
    }
  }

  get user() {
    return this.auth.currentUser;
  }

  onLogout(): void {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.errorMessage = 'You are not logged in.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.logout(currentUser.userId).subscribe({
      next: (message) => {
        this.submitting = false;
        this.successMessage = message;
        this.router.navigate(['/login'], {
          queryParams: { success: message, email: currentUser.email }
        });
      },
      error: (error: Error) => {
        this.submitting = false;
        this.errorMessage = error.message || 'Unable to log out at the moment.';
      }
    });
  }
}
