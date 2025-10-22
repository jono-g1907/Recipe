# Development Technology Usage Policy

## Assignment Overview
Building upon the current MongoDB backend, you will develop a modern, responsive Angular frontend that provides a complete user interface for the Recipe-Inventory Management System. This new update focuses on Angular framework, Progressive Web App (PWA) development, and seamless API integration with the existing backend.

## What you CAN and CANNOT use when developing the Angular frontend application

### You CAN Use
- **Angular 20+ for the frontend framework.**  
  This is mandatory for the client-side implementation with standalone components.

- **Existing Backend API integration**  
  Must connect to the existing MongoDB-powered Express.js backend.

- **TypeScript for Angular development**  
  Required for Angular applications with proper typing.

- **Bootstrap for responsive design and styling**  
  Use for layout and component styling in Angular components.

- **Angular built-in modules (FormsModule, HttpClientModule, RouterModule, etc.)**  
  Standard Angular modules for forms, HTTP, routing, and other core functionality.

- **RxJS Observables for reactive programming**  
  Built into Angular for handling asynchronous operations and real-time updates.

- **Code reuse from existing app (HTML structures, validation patterns, CSS)**  
  Required to adapt EJS templates to Angular components.

### You CANNOT Use
- **Other frontend frameworks (React, Vue.js, Svelte, etc.)**  
  Angular is the required framework.

- **Server-side rendering frameworks (EJS, Handlebars, Pug, etc.)**  
  This is a client-side Angular application, not server-rendered. Angular SSR is not allowed.

- **External UI component libraries (Angular Material, PrimeNG, etc.)**  
  Build components from scratch using Bootstrap for styling.

- **Pre-made Angular templates or boilerplates**  
  Must be built from scratch.

- **Alternative HTTP clients (Axios, fetch API directly, etc.)**  
  Must use Angular’s HttpClient for API communication for all core tasks.

- **Non-Angular PWA implementations (Workbox directly, custom service workers, etc.)**  
  Use Angular’s PWA schematic and built-in service worker.

---

**ENSURE** that these rules are not violated. Any usage of code/methods/libraries/modules outside of the “Project Scope” folder materials for the core tasks **MUST** be avoided.

Must reuse and adapt code from the current implementation for your Angular components. This includes HTML structures from your EJS templates, form validation patterns, and any CSS styling.

## Angular Framework Requirements
The application must be built using Angular 20+ with modern development practices including standalone components, forms, observables, and TypeScript. The application should demonstrate mastery of Angular's component architecture, services, dependency injection, and routing system.

## Backend API Integration
**CRITICAL:** The Angular frontend must integrate with the currently implemented backend API. All CRUD operations, authentication, and data management must be handled through HTTP services communicating with the MongoDB-powered Express.js backend. **Remember to include the ID: 31477046 in API endpoint URLs** as implemented in the current implementation.

> **Note:** You are allowed to make modifications to your current backend endpoints to better meet the requirements of this Angular frontend, provided that the core functionality and data structures remain intact.
