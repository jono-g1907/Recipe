# Angular Multi-Component Student Management Tutorial

**Build a multi-component Angular application for Student management using services, standalone components, and modern conventions**

---

## Table of Contents

1. [Introduction](#1-introduction)  
2. [Prerequisites](#2-prerequisites)  
3. [Angular 20.2.2 Project Setup](#3-angular-20222-project-setup)  
4. [Student Model](#4-student-model)  
5. [Student Service](#5-student-service)  
6. [Add Student Component](#6-add-student-component)  
7. [List Students Component](#7-list-students-component)  
8. [Update Student Component](#8-update-student-component)  
9. [Root Component Integration](#9-root-component-integration)  
10. [Testing the Application](#10-testing-the-application)  
11. [Deploying to Google Cloud Platform](#11-deploying-to-google-cloud-platform)

---

## 1. Introduction

This tutorial teaches you to build a modern Angular 20.2.2 application using multiple components and services. You'll learn:

- **Multi-Component Architecture** – Separate components for different functionalities  
- **Standalone Components** – Build apps without `NgModule` (Angular 20.2.2 default)  
- **Services with Dependency Injection** – Shared data management across components  
- **Component Communication** – How components interact through services  
- **New Naming Conventions** – Updated file naming and component structure  
- **Control Flow** – `@if`, `@else`, `@for` directives with latest syntax

**What you'll build:** A multi-component student management application with separate components for adding, listing, and updating students. Data will be shared through a service, demonstrating proper separation of concerns and component architecture.

**Components you'll create:**

- **AddStudentComponent** – Form to add new students  
- **ListStudentsComponent** – Display and manage students  
- **UpdateStudentComponent** – Edit existing student details  
- **StudentService** – Manage student data across components

**Angular 20.2.2 Focus:** This tutorial uses the latest Angular conventions including new naming standards, standalone components, and modern service patterns.

---

## 2. Prerequisites

Before starting this Angular 20.2.2 multi-component tutorial, make sure you have:

- **Node.js v20 or higher** – Required for Angular 20.2.2  
- **Angular CLI** – Install the latest: `npm install -g @angular/cli@latest`  
- **TypeScript 5.8** – Required for Angular 20.2.2 (installed automatically)  
- Basic understanding of HTML, CSS, JavaScript/TypeScript  
- Angular Concepts – Components, services, dependency injection  
- Text editor or IDE (VS Code recommended)

**Angular 20.2.2 Requirements:**

- Node.js: Run `node --version` (must be v20+)  
- Angular CLI: Run `ng --version` (should be 20.2.2 or later)  
- TypeScript: Automatically managed by Angular CLI

**Recommended Knowledge:** If you completed the Week 8 single-component tutorial, you'll find this multi-component approach builds naturally on those concepts.

---

## 3. Angular 20.2.2 Project Setup

### 1) Create new Angular 20.2.2 project

```bash
ng new student-management-multi --standalone --routing=false --style=css
```

**Angular 20.2.2 defaults:**

- `--standalone`: Uses standalone components (default in Angular 20.2.2)  
- `--routing=false`: We don't need routing for this tutorial  
- `--style=css`: Standard CSS styling

**Other options:** _(optional, based on your preferences)_

### 2) Navigate to the folder and Install Bootstrap and Font Awesome

```bash
cd ./student-management-multi/
npm install bootstrap @fortawesome/fontawesome-free
```

### 3) Configure Bootstrap in `angular.json`

Add Bootstrap CSS to your `angular.json` file:

```json
"styles": [
  "node_modules/@fortawesome/fontawesome-free/css/all.min.css",
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

### 4) Angular 20.2.2 Multi-Component Project Structure

With Angular 20.2.2's new naming conventions, your project structure will look like:

```text
src/app/
├── components/
│   ├── add-student/
│   │   ├── add-student.ts         // Add student component
│   │   ├── add-student.html       // Add student template
│   │   └── add-student.css        // Add student styles
│   ├── list-students/
│   │   ├── list-students.ts       // List students component
│   │   ├── list-students.html     // List students template
│   │   └── list-students.css      // List students styles
│   └── update-student/
│       ├── update-student.ts      // Update student component
│       ├── update-student.html    // Update student template
│       └── update-student.css     // Update student styles
├── services/
│   └── student.service.ts         // Student service
├── models/
│   └── student.ts                 // Student model
├── app.ts                         // Root component
├── app.html                       // Root template
├── app.css                        // Root styles
└── main.ts                        // Bootstrap file
```

**Multi-Component Architecture:** Each component has its own responsibility—adding, listing, or updating students. The service manages shared data, and the root component orchestrates everything.

---

## 4. Student Model

### 1) Create `models` directory and Student model

```bash
mkdir src/app/models
```

Create `src/app/models/student.ts`:

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

**This model defines:**

- **Student Interface:** Defines the structure of a student object  
- **Immutable Properties:** Using `readonly` prevents accidental modifications  
- **Factory Function:** `createStudent()` creates new student instances  
- **Utility Function:** `getFullName()` formats student names

---

## 5. Student Service

### 1) Create `services` directory and Student service

```bash
mkdir src/app/services
```

Create `src/app/services/student.service.ts`:

```ts
import { Injectable, signal } from '@angular/core';
import { Student, createStudent } from '../models/student';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  // Using Angular signals for reactive state management
  studentsSignal = signal<Student[]>([]);
  
  // Expose read-only signal for components
  public readonly students = this.studentsSignal.asReadonly();
  
  // Private counter for generating unique IDs
  private nextId = 1;

  constructor() {
    // Initialize with sample data for testing
    this.addStudent('STU001', 'John', 'Smith', 'john.smith@email.com', 2);
    this.addStudent('STU002', 'Jane', 'Doe', 'jane.doe@email.com', 1);
  }

  // Add a new student
  addStudent(studentId: string, firstName: string, lastName: string, email: string, year: number): void {
    const newStudent = createStudent(
      this.nextId++,
      studentId,
      firstName,
      lastName,
      email,
      Number(year)
    );
    
    // Update signal with new student added
    this.studentsSignal.update((students: Student[]) => [...students, newStudent]);
  }

  // Update an existing student
  updateStudent(id: number, updatedData: Partial<Student>): void  {
    this.studentsSignal.update(students => 
      students.map(student => 
        student.id === id 
          ? { ...student, ...updatedData,  year: updatedData.year !== undefined ? Number(updatedData.year) : student.year } 
          : student
      )
    );
  }

  // Delete a student
  deleteStudent(id: number): void {
    this.studentsSignal.update(students => 
      students.filter(student => student.id !== id)
    );
  }

  // Get a specific student by ID
  getStudentById(id: number): Student | undefined {
    return this.students().find(student => student.id === id);
  }

  // Check if student ID already exists
  isStudentIdTaken(studentId: string, excludeId?: number): boolean {
    return this.students().some(student => 
      student.studentId === studentId && student.id !== excludeId
    );
  }
}
```

**This service provides:**

- **Singleton Service:** `providedIn: 'root'` makes it available application-wide  
- **Signal-based State:** Using Angular signals for reactive data management  
- **CRUD Operations:** Add, read, update, and delete students  
- **Data Validation:** Check for duplicate student IDs  
- **Sample Data:** Pre-loaded with test students for demonstration

**Angular Signals:** Signals provide reactive state management, automatically updating components when data changes. This is a modern Angular pattern for state management.

---

## 6. Add Student Component

### 1) Create `components` directory and add-student component

```bash
mkdir src/app/components
cd ./src/app/components/
# Generate a new component (standalone by default in Angular 20)
ng generate component add-student
```

`add-student.ts`:

```ts
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-student.html',
  styleUrls: ['./add-student.css']
})
export class AddStudent {
  // Inject the student service using modern inject() function
  private studentService = inject(StudentService);
  
  // Form data for new student
  public newStudent = {
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    year: 1
  };

  // Add student method
  public addStudent(): void {
    if (this.isValidStudent()) {
      // Check if student ID is already taken
      if (this.studentService.isStudentIdTaken(this.newStudent.studentId)) {
        alert(`Student ID "${this.newStudent.studentId}" is already taken!`);
        return;
      }

      // Add student through service
      this.studentService.addStudent(
        this.newStudent.studentId,
        this.newStudent.firstName,
        this.newStudent.lastName,
        this.newStudent.email,
        this.newStudent.year
      );

      // Reset form after successful addition
      this.resetForm();
      alert('Student added successfully!');
    }
  }

  // Form validation
  private isValidStudent(): boolean {
    return this.newStudent.studentId.trim() !== '' &&
           this.newStudent.firstName.trim() !== '' &&
           this.newStudent.lastName.trim() !== '' &&
           this.newStudent.email.trim() !== '' &&
           this.newStudent.year >= 1 && this.newStudent.year <= 4;
  }

  // Reset form to initial state
  public resetForm(): void {
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

**This component:**

- **Standalone Component:** No `NgModule` required, imports `FormsModule` directly  
- **Service Injection:** Uses modern `inject()` function instead of constructor injection  
- **Form Validation:** Validates required fields and student ID uniqueness  
- **User Feedback:** Provides alerts for success and error states

### 2) Modify add student HTML template

Create `src/app/components/add-student/add-student.html`:

```html
<div class="card">
  <div class="card-header">
    <h4 class="mb-0">
      <i class="fas fa-user-plus me-2"></i>Add New Student
    </h4>
  </div>
  <div class="card-body">
    <form #studentForm="ngForm" (ngSubmit)="addStudent()">
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label for="studentId" class="form-label">
              <strong>Student ID</strong> <span class="text-danger">*</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              id="studentId"
              name="studentId"
              [(ngModel)]="newStudent.studentId"
              placeholder="e.g., STU003"
              required
              #studentIdInput="ngModel">
            <div class="form-text">Must be unique across all students</div>
            @if (studentIdInput.invalid && studentIdInput.touched) {
              <div class="text-danger small">Student ID is required</div>
            }
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="mb-3">
            <label for="year" class="form-label">
              <strong>Year</strong> <span class="text-danger">*</span>
            </label>
            <select 
              class="form-select" 
              id="year"
              name="year"
              [(ngModel)]="newStudent.year"
              required>
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
            <label for="firstName" class="form-label">
              <strong>First Name</strong> <span class="text-danger">*</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              id="firstName"
              name="firstName"
              [(ngModel)]="newStudent.firstName"
              placeholder="Enter first name"
              required
              #firstNameInput="ngModel">
            @if (firstNameInput.invalid && firstNameInput.touched) {
              <div class="text-danger small">First name is required</div>
            }
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="mb-3">
            <label for="lastName" class="form-label">
              <strong>Last Name</strong> <span class="text-danger">*</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              id="lastName"
              name="lastName"
              [(ngModel)]="newStudent.lastName"
              placeholder="Enter last name"
              required
              #lastNameInput="ngModel">
            @if (lastNameInput.invalid && lastNameInput.touched) {
              <div class="text-danger small">Last name is required</div>
            }
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <label for="email" class="form-label">
          <strong>Email Address</strong> <span class="text-danger">*</span>
        </label>
        <input 
          type="email" 
          class="form-control" 
          id="email"
          name="email"
          [(ngModel)]="newStudent.email"
          placeholder="Enter email address"
          required
          email
          #emailInput="ngModel">
        @if (emailInput.invalid && emailInput.touched) {
          <div class="text-danger small">
            @if (emailInput.errors?.['required']) {
              Email is required
            } @else if (emailInput.errors?.['email']) {
              Please enter a valid email address
            }
          </div>
        }
      </div>
      
      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
        <button 
          type="submit" 
          class="btn btn-primary"
          [disabled]="!studentForm.form.valid">
          <i class="fas fa-plus me-2"></i>Add Student
        </button>
        <button 
          type="button" 
          class="btn btn-secondary"
          (click)="resetForm()">
          <i class="fas fa-undo me-2"></i>Reset Form
        </button>
      </div>
    </form>
  </div>
</div>
```

**Template features:**

- **Bootstrap Styling:** Professional form layout with cards and responsive grid  
- **Form Validation:** Required field validation with error messages  
- **Control Flow:** `@if` directive for conditional error display  
- **Template Reference Variables:** `#studentForm`, `#emailInput` for validation access

### 3) Create add student CSS styles

Modify `src/app/components/add-student/add-student.css`:

```css
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 8px;
}

.card-header {
  background: linear-gradient(135deg, #dd0031, #c3002f);
  color: white;
  border-radius: 8px 8px 0 0 !important;
}

.card-header h4 {
  color: white;
}

.form-label {
  color: #2c3e50;
  font-weight: 500;
}

.form-control, .form-select {
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  transition: border-color 0.3s ease;
}

.form-control:focus, .form-select:focus {
  border-color: #dd0031;
  box-shadow: 0 0 0 0.2rem rgba(221, 0, 49, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #dd0031, #c3002f);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: transform 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #c3002f, #a8002a);
}

.btn-secondary {
  border-radius: 6px;
  font-weight: 500;
}

.text-danger {
  font-size: 0.875rem;
}

.form-text {
  font-size: 0.8rem;
  color: #6c757d;
}

/* Animation for form submission */
.form-control.ng-valid {
  border-color: #28a745;
}

.form-control.ng-invalid.ng-touched {
  border-color: #dc3545;
}
```

**Styling features:**

- **Angular Gradient:** Consistent branding with Angular red colors  
- **Form Validation Styles:** Visual feedback for valid/invalid states  
- **Hover Effects:** Interactive button animations  
- **Responsive Design:** Works well on different screen sizes

---

## 7. List Students Component

### 1) Create list-students component

```bash
ng generate component list-students
```

`list-students.ts`:

```ts
import { Component, inject, output } from '@angular/core';
import { StudentService } from '../../services/student.service';
import { Student, getFullName } from '../../models/student';

@Component({
  selector: 'app-list-students',
  standalone: true,
  imports: [],
  templateUrl: './list-students.html',
  styleUrls: ['./list-students.css']
})
export class ListStudents {
  // Inject the student service
  private studentService = inject(StudentService);
  
  // Output event for when edit button is clicked
  public editStudent = output<number>(); 
  
  // Get students from service (reactive signal)
  public get students(): Student[] {
    return this.studentService.students();
  }
  
  // Utility function for full names
  public getFullName = getFullName;

  // Delete student method
  public deleteStudent(id: number): void {
    const student = this.studentService.getStudentById(id);
    if (student) {
      const confirmed = confirm(
        `Are you sure you want to delete "${getFullName(student)}" (${student.studentId})?`
      );
      
      if (confirmed) {
        this.studentService.deleteStudent(id);
        alert('Student deleted successfully!');
      }
    }
  }

  // Edit student method - emits event to parent
  public onEditStudent(id: number): void {
    this.editStudent.emit(id);
  }

  public countByYear(year: number): number {
    return this.students.filter((s) => s.year === year).length;
  }

  // Get badge class for year
  public getYearBadgeClass(year: number): string {
    const badgeClasses = {
      1: 'bg-success',
      2: 'bg-info', 
      3: 'bg-warning',
      4: 'bg-danger'
    };
    return badgeClasses[year as keyof typeof badgeClasses] || 'bg-secondary';
  }
}
```

**This component:**

- **Reactive Data:** Gets students from service signal (automatically updates when data changes)  
- **Event Output:** Uses `output()` to emit edit events to parent component  
- **Confirmation Dialog:** Confirms before deleting students  
- **Dynamic Styling:** Different badge colors for each year level

### 2) Create list students HTML template

Modify `src/app/components/list-students/list-students.html`:

```html
<div class="card">
  <div class="card-header">
    <h4 class="mb-0">
      <i class="fas fa-users me-2"></i>Students ({{ students.length }})
    </h4>
  </div>
  <div class="card-body">
    @if (students.length === 0) {
      <div class="alert alert-info text-center">
        <i class="fas fa-info-circle fa-2x mb-3"></i>
        <h5>No students available</h5>
        <p class="mb-0">Add your first student using the form above.</p>
      </div>
    } @else {
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="table-dark">
            <tr>
              <th scope="col">
                <i class="fas fa-id-badge me-1"></i>Student ID
              </th>
              <th scope="col">
                <i class="fas fa-user me-1"></i>Name
              </th>
              <th scope="col">
                <i class="fas fa-envelope me-1"></i>Email
              </th>
              <th scope="col">
                <i class="fas fa-graduation-cap me-1"></i>Year
              </th>
              <th scope="col" class="text-center">
                <i class="fas fa-cogs me-1"></i>Actions
              </th>
            </tr>
          </thead>
          <tbody>
            @for (student of students; track student.id) {
              <tr class="student-row">
                <td>
                  <span class="badge bg-primary student-id-badge">
                    {{ student.studentId }}
                  </span>
                </td>
                <td class="student-name">
                  <strong>{{ getFullName(student) }}</strong>
                </td>
                <td class="student-email">
                  <i class="fas fa-at text-muted me-1"></i>
                  {{ student.email }}
                </td>
                <td>
                  <span class="badge year-badge" [class]="getYearBadgeClass(student.year)">
                    Year {{ student.year }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="btn-group" role="group">
                    <button 
                      type="button"
                      class="btn btn-outline-warning btn-sm"
                      (click)="onEditStudent(student.id)"
                      title="Edit student">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      type="button"
                      class="btn btn-outline-danger btn-sm"
                      (click)="deleteStudent(student.id)"
                      title="Delete student">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      
      <div class="mt-3 d-flex justify-content-between align-items-center">
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          Total: {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
        </small>
        <div class="d-flex gap-2">
          @for (year of [1, 2, 3, 4]; track year) {
            <span class="badge year-count-badge" [class]="getYearBadgeClass(year)">
              Year {{ year }}: {{ countByYear(year) }}
            </span>
          }
        </div>
      </div>
    }
  </div>
</div>
```

**Template features:**

- **Conditional Rendering:** Shows empty state or table based on data availability  
- **Responsive Table:** Works well on mobile devices with horizontal scrolling  
- **Dynamic Badges:** Color-coded year badges with statistics  
- **Action Buttons:** Edit and delete buttons with hover tooltips  
- **Icons:** FontAwesome icons for better visual hierarchy

### 3) Create list students CSS styles

Modify `src/app/components/list-students/list-students.css`:

```css
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 8px;
}

.card-header {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: white;
  border-radius: 8px 8px 0 0 !important;
}

.card-header h4 {
  color: white;
}

.table {
  margin-bottom: 0;
}

.table-dark {
  background: linear-gradient(135deg, #2c3e50, #34495e);
}

.table-dark th {
  border-color: #34495e;
  font-weight: 600;
}

.student-row {
  transition: background-color 0.2s ease;
}

.student-row:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.student-id-badge {
  font-size: 0.9rem;
  font-weight: 600;
}

.student-name {
  color: #2c3e50;
  font-size: 1rem;
}

.student-email {
  color: #6c757d;
  font-size: 0.9rem;
}

.year-badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
}

.year-count-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

.btn-group .btn {
  border-radius: 4px;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  transition: all 0.2s ease;
}

.btn-outline-warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
}

.btn-outline-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.alert-info {
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  color: #0c5460;
}

.text-muted {
  font-size: 0.875rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .btn-group .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .student-name {
    font-size: 0.9rem;
  }
  
  .student-email {
    font-size: 0.8rem;
  }
}
```

**Styling features:**

- **Professional Design:** Clean table layout with hover effects  
- **Color-coded Years:** Different colors for each year level  
- **Responsive Design:** Adapts to different screen sizes  
- **Interactive Elements:** Hover animations and button effects  
- **Consistent Branding:** Matches the overall application theme

---

## 8. Update Student Component

### 1) Create update-student component

```bash
ng generate component update-student
```

`update-student.ts`:

```ts
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/student';

@Component({
  selector: 'app-update-student',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './update-student.html',
  styleUrls: ['./update-student.css']
})
export class UpdateStudent {
  // Inject the student service
  public studentService = inject(StudentService);
  
  // Input for student ID to edit
   public studentId = input<number | null>(null); 
  
  // Output events
  public studentUpdated = output<void>();
  public cancelEdit = output<void>();
  
  // Form data for editing student
  public editStudent: {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    year: number;
  } = {
    id: 0,
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    year: 1
  };

  // Track original student for comparison
  private originalStudent: Student | null = null;

  // Load student data when studentId changes
  ngOnInit() {
    const id = this.studentId();
    if (id !== null) {
      this.loadStudent(id);
    }
  }

  // Load student data from service
  private loadStudent(id: number): void {
    const student = this.studentService.getStudentById(id);
    if (student) {
      this.originalStudent = student;
      this.editStudent = {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        year: student.year
      };
    }
  }

  // Update student method
  public updateStudent(): void {
    if (this.isValidStudent()) {
      // Check if student ID is already taken by another student
      if (this.studentService.isStudentIdTaken(this.editStudent.studentId, this.editStudent.id)) {
        alert(`Student ID "${this.editStudent.studentId}" is already taken by another student!`);
        return;
      }

      // Update student through service
      this.studentService.updateStudent(this.editStudent.id, {
        studentId: this.editStudent.studentId,
        firstName: this.editStudent.firstName,
        lastName: this.editStudent.lastName,
        email: this.editStudent.email,
        year: this.editStudent.year
      });

      alert('Student updated successfully!');
      this.studentUpdated.emit();
    }
  }

  // Cancel editing
  public onCancel(): void {
    this.cancelEdit.emit();
  }

  // Form validation
  private isValidStudent(): boolean {
    return this.editStudent.studentId.trim() !== '' &&
           this.editStudent.firstName.trim() !== '' &&
           this.editStudent.lastName.trim() !== '' &&
           this.editStudent.email.trim() !== '' &&
           this.editStudent.year >= 1 && this.editStudent.year <= 4;
  }

  // Check if form has changes
  public hasChanges(): boolean {
    if (!this.originalStudent) return false;
    
    return this.editStudent.studentId !== this.originalStudent.studentId ||
           this.editStudent.firstName !== this.originalStudent.firstName ||
           this.editStudent.lastName !== this.originalStudent.lastName ||
           this.editStudent.email !== this.originalStudent.email ||
           this.editStudent.year !== this.originalStudent.year;
  }

  // Reset form to original values
  public resetForm(): void {
    if (this.originalStudent) {
      this.loadStudent(this.originalStudent.id);
    }
  }
}
```

**This component:**

- **Input Signal:** Receives student ID to edit via `input()`  
- **Output Events:** Emits events for update completion and cancellation  
- **Change Detection:** Tracks whether form has been modified  
- **Validation:** Ensures student ID uniqueness and required fields  
- **Reset Functionality:** Allows reverting changes to original values

### 2) Create update student HTML template

Modify `src/app/components/update-student/update-student.html`:

```html
@if (studentId() !== null && editStudent.id > 0) {
  <div class="card">
    <div class="card-header">
      <h4 class="mb-0">
        <i class="fas fa-user-edit me-2"></i>Edit Student
        <span class="badge bg-light text-dark ms-2">ID: {{ editStudent.id }}</span>
      </h4>
    </div>
    <div class="card-body">
      <form #updateForm="ngForm" (ngSubmit)="updateStudent()">
        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="editStudentId" class="form-label">
                <strong>Student ID</strong> <span class="text-danger">*</span>
              </label>
              <input 
                type="text" 
                class="form-control" 
                id="editStudentId"
                name="editStudentId"
                [(ngModel)]="editStudent.studentId"
                placeholder="e.g., STU003"
                required
                #editStudentIdInput="ngModel">
              <div class="form-text">Must be unique across all students</div>
              @if (editStudentIdInput.invalid && editStudentIdInput.touched) {
                <div class="text-danger small">Student ID is required</div>
              }
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="mb-3">
              <label for="editYear" class="form-label">
                <strong>Year</strong> <span class="text-danger">*</span>
              </label>
              <select 
                class="form-select" 
                id="editYear"
                name="editYear"
                [(ngModel)]="editStudent.year"
                required>
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
              <label for="editFirstName" class="form-label">
                <strong>First Name</strong> <span class="text-danger">*</span>
              </label>
              <input 
                type="text" 
                class="form-control" 
                id="editFirstName"
                name="editFirstName"
                [(ngModel)]="editStudent.firstName"
                placeholder="Enter first name"
                required
                #editFirstNameInput="ngModel">
              @if (editFirstNameInput.invalid && editFirstNameInput.touched) {
                <div class="text-danger small">First name is required</div>
              }
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="mb-3">
              <label for="editLastName" class="form-label">
                <strong>Last Name</strong> <span class="text-danger">*</span>
              </label>
              <input 
                type="text" 
                class="form-control" 
                id="editLastName"
                name="editLastName"
                [(ngModel)]="editStudent.lastName"
                placeholder="Enter last name"
                required
                #editLastNameInput="ngModel">
              @if (editLastNameInput.invalid && editLastNameInput.touched) {
                <div class="text-danger small">Last name is required</div>
              }
            </div>
          </div>
        </div>
        
        <div class="mb-3">
          <label for="editEmail" class="form-label">
            <strong>Email Address</strong> <span class="text-danger">*</span>
          </label>
          <input 
            type="email" 
            class="form-control" 
            id="editEmail"
            name="editEmail"
            [(ngModel)]="editStudent.email"
            placeholder="Enter email address"
            required
            email
            #editEmailInput="ngModel">
          @if (editEmailInput.invalid && editEmailInput.touched) {
            <div class="text-danger small">
              @if (editEmailInput.errors?.['required']) {
                Email is required
              } @else if (editEmailInput.errors?.['email']) {
                Please enter a valid email address
              }
            </div>
          }
        </div>
        
        @if (hasChanges()) {
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            You have unsaved changes. Make sure to save or cancel your edits.
          </div>
        }
        
        <div class="d-flex gap-2 justify-content-end">
          <button 
            type="button" 
            class="btn btn-outline-secondary"
            (click)="resetForm()"
            [disabled]="!hasChanges()">
            <i class="fas fa-undo me-2"></i>Reset Changes
          </button>
          <button 
            type="button" 
            class="btn btn-secondary"
            (click)="onCancel()">
            <i class="fas fa-times me-2"></i>Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-success"
            [disabled]="!updateForm.form.valid || !hasChanges()">
            <i class="fas fa-save me-2"></i>Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
}
```

**Template features:**

- **Conditional Rendering:** Only shows when a valid student ID is provided  
- **Change Tracking:** Visual indicator when form has unsaved changes  
- **Smart Button States:** Save button disabled when no changes or form invalid  
- **Reset Functionality:** Allows reverting to original values  
- **Form Validation:** Same validation as add student component

### 3) Create update student CSS styles

Modify `src/app/components/update-student/update-student.css`:

```css
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.card-header {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: #212529;
  border-radius: 8px 8px 0 0 !important;
}

.card-header h4 {
  color: #212529;
  font-weight: 600;
}

.card-header .badge {
  font-size: 0.8rem;
}

.form-label {
  color: #2c3e50;
  font-weight: 500;
}

.form-control, .form-select {
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  transition: border-color 0.3s ease;
}

.form-control:focus, .form-select:focus {
  border-color: #ffc107;
  box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
}

.btn-success {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #1e7e34, #155724);
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  border-radius: 6px;
  font-weight: 500;
  transition: transform 0.2s ease;
}

.btn-secondary:hover {
  transform: translateY(-1px);
}

.btn-outline-secondary {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-outline-secondary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-outline-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-warning {
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
  border-left: 4px solid #ffc107;
}

.text-danger {
  font-size: 0.875rem;
}

.form-text {
  font-size: 0.8rem;
  color: #6c757d;
}

/* Animation for form validation */
.form-control.ng-valid.ng-touched {
  border-color: #28a745;
}

.form-control.ng-invalid.ng-touched {
  border-color: #dc3545;
}

/* Button group spacing */
.d-flex.gap-2 > * {
  margin-right: 0.5rem;
}

.d-flex.gap-2 > *:last-child {
  margin-right: 0;
}
```

**Styling features:**

- **Warning Theme:** Yellow/amber colors to indicate editing mode  
- **Visual Feedback:** Color changes for form validation states  
- **Button States:** Disabled states clearly indicated  
- **Change Indicator:** Warning alert shows when unsaved changes exist  
- **Consistent Design:** Matches overall application styling

---

## 9. Root Component Integration

### 1) Update root `app` component

Update `src/app/app.ts`:

```ts
import { Component, signal } from '@angular/core';
import { AddStudent } from './components/add-student/add-student';
import { ListStudents } from './components/list-students/list-students';
import { UpdateStudent } from './components/update-student/update-student';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AddStudent, ListStudents, UpdateStudent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'Student Management Multi-Component';
  
  // Signal to track which student is being edited (null means no editing)
  public editingStudentId = signal<number | null>(null); 

  // Handle edit student event from list component
  public onEditStudent(studentId: number): void {
    this.editingStudentId.set(studentId);
  }

  // Handle student updated event from update component
  public onStudentUpdated(): void {
    this.editingStudentId.set(null);
  }

  // Handle cancel edit event from update component
  public onCancelEdit(): void {
    this.editingStudentId.set(null);
  }
}
```

**This root component:**

- **Component Orchestration:** Manages communication between child components  
- **State Management:** Tracks editing state using signals  
- **Event Handling:** Listens to and responds to child component events  
- **Component Imports:** Imports all child components for use in template

### 2) Create root app HTML template

Update `src/app/app.html`:

```html
<div class="container-fluid mt-4">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10 col-xl-8">
      <!-- App Header -->
      <div class="text-center mb-4">
        <h1 class="display-4 text-primary">
          <i class="fas fa-graduation-cap me-3"></i>
          <span class="angular-highlight">Angular 20.2.2</span> 
          Student Management
        </h1>
        <p class="lead text-muted">
          Multi-Component Architecture with Services & Dependency Injection
        </p>
        <hr class="my-4">
      </div>

      <!-- Main Content Area -->
      <div class="row">
        <!-- Left Column: Add Student Form -->
        <div class="col-12" [class.col-lg-6]="editingStudentId() === null" [class.col-lg-4]="editingStudentId() !== null">
          <app-add-student></app-add-student>
        </div>

        <!-- Middle Column: Update Student Form (conditional) -->
        @if (editingStudentId() !== null) {
          <div class="col-12 col-lg-4 mb-4">
            <app-update-student 
              [studentId]="editingStudentId()"
              (studentUpdated)="onStudentUpdated()"
              (cancelEdit)="onCancelEdit()">
            </app-update-student>
          </div>
        }

        <!-- Right Column: Students List -->
        <div class="col-12" [class.col-lg-6]="editingStudentId() === null" [class.col-lg-4]="editingStudentId() !== null">
          <app-list-students 
            (editStudent)="onEditStudent($event)">
          </app-list-students>
        </div>
      </div>

      <!-- Footer -->
      <div class="row mt-5">
        <div class="col-12">
          <div class="card border-0 bg-light">
            <div class="card-body text-center">
              <div class="row align-items-center">
                <div class="col-md-4">
                  <h6 class="mb-0">
                    <i class="fas fa-puzzle-piece me-2 text-primary"></i>
                    Multi-Component Architecture
                  </h6>
                </div>
                <div class="col-md-4">
                  <h6 class="mb-0">
                    <i class="fas fa-exchange-alt me-2 text-success"></i>
                    Service-Based Communication
                  </h6>
                </div>
                <div class="col-md-4">
                  <h6 class="mb-0">
                    <i class="fas fa-signal me-2 text-info"></i>
                    Angular Signals & Reactive State
                  </h6>
                </div>
              </div>
              <hr class="my-3">
              <small class="text-muted">
                <i class="fas fa-code me-1"></i>
                Built with Angular 20.2.2 | Standalone Components | Bootstrap 5
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Template features:**

- **Responsive Layout:** Dynamic column sizing based on editing state  
- **Component Integration:** All child components working together  
- **Event Binding:** Proper event handling between parent and child components  
- **Conditional Rendering:** Update component only shows when editing  
- **Professional UI:** Clean header, footer, and responsive design

### 3) Create root app CSS styles

Update `src/app/app.css`:

```css
/* Global App Styles */
.container-fluid {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  min-height: 100vh;
  padding-bottom: 2rem;
}

.display-4 {
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.text-primary {
  color: #2c3e50 !important;
}

.angular-highlight {
  background: linear-gradient(135deg, #dd0031, #c3002f);
  color: white;
  padding: 0.2rem 0.8rem;
  border-radius: 6px;
  font-weight: 700;
}

.lead {
  font-size: 1.1rem;
  font-weight: 400;
}

hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #dd0031, transparent);
}

/* Component Spacing */
.col-12 {
  margin-bottom: 1.5rem;
}

/* Responsive adjustments for component layout */
@media (min-width: 992px) {
  .col-lg-4, .col-lg-6 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

/* Footer styling */
.card.border-0.bg-light {
  background: linear-gradient(135deg, #f8f9fa, #ffffff) !important;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.card.border-0.bg-light .card-body {
  padding: 1.5rem;
}

.card.border-0.bg-light h6 {
  color: #2c3e50;
  font-weight: 600;
}

.card.border-0.bg-light .text-muted {
  font-size: 0.9rem;
}

/* Animation for component transitions */
app-update-student {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Ensure consistent card spacing */
app-add-student,
app-list-students,
app-update-student {
  display: block;
  height: fit-content;
}

/* Mobile responsiveness */
@media (max-width: 767px) {
  .display-4 {
    font-size: 2rem;
  }
  
  .lead {
    font-size: 1rem;
  }
  
  .container-fluid {
    padding-left: 15px;
    padding-right: 15px;
  }
  
  .card.border-0.bg-light .row {
    text-align: center;
  }
  
  .card.border-0.bg-light .col-md-4 {
    margin-bottom: 1rem;
  }
  
  .card.border-0.bg-light .col-md-4:last-child {
    margin-bottom: 0;
  }
}
```

**Styling features:**

- **Professional Design:** Clean, modern layout with gradients  
- **Responsive Layout:** Adapts to different screen sizes  
- **Component Animations:** Smooth transitions when components appear  
- **Consistent Spacing:** Proper margins and padding throughout  
- **Angular Branding:** Consistent use of Angular color scheme

### 4) Update `main.ts` bootstrap file

Update `src/main.ts`:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [
    // Add any additional providers here if needed in the future
    // For this tutorial, StudentService is provided at root level
  ]
}).catch(err => console.error(err));
```

**Bootstrap configuration:**

- **Standalone Bootstrap:** No `NgModule` required  
- **Root Component:** Directly bootstrap the `App` component  
- **Provider Array:** Empty for now, `StudentService` auto-provides at root  
- **Error Handling:** Catches and logs bootstrap errors

---

## 10. Testing the Application

### 1) Run the Angular application

```bash
ng serve
```

Open `http://localhost:4200` in your browser.

**Expected Result:** You should see a professional student management interface with three distinct areas—Add Student form on the left, Students list on the right, and space for the Update form when editing.

### 2) Test Multi-Component Functionality

**Add Student Component Testing:**

- **Form Validation:** Try submitting with empty fields—form should be disabled  
- **Student ID Uniqueness:** Try adding a student with ID `"STU001"` (should fail—already exists)  
- **Successful Addition:** Add a new student with unique ID `"STU003"`  
- **Form Reset:** Form should clear after successful submission  
- **Data Sync:** New student should immediately appear in the list

**List Students Component Testing:**

- **Initial Data:** Should show 2 sample students (John Smith, Jane Doe)  
- **Real-time Updates:** Count should update when students are added/deleted  
- **Year Badges:** Different colors for Year 1 (green), Year 2 (blue), etc.  
- **Action Buttons:** Hover effects on Edit (yellow) and Delete (red) buttons  
- **Delete Confirmation:** Should ask for confirmation before deleting

**Update Student Component Testing:**

- **Edit Activation:** Click edit button—update form should appear in middle column  
- **Layout Change:** Columns should resize from 2-column to 3-column layout  
- **Pre-populated Data:** Form should be filled with existing student data  
- **Change Detection:** Warning should appear when form is modified  
- **Validation:** Same validation rules as add form  
- **Reset Changes:** Reset button should restore original values  
- **Cancel Edit:** Should close update form and return to 2-column layout  
- **Save Changes:** Should update student and close form

**Service Communication Testing:**

- **Shared State:** All components should see the same student data  
- **Real-time Updates:** Changes in one component immediately reflect in others  
- **Data Persistence:** Data should persist during the session (no backend)  
- **Component Isolation:** Each component should work independently

### 3) Test Responsive Design

Test the application on different screen sizes:

- **Desktop (≥ 992px):** 2-column layout (3-column when editing)  
- **Tablet (768–991px):** Components should stack vertically  
- **Mobile (< 768px):** Single column layout with smaller buttons  
- **Dynamic Resizing:** Layout should adapt smoothly when window is resized

### 4) Test Component Interactions

Verify proper component communication:

- **Add Student →** List updates immediately with new entry  
- **Edit button →** Update form appears with correct data  
- **Save changes →** List updates with modified data, form closes  
- **Cancel edit →** Form closes without saving changes  
- **Delete student →** Confirmation dialog, then removal from list

---

## 11. Deploying to Google Cloud Platform

📚 **Prerequisites:** Before proceeding with deployment, you must claim and redeem your Google Cloud Platform credits using your student account.

**Required Resources:**

- **GCP Coupon Instructions** – Follow these step-by-step instructions to claim your credits  
- **GCP Setup Lecture Recording** – Watch this recording for detailed setup guidance

### 1) Claim Your Google Cloud Credits

Before deploying, you need to set up your Google Cloud Platform account:

- Visit the **GCP Coupon Instructions** page  
- Follow the instructions to redeem your student credits  
- Create or link your Google Cloud Platform account  
- Verify that your credits are applied to your account

> **Important:** You must complete the credit redemption process before proceeding with deployment. This ensures you won't incur any charges during the deployment process.

### 2) Verify Node.js Version (Local Development)

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

### 3) Test Local Build

Test the production build locally before deployment:

```bash
ng serve
```

### 4) Push Code to GitLab and Clone in GCP VM

Before deployment, you need to push your source code to GitLab and then clone it in your GCP VM.

**Step 4.1: Push to GitLab**

```bash
# Initialize git repository (if not already done)
git add .
git commit -m "Complete Angular multi-component student management app"

# Push to GitLab
git push -u origin main
```

**Step 4.2: Access GCP VM via Browser SSH**

- Go to your **Google Cloud Console**  
- Navigate to **Compute Engine → VM Instances**  
- Find your VM instance and click **SSH** (browser SSH option)  
- This will open a browser-based SSH terminal to your VM

**Step 4.3: Clone Repository in VM**

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

### 5) Serve the project from your VM

Now serve your application from the VM:

```bash
# Build the application for production (dev server for demo use)
ng serve --host 0.0.0.0
```

--- 