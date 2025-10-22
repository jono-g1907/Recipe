# Adding a New Service

An angular service is an object that gets instantiated only once during the lifetime of an application. It contains methods that maintain data throughout the life of an application. The main benefit of having a service is to organize and share methods, models, or data with different components of an Angular application. We will add a service that is responsible for the communication with the RESTFul server. Again, the CLI command will be used to generate a new service:

```bash
ng generate service database
# or
ng g s database
```

A new file `database.service.ts` has been added to the project and it contains:

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor() { }
}
```

`@Injectable` is a marker metadata that marks a class as available to Injector for creation. In order to make this service available to the whole application, we will keep the default value of the property `proividedIn` as root. But, if we need to be allocated to a certain module, then we need to update it. All the functionalities that will be provided by this service will be coded inside the class `DatabaseService`. The constructor is used to provide references to dependencies and can also be used to initialize the process of the service. The last step is to tell the app module that this new service should be available application-wide. To do so, add `DatabaseService` to the list of providers in `app.config.ts`.

```typescript
providers: [DatabaseService],
```

---

## Observables and Subscribe

To handle asynchronous operations, Angular uses observables. So, what are observables? Observables are declarative— that is, you define a function for publishing values, but it is not executed until a consumer subscribes to it. The subscribed consumer then receives notifications until the function completes or until they unsubscribe. To execute the observable and begin receiving notifications, you call its `subscribe()` method, passing an observer (i.e., callback function). This JavaScript object defines the handlers for the notifications you receive. Therefore, all the HTTP functions (`get()`, `put()`, `post()`, and `delete()`) return an observable output and our component has to call their `subsucribe()` methods to get them executed.

**Source and More Details:** <https://angular.io/guide/observables>

---

## Inject the Database Service to the Actor Component

As the actor component must perform the CRUD operations with the RESTFul server, we must provide this service. First, import the service:

```typescript
import { DatabaseService } from "../database.service";
```

Second, inject. Similar to injecting the HTTP service into the database service, we will use the constructor to provide a reference to the database service: 

```typescript
constructor(private dbService: DatabaseService) {}
```

Angular will create a new instance of `DatabaseService` (if unavailable) and inject it under the name `dbService`. 

---

## Routing & Navigation

The Angular Router enables navigation from one view to the next as users perform application tasks. In most web applications, users navigate from one page to the next as they perform application tasks. Users can navigate in these ways:

- Entering a URL in the address bar
- Following links
- Clicking buttons

In Angular applications, users can navigate in the same three ways, but they navigate through components (the building blocks of Angular apps). We can navigate because we have the Angular router. The router can interpret a browser URL as an instruction to navigate to a component and pass optional parameters (which contain information) to the component to give it contextual information and help it decide which specific content to present or what it needs to do. We can bind the router to links on a page, and it will navigate to the appropriate component when the user clicks a link. We can navigate imperatively when the user clicks a button, selects from a drop-down, or responds to some other stimulus from any source. The router logs activity in the browser's history, so the back and forward buttons work as well. 

### Router imports

The Angular Router is an optional service that presents a particular component view for a given URL. It is not part of the Angular core. It is in its own library package, `@angular/router`. Import what you need from it as you would from any other Angular package.

```typescript
import { RouterModule, Routes } from '@angular/router';
```

### Router Configuration

A routed Angular application has one singleton instance of the Router service. When the browser's URL changes, that router looks for a corresponding `Route` to determine the component to display. A router has no routes until you configure it. The following example creates four route definitions for the array of routes in the `app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: "listactors", component: ListactorsComponent },
  { path: "addactor", component: AddactorComponent },
  { path: "updateactor", component: UpdateactorComponent },
  { path: "deleteactor", component: DeleteactorComponent },
  { path: "", redirectTo: "/listactors", pathMatch: "full" },
  { path: '**', component: PageNotFoundComponent },  // Wildcard route for a 404 page
];
```

The `appRoutes` array of routes describes how to navigate. Pass it to the `RouterModule.forRoot` method in the module imports to configure the router. Each `Route` maps a URL path to a component. There are no leading slashes in the path. The router parses and builds the final URL for you, allowing you to use both relative and absolute paths when navigating between application views. The empty path in the fifth route represents the default path for the application, the place to go when the path in the URL is empty, as it typically is at the start. This default route redirects to the route for the `/listactors` URL and, therefore, will display the `ListactorsComponent`. It is possible to add `**` path which is a wildcard. The router will select this route if the requested URL doesn't match any paths for routes defined earlier in the configuration. This is useful for displaying a "404 - Not Found" page or redirecting to another route. The order of the routes in the configuration matters and this is by design. The router uses a first-match wins strategy when matching routes, so more specific routes should be placed above less specific routes. In the configuration above, routes with a static path are listed first, followed by an empty path route, that matches the default route. The wildcard route comes last because it matches every URL and should be selected only if no other routes are matched first.

### Router outlet

Given this configuration, when the browser URL for this application becomes `/listactors`, the router matches that URL to the route path `/listactors` and displays the `ListactorsComponent` after a `RouterOutlet` that you've placed in the host view's HTML.

```html
<router-outlet></router-outlet>
<!-- Routed views go here -->
```

### Router links

Now you have routes configured and a place to render them, but how do you navigate? The URL could arrive directly from the browser address bar. But most of the time, you navigate as a result of some user action, such as the click of an anchor tag. Consider the following template:

```html
<a class="nav-link" routerLink="/listactors" routerLinkActive="active">List </a>
```

The `RouterLink` directives on the anchor tags give the router control over those elements. The navigation paths are fixed, so you can assign a string to the `routerLink` (a "one-time" binding). Had the navigation path been more dynamic, you could have bound to a template expression that returned an array of route link parameters (the link parameters array). The router resolves that array into a complete URL. The `RouterLinkActive` directive on each anchor tag helps visually distinguish the anchor for the currently selected "active" route. The router adds the `active` CSS class to the element when the associated `RouterLink` becomes active. You can add this directive to the anchor or to its parent element.

### Base Ref

Most routing applications should add a `<base>` element to the `index.html` as the first child in the `<head>` tag to tell the router how to compose navigation URLs. As the app folder is the application root, set the `href` value exactly to `/`. This line should be added to `/src/index.html`:

```html
<base href="/">
```
