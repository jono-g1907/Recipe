import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Auth } from './auth';

function redirectToLogin(state: RouterStateSnapshot, router: Router): UrlTree {
  // T1 Builds a link to the login page and includes the original destination so we
  // T1 can send the user right back after successful authentication.
  return router.createUrlTree(['/login'], {
    queryParams: {
      message: 'Please log in to continue.',
      returnUrl: state.url || undefined
    }
  });
}

function isAuthenticated(auth: Auth): boolean {
  // T1 The backend sets `isLoggedIn` on the user object. Converting it to a boolean
  // T1 keeps the guard logic simple and readable.
  const user = auth.currentUser;
  return Boolean(user && user.isLoggedIn);
}

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (isAuthenticated(auth)) {
    // T1 Already logged in—allow the router to continue to the requested page.
    return true;
  }

  // T1 Not authenticated—redirect to the login screen with context.
  return redirectToLogin(state, router);
};

export const authChildGuard: CanActivateChildFn = (route, state) => {
  // T1 Child routes share the same protection rules, so we reuse the main guard.
  return authGuard(route, state);
};
