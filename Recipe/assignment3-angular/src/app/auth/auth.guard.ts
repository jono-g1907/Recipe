import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Auth } from './auth';

function redirectToLogin(state: RouterStateSnapshot, router: Router): UrlTree {
  // T6 We craft a link to the login screen and remember where the user wanted to go.
  return router.createUrlTree(['/login'], {
    queryParams: {
      message: 'Please log in to continue.',
      returnUrl: state.url || undefined
    }
  });
}

function isAuthenticated(auth: Auth): boolean {
  // T6 Turning the stored `isLoggedIn` flag into a simple true/false keeps checks clear.
  const user = auth.currentUser;
  return Boolean(user && user.isLoggedIn);
}

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (isAuthenticated(auth)) {
    // T6 When someone is already signed in, we simply let them reach the page they chose.
    return true;
  }

  // T6 If no session exists, we guide them to login and include a helpful message.
  return redirectToLogin(state, router);
};

export const authChildGuard: CanActivateChildFn = (route, state) => {
  // T6 Nested pages reuse the same guard so every dashboard view stays protected.
  return authGuard(route, state);
};
