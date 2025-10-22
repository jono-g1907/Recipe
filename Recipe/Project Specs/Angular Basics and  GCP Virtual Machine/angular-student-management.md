# Angular Student Management Tutorial

Build a single-component Angular application for Student management using modern conventions and standalone components.

## Table of Contents
- [1. Introduction](#1-introduction)
- [2. Prerequisites](#2-prerequisites)
- [3. Angular 20.2.2 Project Setup](#3-angular-2022-project-setup)
- [4. Student Model](#4-student-model)
- [5. Root Component Implementation](#5-root-component-implementation)
- [6. Angular Control Flow (@if, @for)](#6-angular-control-flow-if-for)
- [7. Testing the Application](#7-testing-the-angular-2022-application)
- [9. Deploying to Google Cloud Platform](#9-deploying-to-google-cloud-platform)

---

## 1. Introduction

This tutorial teaches you to build a modern **Angular 20.2.2** application using the latest conventions and features. You'll learn:

- **Standalone Components** – Build apps without `NgModule` (Angular 20.2.2 default)
- **New Naming Conventions** – Updated file naming and component structure
- **Control Flow** – `@if`, `@else`, `@for` directives with latest syntax
- **`inject()` Function** – Modern dependency injection approach
- **Single Component Architecture** – Everything in the root component

**What you'll build:** A single-page student management application using only the root component with a form to add students and a table to display them. This demonstrates modern Angular 20.2.2 best practices.

**Angular 20.2.2 Focus:** This tutorial uses the latest Angular conventions including new naming standards and standalone components.

---

## 2. Prerequisites

Before starting this Angular 20.2.2 tutorial, make sure you have:

- **Node.js v20 or higher** – Required for Angular 20.2.2
- **Angular CLI** – Install the latest: `npm install -g @angular/cli@latest`
- **TypeScript 5.8** – Required for Angular 20.2.2 (installed automatically)
- **Basic understanding** of HTML, CSS, JavaScript/TypeScript
- **Text editor or IDE** (VS Code recommended)

**Angular 20.2.2 Requirements:**

- Node.js: Run `node --version` (must be v20+)
- Angular CLI: Run `ng --version` (should be 20.2.2 or later)
- TypeScript: Automatically managed by Angular CLI

---

## 3. Angular 20.2.2 Project Setup

### 3.1 Create new Angular 20.2.2 project

```bash
ng new student-management --standalone --routing=false --style=css
cd student-management
```

**Angular 20.2.2 defaults:**

- `--standalone`: Uses standalone components (default in Angular 20.2.2)
- `--routing=false`: We don't need routing for single component app
- `--style=css`: Standard CSS styling

### 3.2 Install Bootstrap

```bash
npm install bootstrap
```

### 3.3 Configure Bootstrap in `angular.json`

Add Bootstrap CSS to your `angular.json` file:

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

### 3.4 Angular 20.2.2 Project Structure

With Angular 20.2.2's new naming conventions, your project structure looks like:

```
src/app/
├── app.ts           // Main component (was app.component.ts)
├── app.html         // Template (was app.component.html)
├── app.css          // Styles (was app.component.css)
├── student.ts       // Student model
└── main.ts          // Bootstrap file
```

**New in Angular 20.2.2:** File naming convention simplified – removed `.component` suffix from files. The CLI automatically uses these new conventions.

---

## 4. Student Model

### 4.1 Create Student model with Angular 20.2.2 conventions

Create `src/app/student.ts`:

```ts
export interface Student {
  readonly id: number;
  readonly studentId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly year: number;
}

export function createStudent(
  id: number,
  studentId: string,
  firstName: string,
  lastName: string,
  email: string,
  year: number
): Student {
  return {
    id,
    studentId,
    firstName,
    lastName,
    email,
    year
  };
}

export function getFullName(student: Student): string {
  return `${student.firstName} ${student.lastName}`;
}
```

**Angular 20.2.2 Best Practices:**

- **Interfaces over Classes:** Prefer interfaces for data models
- **Immutable Data:** Use `readonly` properties
- **Factory Functions:** `createStudent()` for object creation
- **Pure Functions:** `getFullName()` as standalone function
- **New File Naming:** `student.ts` instead of `student.model.ts`

---

## 5. Root Component Implementation

### 5.1 Update `app.ts` with Angular 20.2.2 conventions

Update `src/app/app.ts`:

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Student, createStudent, getFullName } from './student';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Basic properties for state management
  protected students: Student[] = [];
  protected newStudent = {
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    year: 1
  };

  // Add student method
  protected addStudent(): void {
    if (this.isValidStudent(this.newStudent)) {
      const newId = this.students.length > 0 
        ? Math.max(...this.students.map(s => s.id)) + 1 
        : 1;
      
      const studentToAdd = createStudent(
        newId,
        this.newStudent.studentId,
        this.newStudent.firstName,
        this.newStudent.lastName,
        this.newStudent.email,
        this.newStudent.year
      );
      
      // Add to students array
      this.students = [...this.students, studentToAdd];
      this.resetForm();
    }
  }

  // Delete student method
  protected deleteStudent(id: number): void {
    this.students = this.students.filter(student => student.id !== id);
  }

  // Utility methods
  protected getFullName = getFullName;
  
  private isValidStudent(student: any): boolean {
    return student.studentId.trim() && 
           student.firstName.trim() && 
           student.lastName.trim() && 
           student.email.trim();
  }

  private resetForm(): void {
    this.newStudent = {
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      year: 1
    };
  }
}
```

**Angular 20.2.2 Features Used:**

- **Standalone Component:** No `NgModule` needed
- **Property Binding:** Standard two-way data binding
- **Protected Members:** Template-only methods marked `protected`
- **`inject()` Pattern:** Modern dependency injection (not shown here)
- **New Naming:** Class named `App` instead of `AppComponent`

### 5.2 Create `app.html` template

Create `src/app/app.html`:

```html
<div class="container mt-4">
  <div class="row justify-content-center">
    <div class="col-md-8">
      <h1 class="text-center mb-4">
        <span class="angular-highlight">Angular 20.2.2</span> Student Management
      </h1>

      <!-- Student Form -->
      <div class="card mb-4">
        <div class="card-header">
          <h4>Add New Student</h4>
        </div>
        <div class="card-body">
          <form #studentForm="ngForm" (ngSubmit)="addStudent()">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="studentId" class="form-label">Student ID</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="studentId"
                    name="studentId"
                    [(ngModel)]="newStudent.studentId"
                    placeholder="e.g., STU001"
                    required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="year" class="form-label">Year</label>
                  <select 
                    class="form-control" 
                    id="year"
                    name="year"
                    [(ngModel)]="newStudent.year">
                    <option [value]="1">Year 1</option>
                    <option [value]="2">Year 2</option>
                    <option [value]="3">Year 3</option>
                    <option [value]="4">Year 4</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="firstName" class="form-label">First Name</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="firstName"
                    name="firstName"
                    [(ngModel)]="newStudent.firstName"
                    placeholder="Enter first name"
                    required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="lastName" class="form-label">Last Name</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="lastName"
                    name="lastName"
                    [(ngModel)]="newStudent.lastName"
                    placeholder="Enter last name"
                    required>
                </div>
              </div>
            </div>
            
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input 
                type="email" 
                class="form-control" 
                id="email"
                name="email"
                [(ngModel)]="newStudent.email"
                placeholder="Enter email address"
                required>
            </div>
            
            <div class="mb-3">
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="!studentForm.form.valid">
                Add Student
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card">
        <div class="card-header">
          <h4>Students ({{ students.length }})</h4>
        </div>
        <div class="card-body">
          @if (students.length === 0) {
            <div class="alert alert-info text-center">
              <h5>No students available</h5>
              <p>Add your first student using the form above.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (student of students; track student.id) {
                    <tr>
                      <td>
                        <span class="badge bg-primary">{{ student.studentId }}</span>
                      </td>
                      <td>{{ getFullName(student) }}</td>
                      <td>{{ student.email }}</td>
                      <td>
                        <span class="badge bg-info">Year {{ student.year }}</span>
                      </td>
                      <td>
                        <button 
                          class="btn btn-sm btn-danger" 
                          (click)="deleteStudent(student.id)">
                          Delete
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  </div>
</div>
```

**Template Features:**

- **Property Binding:** `students` array property
- **Manual Two-way Binding:** Using `[ngModel]` and `(ngModelChange)`
- **Control Flow:** Modern `@if` and `@for` syntax
- **Bootstrap Styling:** Cards, tables, and responsive layout

---

## 6. Angular Control Flow (@if, @for)

Angular Control Flow: Modern `@if`, `@else`, `@for` syntax replaces structural directives with more intuitive syntax.

### 6.1 `@if` Directive with Properties

```ts
// Component using basic properties
export class App {
  protected students: Student[] = [];
}
```

**Template `@if` examples:**

```html
@if (students.length === 0) {
  <div class="alert alert-info text-center">
    <h5>No students available</h5>
    <p>Add your first student using the form above.</p>
  </div>
} @else {
  <div class="table-responsive">
    <!-- Table content -->
  </div>
}
```

### 6.2 `@for` Directive with Tracking

**Template `@for` with array**

```html
@for (student of students; track student.id) {
  <tr>
    <td>
      <span class="badge bg-primary">{{ student.studentId }}</span>
    </td>
    <td>{{ getFullName(student) }}</td>
    <td>{{ student.email }}</td>
    <td>
      <span class="badge bg-info">Year {{ student.year }}</span>
    </td>
    <td>
      <button 
        class="btn btn-sm btn-danger" 
        (click)="deleteStudent(student.id)">
        Delete
      </button>
    </td>
  </tr>
}
```

**Control Flow Features:**

- `@if/@else`: Clean conditional rendering
- `@for` with tracking: Efficient list rendering with `track student.id`
- Array integration: `students` array property
- Type safety: Full TypeScript support in templates

---

## 7. Testing the Angular 20.2.2 Application

### 7.1 Update `main.ts` for Angular 20.2.2

Update `src/main.ts`:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [
    // No providers needed for this simple app
  ]
}).catch(err => console.error(err));
```

**Angular 20.2.2 Bootstrap:**

- `bootstrapApplication`: New standalone bootstrap method
- **No NgModule:** Direct component bootstrapping
- **Providers array:** Configure services if needed

### 7.2 Run the Application

```bash
ng serve
```

Open <http://localhost:4200> in your browser.

**Test these features:**

- **Form Input:** Type in the form fields and see data binding update
- **Form Validation:** Try submitting empty forms – button should be disabled
- **Add Student:** Add students and watch the table update reactively
- **Delete Student:** Remove students and see the count update
- **Empty State:** Delete all students to see the "No students" message
- **Responsive Design:** Test on different screen sizes

---

## 9. Deploying to Google Cloud Platform

📚 **Prerequisites:** Before proceeding with deployment, you must claim and redeem your Google Cloud Platform credits using your student account.

**Required Resources:**
- **GCP Coupon Instructions** – Follow these step-by-step instructions to claim your credits
- **GCP Setup Lecture Recording** – Watch this recording for detailed setup guidance

### 9.1 Claim Your Google Cloud Credits

Before deploying, you need to set up your Google Cloud Platform account:

1. Visit the **GCP Coupon Instructions** page
2. Follow the instructions to redeem your student credits
3. Create or link your Google Cloud Platform account
4. Verify that your credits are applied to your account

> **Important:** You must complete the credit redemption process before proceeding with deployment. This ensures you won't incur any charges during the deployment process.

### 9.2 Verify Node.js Version (Local Development)

Before pushing to GitLab, ensure your local development environment has the correct Node.js version:

```bash
# Check your current Node.js version
node --version

# Angular 20.2.2 requires Node.js version 20.19.0, 22.12.0, or 24.0.0+
# If you need to update Node.js:

# For Windows (using nvm-windows)
nvm install 22.12.0
nvm use 22.12.0

# For macOS/Linux (using nvm)
nvm install 22.12.0
nvm use 22.12.0

# Or install directly from nodejs.org
```

### 9.3 Test Local Build

Test the production build locally before deployment:

```bash
ng serve 
```

### 9.4 Push Code to GitLab and Clone in GCP VM

Before deployment, you need to push your source code to GitLab and then clone it in your GCP VM:

**Step 5.1: Push to GitLab**

```bash
# Initialize git repository (if not already done)
git add .
git commit -m "Complete Angular single-component student management app"

# Push to GitLab
git push -u origin main
```

**Step 5.2: Access GCP VM via Browser SSH**

1. Go to your Google Cloud Console
2. Navigate to **Compute Engine → VM Instances**
3. Find your VM instance and click **SSH** (browser SSH option)
4. This will open a browser-based SSH terminal to your VM

**Step 5.3: Clone Repository in VM**

```bash
# In your VM SSH terminal, clone your repository
git clone https://URL.to.your.gitlab.repo.git

# Install Node.js (Angular 20.2.2 requires Node.js 20.19.0, 22.12.0, or 24.0.0+)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js version (should be 22.x.x - compatible with Angular 20.2.2)
node --version

# Install Angular CLI globally
npm install -g @angular/cli

# Install project dependencies
npm install
```

### 9.5 Serve the project from your VM

Now serve your application from the VM:

```bash
# Build the application for production
ng serve --host 0.0.0.0
```

---

**End of Tutorial**