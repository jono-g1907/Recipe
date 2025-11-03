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

  // T1 Reactive forms keep validation rules next to the inputs for easy updates.
  // T1 Validation hints appear immediately when a rule like the email pattern is broken.
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    password: ['', [Validators.required]]
  });

  submitting = false;
  submitted = false;
  serverError = '';
  infoMessage = '';
  successMessage = '';
  private returnUrl = '/dashboard';

  ngOnInit(): void {
    // T1 Reads any helpful information that was passed to the login screen.
    // T1 Prefills the email after registration so the new user only types their password.
    this.route.queryParamMap.subscribe((params) => {
      const registeredEmail = params.get('registeredEmail');
      const info = params.get('message');
      const success = params.get('success');
      const error = params.get('error');
      const email = params.get('email');
      const redirect = params.get('returnUrl');

      this.infoMessage = info || '';
      this.successMessage = success || '';
      this.serverError = error || '';

      if (registeredEmail) {
        // T1 Registration redirect: congratulate the user and copy over their email.
        this.successMessage = `Registration successful. You can now log in with ${registeredEmail}.`;
        this.form.patchValue({ email: registeredEmail });
      } else if (email) {
        // T1 Carry over any email provided elsewhere so the user avoids retyping.
        this.form.patchValue({ email });
      }

      if (redirect) {
        // T1 After logging in we send the user back to the protected area they wanted.
        this.returnUrl = redirect;
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
      // T1 Highlight all the fields so the user can see what needs fixing.
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload = this.form.value as LoginPayload;

    this.auth.login(payload).subscribe({
      next: () => {
        this.submitting = false;
        // T1 Successful login: head straight to the dashboard or the original destination.
        this.router.navigateByUrl(this.returnUrl || '/dashboard');
      },
      error: (error: Error) => {
        this.submitting = false;
        // T1 Display the service message so the user understands why the login failed.
        this.serverError = error.message || 'Invalid credentials. Please try again.';
      }
    });
  }
}
