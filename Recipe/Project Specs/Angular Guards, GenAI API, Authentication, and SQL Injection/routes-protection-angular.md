# Routes Protection in Angular

In Angular, **route guards** are functions that control whether a user can navigate to or leave a particular route. They are like checkpoints that manage whether a user can access specific routes. Common examples of using route guards include authentication and access control.

---

## CanActivate

Determines if a route can be activated.

**Default arguments:**

- `route: ActivatedRouteSnapshot` — Contains information about the route being activated
- `state: RouterStateSnapshot` — Contains the router's current state

```ts
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};
```

---

## CanActivateChild

Determines whether a user can access **child routes** of a particular parent route. This is useful when you want to protect an entire section of nested routes. In other words, `canActivateChild` runs for **all** children. If there is a child component with another child component underneath it, `canActivateChild` will run once for both components.

```ts
export const adminChildGuard: CanActivateChildFn = (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  return authService.hasRole('admin');
};
```

---

## CanDeactivate

Determines whether a user can **leave** a route. A common scenario is preventing navigation away from **unsaved forms**.

```ts
export const unsavedChangesGuard: CanDeactivateFn<FormComponent> = (component: FormComponent, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState: RouterStateSnapshot) => {
  return component.hasUnsavedChanges()
    ? confirm('You have unsaved changes. Are you sure you want to leave?')
    : true;
};
```

---

## CanMatch

Determines whether a route can be **matched** during path matching. Unlike other guards, rejection **falls through** to try other matching routes instead of blocking navigation entirely. This can be useful for feature flags, A/B testing, or conditional route loading.

```ts
export const featureToggleGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const featureService = inject(FeatureService);
  return featureService.isFeatureEnabled('newDashboard');
};
```

---

## Generate a Guard with Angular CLI

You need to have a working Angular project before trying the route guard. You can use Week 10 lecture sample code as a starting point.

Generate a guard:

```bash
ng generate guard authGuard
```

Modify the `auth-guard.ts` file:

```ts
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);

  //Not logged in → send to login with returnUrl
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  // Authorized → allow through
  return true;
};
```

**Notes:**  
- **line 5:** Instead of creating a class-based guard, you just export a function that runs before a route is activated.  
- **line 6:** Angular’s `inject()` function lets you pull a service into this guard function (no constructor needed).  
- **line 10:** It builds a redirect to `/login` and appends the attempted URL as a `returnUrl` query parameter. This lets Angular send the user to the login page, then navigate them back to their original destination after successful login.

---

## AuthService

`AuthService` is a service that communicates with the backend to log in, sign up, and maintain the state of the current user.

Create it:

```bash
ng generate service authService
```

Modify the `auth-service.ts` file:

```ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _isLoggedIn = false;

  isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  login() {
    this._isLoggedIn = true;
  }
}
```

---

## Login Component

Create a component called `login` if you haven't.

Modify the `login.ts` file:

```ts
import { Component } from '@angular/core';
import { AuthService } from '../auth-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
constructor(
    public auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  login() {
    this.auth.login();

    // If returnUrl was set in guard, redirect back
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.router.navigateByUrl(returnUrl);
  }
}
```

And the `login.html` file:

```html
<!-- login.html -->
<h2>Login Page</h2>

<button (click)="login()">Login</button>

@if(auth.isLoggedIn()){
<p>You are logged in!</p>
}
```

---

## Applying the Guard to Routes

To use the guard, add it to your route configuration in `app.routes.ts` file:

```ts
const routes: Routes = [
  ...
  {path: "add-order", component: AddOrder, canActivate: [authGuard]},
  ...
];
```

This ensures that the **Add Order** component is only accessible if the `AuthGuard` allows it, and shows the login page if the user hasn't logged in.
