import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Auth } from './auth';

function redirectToLogin(state: RouterStateSnapshot, router: Router): UrlTree {
  return router.createUrlTree(['/login'], {
    queryParams: {
      message: 'Please log in to continue.',
      returnUrl: state.url || undefined
    }
  });
}

function isAuthenticated(auth: Auth): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.isLoggedIn);
}

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (isAuthenticated(auth)) {
    return true;
  }

  return redirectToLogin(state, router);
};

export const authChildGuard: CanActivateChildFn = (route, state) => {
  return authGuard(route, state);
};
