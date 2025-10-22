# Angular Modals Tutorial
## Building Simple Confirmation Dialogs with ng-bootstrap

This tutorial teaches students how to implement modal dialogs in Angular applications using **ng-bootstrap**. Modals are essential UI components for creating interactive user experiences, particularly for confirmation dialogs, forms, and user input collection.

---

## Table of Contents
- [Tutorial Overview](#tutorial-overview)
- [What is ng-bootstrap?](#what-is-ng-bootstrap)
- [1. Setup and Installation](#1-setup-and-installation)
  - [Step 1: Create new Angular 20+ project and install dependencies](#step-1-create-new-angular-20-project-and-install-dependencies)
  - [Step 2: Update `main.ts` for standalone components](#step-2-update-maints-for-standalone-components)
  - [Step 3: Create `app.config.ts` for application configuration](#step-3-create-appconfigts-for-application-configuration)
- [2. Simple Root Component](#2-simple-root-component)
  - [Step 4: Create standalone `app.ts` (following Angular style guide)](#step-4-create-standalone-appts-following-angular-style-guide)
  - [Step 5: Create the HTML template (`app.html`)](#step-5-create-the-html-template-apphtml)
  - [Step 6: Configure `angular.json` for Bootstrap](#step-6-configure-angularjson-for-bootstrap)
  - [Step 7: Add basic styling (`app.css`)](#step-7-add-basic-styling-appcss)
- [3. Understanding the Code](#3-understanding-the-code)
- [4. Key Features Demonstrated](#4-key-features-demonstrated)
- [5. Running the Tutorial](#5-running-the-tutorial)
- [6. Customization Options](#6-customization-options)

---

## Tutorial Overview

**Purpose of This Tutorial:**  
This tutorial teaches students how to implement modal dialogs in Angular applications using ng-bootstrap. Modals are essential UI components for creating interactive user experiences, particularly for confirmation dialogs, forms, and user input collection.

**What You Will Learn:**
- **Modal Fundamentals:** Understanding what modals are and when to use them
- **ng-bootstrap Integration:** How to set up and use ng-bootstrap modal components
- **Three Modal Types:** Yes/No confirmations, input dialogs, and form modals
- **Modern Angular Patterns:** Using standalone components and latest style guide practices
- **User Experience:** Creating accessible, responsive, and user-friendly modal interactions

**Real-World Applications:**
- Confirmation dialogs for delete operations
- User registration and login forms
- Data collection and editing interfaces
- Settings and configuration panels
- Alert and notification systems

---

## What is ng-bootstrap?

**ng-bootstrap** is the official Angular library that provides Bootstrap components specifically designed for Angular applications. Unlike regular Bootstrap which requires jQuery, ng-bootstrap is built from the ground up using only Angular and Bootstrap CSS. This means you get all the power and styling of Bootstrap components (modals, dropdowns, tooltips, etc.) but with Angular's reactive approach and **without any jQuery dependencies**. It’s maintained by the Angular community and provides type-safe, accessible, and performant components that integrate seamlessly with Angular’s change detection and form systems.

---

## 1. Setup and Installation

### Step 1: Create new Angular 20+ project and install dependencies

```bash
# Create new Angular 20+ project
ng new angular-modals-app --standalone --style=css

# Navigate to project
cd angular-modals-app

# Install ng-bootstrap (latest version compatible with Angular 20+)
npm install @ng-bootstrap/ng-bootstrap@latest

# Install Bootstrap 5 (required for styling)
npm install bootstrap@latest
```

**Code Explanation:**
- `--standalone` flag: Creates project with standalone components by default (Angular modern approach)
- **ng-bootstrap**: The Angular-specific Bootstrap component library
- **Bootstrap CSS**: Required for styling the modal components and layout
- `@latest`: Ensures you get the most current version compatible with your Angular version

### Step 2: Update `main.ts` for standalone components

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

**Code Explanation:**
- `bootstrapApplication()`: Modern Angular way to start apps with standalone components (replaces NgModule approach)
- `App` import: Clean import path without `.component` suffix (follows Angular style guide)
- `appConfig`: Contains all application-level configuration including providers
- Error handling: `.catch()` ensures any startup errors are logged to console

### Step 3: Create `app.config.ts` for application configuration

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
```

**Code Explanation:**
- **ApplicationConfig**: Type-safe configuration object for application providers
- `provideBrowserGlobalErrorListeners()`: Sets up global error handling for the application
- `provideZoneChangeDetection()`: Configures change detection with event coalescing for better performance
- `provideRouter()`: Sets up routing configuration (empty routes array by default)
- **Separation of concerns**: Keeps configuration separate from bootstrap logic

---

## 2. Simple Root Component

### Step 4: Create standalone `app.ts` (following Angular style guide)

```ts
import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Angular 20+ Modals Tutorial';
  userName = '';
  userEmail = '';
  userAge = 0;

  private modalService = inject(NgbModal);

  openConfirmationDialog(content: any) {
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title'
    });

    modalRef.result.then((result) => {
      if (result === 'yes') {
        alert('You clicked Yes!');
      } else {
        alert('You clicked No!');
      }
    }).catch((error) => {
      console.log('Modal dismissed:', error);
    });
  }

  openNameDialog(content: any) {
    this.userName = '';
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title'
    });

    modalRef.result.then((result) => {
      if (result === 'save' && this.userName.trim()) {
        alert(\`Hello, \${this.userName}!\`);
      }
    }).catch((error) => {
      console.log('Modal dismissed:', error);
    });
  }

  openFormDialog(content: any) {
    this.userEmail = '';
    this.userAge = 0;

    const modalRef = this.modalService.open(content, {
      size: 'lg',
      ariaLabelledBy: 'modal-basic-title'
    });

    modalRef.result.then((result) => {
      if (result === 'save') {
        alert(\`User Info - Email: \${this.userEmail}, Age: \${this.userAge}\`);
      }
    }).catch((error) => {
      console.log('Modal dismissed:', error);
    });
  }

  // Helper method to validate form
  isFormValid(): boolean {
    return this.userEmail.includes('@') && this.userAge > 0;
  }
}
```

**Code Explanation:**
- `@Component` decorator: Defines component metadata including selector, template, and styles
- `standalone: true`: Makes this a standalone component (no NgModule required)
- `imports` array: Declares what modules this component needs (`CommonModule`, `FormsModule`)
- `styleUrl` (singular): Modern Angular style guide uses singular form instead of `styleUrls`
- `inject()` function: Modern dependency injection method preferred over constructor injection
- `modalService.open()`: Opens modal with template reference and configuration options
- `modalRef.result`: Returns a Promise that resolves when modal closes with data or rejects when dismissed
- `ariaLabelledBy`: Important for accessibility — connects modal title to screen readers
- `size: 'lg'`: Bootstrap modal size options (`sm`, `md`, `lg`, `xl`)

### Step 5: Create the HTML template (`app.html`)

```html
<div class="container mt-4">
  <h1 class="text-center mb-4">{{ title }}</h1>

  <div class="row justify-content-center">
    <div class="col-md-8">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Modal Examples</h5>
          <p class="card-text">Click the buttons below to open different types of confirmation dialogs.</p>

          <div class="d-grid gap-2 d-md-block">
            <button type="button" class="btn btn-primary me-2" (click)="openConfirmationDialog(confirmationModal)">
              Yes/No Confirmation
            </button>
            <button type="button" class="btn btn-success me-2" (click)="openNameDialog(nameModal)">
              Enter Name Dialog
            </button>
            <button type="button" class="btn btn-info" (click)="openFormDialog(formModal)">
              User Form Dialog
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<ng-template #confirmationModal let-modal>
  <div class="modal-header">
    <h4 class="modal-title" id="modal-basic-title">Confirmation</h4>
    <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss('Cross click')"></button>
  </div>
  <div class="modal-body">
    <p>Are you sure you want to proceed with this action?</p>
    <p><small class="text-muted">This action cannot be undone.</small></p>
  </div>
  <div class="modal-footer">
    <button type="button" class="btn btn-danger" (click)="modal.close('yes')">Yes, Proceed</button>
    <button type="button" class="btn btn-secondary" (click)="modal.close('no')">Cancel</button>
  </div>
</ng-template>

<ng-template #nameModal let-modal>
  <div class="modal-header">
    <h4 class="modal-title" id="modal-basic-title">Enter Your Name</h4>
    <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss('Cross click')"></button>
  </div>
  <div class="modal-body">
    <div class="mb-3">
      <label for="userName" class="form-label">Name:</label>
      <input
        type="text"
        class="form-control"
        id="userName"
        [(ngModel)]="userName"
        placeholder="Enter your name"
        maxlength="50">
    </div>
  </div>
  <div class="modal-footer">
    <button
      type="button"
      class="btn btn-primary"
      (click)="modal.close('save')"
      [disabled]="!userName.trim()">
      Save
    </button>
    <button type="button" class="btn btn-secondary" (click)="modal.dismiss('Cancel click')">Cancel</button>
  </div>
</ng-template>

<ng-template #formModal let-modal>
  <div class="modal-header">
    <h4 class="modal-title" id="modal-basic-title">User Information</h4>
    <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss('Cross click')"></button>
  </div>
  <div class="modal-body">
    <form>
      <div class="mb-3">
        <label for="userEmail" class="form-label">Email:</label>
        <input
          type="email"
          class="form-control"
          id="userEmail"
          [(ngModel)]="userEmail"
          name="userEmail"
          placeholder="Enter your email"
          required>
      </div>
      <div class="mb-3">
        <label for="userAge" class="form-label">Age:</label>
        <input
          type="number"
          class="form-control"
          id="userAge"
          [(ngModel)]="userAge"
          name="userAge"
          min="1"
          max="120"
          placeholder="Enter your age">
      </div>
    </form>
  </div>
  <div class="modal-footer">
    <button
      type="button"
      class="btn btn-primary"
      (click)="modal.close('save')"
      [disabled]="!isFormValid()">
      Save User
    </button>
    <button type="button" class="btn btn-secondary" (click)="modal.dismiss('Cancel click')">Cancel</button>
  </div>
</ng-template>
```

**HTML Template Explanation:**
- **Bootstrap Layout:** Uses `container`, `row`, `col-md-8` for responsive grid layout
- **Template Reference Variables:** `#confirmationModal`, `#nameModal`, `#formModal` create references to modal templates
- **`ng-template`:** Angular’s way to define reusable template blocks that aren’t rendered by default
- **`let-modal`:** Creates local template variable to access modal instance methods (`close`, `dismiss`)
- **Modal Structure:** Header (title + close), body (content), footer (actions)
- **Event Binding:** `(click)` events call component methods and pass template references
- **Two-way Binding:** `[(ngModel)]` creates bidirectional data binding for form inputs
- **Property Binding:** `[disabled]` conditionally disables buttons based on form validation
- **Interpolation:** `{{ title }}` displays component property values in template
- **Bootstrap Classes:** `btn`, `card`, `form-control` provide consistent styling

### Step 6: Configure `angular.json` for Bootstrap

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "src/styles.css"
            ]
          }
        }
      }
    }
  }
}
```

**Configuration Explanation:**
- **`angular.json`:** Angular CLI configuration file that controls build settings
- **`styles` array:** Specifies global CSS files to include in the build
- **Bootstrap CSS path:** Points to installed Bootstrap CSS from `node_modules`
- **Order matters:** Bootstrap comes first, then your custom styles can override
- **Alternative:** You can also add Bootstrap CSS `<link>` in `index.html` instead

### Step 7: Add basic styling (`app.css`)

```css
.modal-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.modal-title {
  color: #495057;
  font-weight: 600;
}

.btn-close {
  filter: none;
}
```

**CSS Explanation:**
- **Component-specific styles:** These styles target modal elements specifically
- **`.modal-header`:** Adds subtle background and border to distinguish header section
- **`.modal-title`:** Enhances title appearance with better color and font weight
- **`.btn-close`:** Removes default filter effects for cleaner close button appearance
- **Bootstrap override:** These styles work with Bootstrap classes to fine-tune appearance
- **Optional customization:** You can add more styles for colors, fonts, animations, etc.

---

## 3. Understanding the Code

- **Standalone Components:** Angular 20+ uses standalone components by default. No `NgModule` is needed — components import what they need directly.
- **Modern Dependency Injection:** Following the Angular style guide, the `NgbModal` service is injected using the `inject()` function instead of constructor injection.
- **Modal Service:** The `NgbModal` service is used to open modals programmatically.
- **Modal Templates:** Each modal is defined using `ng-template` with template reference variables.
- **Modal Structure:**  
  - `modal-header`: Contains title and close button  
  - `modal-body`: Contains main content and form elements  
  - `modal-footer`: Contains action buttons

---

## 4. Key Features Demonstrated

1. **Yes/No Confirmation Dialog:**  
   - Simple confirmation with two buttons  
   - Returns `'yes'` or `'no'` based on user selection  
   - Clean, accessible design  

2. **Enter Name Dialog:**  
   - Single input field with two-way binding  
   - Save button disabled when input is empty  
   - Shows greeting with entered name  

3. **User Form Dialog:**  
   - Multiple form fields with validation  
   - Form validation (email must contain `@`, age > 0)  
   - Larger modal size  
   - Save button disabled until form is valid  

**Angular 20+ Features & Style Guide:**  
- Standalone components (no `NgModule`)  
- Modern `bootstrapApplication`  
- Latest Angular style guide file naming  
- `inject()` function for dependency injection  
- `styleUrl` (singular) instead of `styleUrls`  
- Enhanced accessibility with ARIA labels  
- Latest ng-bootstrap integration

---

## 5. Running the Tutorial

```bash
# Development server
ng serve

# Build for production
ng build

# Run tests
ng test
```

Navigate to **http://localhost:4200** to see your modal examples in action.

> **Note:** Angular 20+ with standalone components provides better tree-shaking and smaller bundle sizes automatically.

---

## 6. Customization Options

ng-bootstrap modals support various configuration options:

```ts
// Modal with custom configuration
const modalRef = this.modalService.open(content, {
  size: 'lg',                     // 'sm', 'lg', 'xl'
  backdrop: 'static',            // Prevent closing on backdrop click
  keyboard: false,               // Prevent ESC key closing
  centered: true,                // Center vertically
  scrollable: true,              // Enable scrolling
  ariaLabelledBy: 'modal-title', // Better accessibility
  windowClass: 'custom-modal'    // Custom CSS classes
});
```

**Customization Options Explanation:**
- **`size`:** Controls modal width — `'sm'` (small), `'lg'` (large), `'xl'` (extra large), or default
- **`backdrop: 'static'`:** Prevents modal from closing when user clicks outside (backdrop area)
- **`keyboard: false`:** Disables closing modal with ESC key (useful for critical confirmations)
- **`centered: true`:** Vertically centers modal in viewport instead of top positioning
- **`scrollable: true`:** Enables scrolling within modal body if content overflows
- **`ariaLabelledBy`:** Links modal to title element for screen readers (accessibility)
- **`windowClass`:** Adds custom CSS classes to modal window for advanced styling
- **`backdropClass` (not shown):** Adds custom classes to modal backdrop
- **`container` (not shown):** Specifies container element for modal placement

---

This tutorial provides a simple, clean foundation for implementing confirmation dialogs in **Angular 20+** applications using **ng-bootstrap**. The standalone component approach makes the code more modular and easier to maintain.
