import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, RegisterPayload } from '../auth';

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}:;"'<>?,.\/]).{8,}$/;
const NAME_PATTERN = /^[A-Za-z\s\-']{2,100}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TitleCasePipe],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly roles = ['admin', 'chef', 'manager'];

  readonly registerForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
      fullname: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      role: ['chef', [Validators.required]],
      phone: ['', [Validators.required, this.phoneValidator()]]
    },
    { validators: this.passwordsMatchValidator() }
  );

  submitting = false;
  submitted = false;
  serverError = '';

  ngOnInit(): void {
    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.registerForm.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  get email(): AbstractControl | null {
    return this.registerForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.registerForm.get('password');
  }

  get confirmPassword(): AbstractControl | null {
    return this.registerForm.get('confirmPassword');
  }

  get fullname(): AbstractControl | null {
    return this.registerForm.get('fullname');
  }

  get roleControl(): AbstractControl | null {
    return this.registerForm.get('role');
  }

  get phone(): AbstractControl | null {
    return this.registerForm.get('phone');
  }

  onSubmit(): void {
    this.submitted = true;
    this.serverError = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload = this.registerForm.value as RegisterPayload;

    this.auth.register(payload).subscribe({
      next: (user) => {
        this.submitting = false;
        this.router.navigate(['/login'], { queryParams: { registeredEmail: user.email } });
      },
      error: (error: Error) => {
        this.submitting = false;
        this.serverError = error.message || 'Registration failed. Please try again.';
      }
    });
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const passwordValue = group.get('password')?.value;
      const confirmValue = group.get('confirmPassword')?.value;
      if (!passwordValue || !confirmValue) {
        return null;
      }
      return passwordValue === confirmValue ? null : { passwordMismatch: true };
    };
  }

  private phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      if (!value) {
        return null;
      }
      return this.isAustralianPhoneNumber(value) ? null : { invalidPhone: true };
    };
  }

  private stripPhoneFormatting(value: string): string {
    return (value || '').replace(/[\s()-]/g, '');
  }

  private isAustralianPhoneNumber(value: string): boolean {
    const cleaned = this.stripPhoneFormatting(value);
    if (!cleaned) {
      return false;
    }
    if (cleaned.indexOf('+') === 0) {
      if (cleaned.indexOf('+61') !== 0) {
        return false;
      }
      const rest = cleaned.slice(3);
      return rest.length === 9 && /^[2-478]\d{8}$/.test(rest);
    }
    if (cleaned.indexOf('0') === 0) {
      return cleaned.length === 10 && /^[2-478]\d{9}$/.test(cleaned);
    }
    return false;
  }
}
