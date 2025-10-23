import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Auth, LoginPayload } from '../auth';

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    password: ['', [Validators.required]]
  });

  submitting = false;
  submitted = false;
  serverError = '';
  infoMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const registeredEmail = params.get('registeredEmail');
      const info = params.get('message');
      const success = params.get('success');
      const error = params.get('error');
      const email = params.get('email');

      this.infoMessage = info || '';
      this.successMessage = success || '';
      this.serverError = error || '';

      if (registeredEmail) {
        this.successMessage = `Registration successful. You can now log in with ${registeredEmail}.`;
        this.form.patchValue({ email: registeredEmail });
      } else if (email) {
        this.form.patchValue({ email });
      }
    });
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  onSubmit(): void {
    this.submitted = true;
    this.serverError = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload = this.form.value as LoginPayload;

    this.auth.login(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/logout']);
      },
      error: (error: Error) => {
        this.submitting = false;
        this.serverError = error.message || 'Invalid credentials. Please try again.';
      }
    });
  }
}
