# Part II: Car Show Angular App — Week 8 Fleet

A simple Angular application for managing a small fleet of cars. Each car has three properties: **Maker**, **Model**, and **Year**. This guide uses modern Angular conventions (standalone components and the new control-flow syntax).

---

## Table of Contents
- [Overview](#overview)
- [Step 1: Create a New Angular Project](#step-1-create-a-new-angular-project)
- [Step 2: Edit `app.ts` (root component)](#step-2-edit-appts-root-component)
- [Step 3: Edit `app.html` (template)](#step-3-edit-apphtml-template)
- [Step 4: Add Bootstrap](#step-4-add-bootstrap)
- [Step 5: Serve & Test](#step-5-serve--test)
- [Full Source (Copy/Paste)](#full-source-copypaste)
- [Troubleshooting & Tips](#troubleshooting--tips)

---

## Overview

You’ll build a single-component Angular app that:
- Captures **Maker**, **Model**, and **Year** in a form.
- Adds each car to an in-memory **fleet**.
- Displays the fleet in a Bootstrap-styled table using Angular’s modern `@for` loop.

Expected UI (form + table):

![Expected UI — form + table](sandbox:/mnt/data/1464366b-1db7-40f7-92e4-5f319cddcfda.png)

---

## Step 1: Create a New Angular Project

In your terminal, run:

```bash
ng new week8fleet
```

If prompted by the Angular CLI, choose **No** for SSR/SSG, **No** for zoneless, and **None** for AI tools (or follow your instructor’s guidance).

![Angular CLI prompts](sandbox:/mnt/data/b3a84c47-064a-4395-aeda-9ed4b833dd38.png)

> **Tip:** After creation, `cd` into the project folder before continuing:
>
> ```bash
> cd week8fleet
> ```

---

## Step 2: Edit `app.ts` (root component)

Each car is represented by **Maker**, **Model**, and **Year**. Create a simple model and wire up the root component.

1) **Car model (simple class):**

```ts
class Car {
  maker: string;
  model: string;
  year: number;
  constructor() {
    this.maker = '';
    this.model = '';
    this.year = 2023;
  }
}
```

2) **Root component state:**

```ts
export class App {
  protected readonly title = signal('week8fleet');

  fleet: Car[] = [];   // Array to store the list of cars
  car = new Car();     // Temporary car bound to the form
}
```

3) **Add-car handler:**

```ts
addCar() {
  this.fleet.push(this.car); // Add the current car to the fleet
  this.car = new Car();      // Create a new instance for the following car
}
```

4) **Imports & metadata:** Add `FormsModule` (for template-driven forms, incl. `[(ngModel)]`) and `CommonModule` to your standalone component.

> ✅ *Correct for a standalone root component:*

```ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('week8fleet');
  fleet: Car[] = [];
  car = new Car();

  addCar() {
    this.fleet.push(this.car);
    this.car = new Car();
  }
}

class Car {
  maker: string;
  model: string;
  year: number;
  constructor() {
    this.maker = '';
    this.model = '';
    this.year = 2023;
  }
}
```

> ℹ️ If you are **not** using routing, `RouterOutlet` is unnecessary.

---

## Step 3: Edit `app.html` (template)

1) **Header + fleet count:**

```html
<h3>{{ title() }}</h3>
<h5>We have {{ fleet.length }} cars in our fleet</h5>
```

2) **Form (two-way binding with `[(ngModel)]`):**

```html
<form style="margin-left: 1em; margin-right: 3em; width: 50%">
  <div class="form-group">
    <label for="maker">Maker</label>
    <input
      type="text"
      class="form-control"
      id="maker"
      name="maker"
      [(ngModel)]="car.maker"
    />
  </div>
  <div class="form-group">
    <label for="model">Model</label>
    <input
      type="text"
      class="form-control"
      id="model"
      name="model"
      [(ngModel)]="car.model"
    />
  </div>
  <div class="form-group">
    <label for="year">Year</label>
    <input
      type="number"
      class="form-control"
      id="year"
      name="year"
      [(ngModel)]="car.year"
    />
  </div>
  <br />
  <button (click)="addCar()" class="btn btn-primary">Add Car</button>
</form>
```

- Lines where `[(ngModel)]` appears bind inputs to the `car` object.
- The **Add Car** button uses event binding `(click)` to call `addCar()`.

3) **Fleet table (modern control flow):**

```html
<table class="table table-striped" style="width: 50%">
  <thead class="table-dark">
    <tr>
      <th>#</th>
      <th>Maker</th>
      <th>Model</th>
      <th>Year</th>
    </tr>
  </thead>
  <tbody>
    @for (c of fleet; track $index) {
      <tr>
        <td>{{ $index + 1 }}</td>
        <td>{{ c.maker }}</td>
        <td>{{ c.model }}</td>
        <td>{{ c.year }}</td>
      </tr>
    }
  </tbody>
</table>
```

> The `@for` directive efficiently loops over `fleet` and tracks rows by `$index`.

---

## Step 4: Add Bootstrap

1) Install Bootstrap inside the **project folder** (not the outer workspace):

```bash
npm i bootstrap
```

2) Open `angular.json` and add Bootstrap to the `styles` array. You can place Bootstrap **before** your `styles.css` to make your own styles override Bootstrap more easily:

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

Screenshot reference:

![angular.json — styles with Bootstrap](sandbox:/mnt/data/629c36c8-f33f-494f-b829-15e21c4fba44.png)

> If you prefer Bootstrap to take precedence, list it **after** `styles.css` instead.

---

## Step 5: Serve & Test

Run the dev server:

```bash
ng serve
```

Open <http://localhost:4200> and test:

- Enter Maker/Model/Year and click **Add Car**.
- The fleet count increases and the table adds a new row.
- Try multiple entries. It should resemble the screenshot at the top.

---

## Full Source (Copy/Paste)

**`src/app/app.ts`**

```ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

class Car {
  maker: string;
  model: string;
  year: number;
  constructor() {
    this.maker = '';
    this.model = '';
    this.year = 2023;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('week8fleet');
  fleet: Car[] = [];
  car = new Car();

  addCar() {
    this.fleet.push(this.car);
    this.car = new Car();
  }
}
```

**`src/app/app.html`**

```html
<h3>{{ title() }}</h3>
<h5>We have {{ fleet.length }} cars in our fleet</h5>

<form style="margin-left: 1em; margin-right: 3em; width: 50%">
  <div class="form-group">
    <label for="maker">Maker</label>
    <input
      type="text"
      class="form-control"
      id="maker"
      name="maker"
      [(ngModel)]="car.maker"
    />
  </div>
  <div class="form-group">
    <label for="model">Model</label>
    <input
      type="text"
      class="form-control"
      id="model"
      name="model"
      [(ngModel)]="car.model"
    />
  </div>
  <div class="form-group">
    <label for="year">Year</label>
    <input
      type="number"
      class="form-control"
      id="year"
      name="year"
      [(ngModel)]="car.year"
    />
  </div>
  <br />
  <button (click)="addCar()" class="btn btn-primary">Add Car</button>
</form>

<table class="table table-striped" style="width: 50%">
  <thead class="table-dark">
    <tr>
      <th>#</th>
      <th>Maker</th>
      <th>Model</th>
      <th>Year</th>
    </tr>
  </thead>
  <tbody>
    @for (c of fleet; track $index) {
      <tr>
        <td>{{ $index + 1 }}</td>
        <td>{{ c.maker }}</td>
        <td>{{ c.model }}</td>
        <td>{{ c.year }}</td>
      </tr>
    }
  </tbody>
</table>
```

**`src/app/app.css`** (optional starter styles)

```css
h3 {
  margin: 1rem 0 0.25rem;
}
h5 {
  margin: 0 0 1rem;
  color: #444;
}
```

**Bootstrap setup in `angular.json`**

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

---

## Troubleshooting & Tips

- **`[(ngModel)]` not working?** Ensure `FormsModule` is imported and included in the component’s `imports` array.
- **Styling not applied?** Verify Bootstrap was installed in the **project** folder and the path in `angular.json` matches your `node_modules` layout.
- **Control flow syntax errors (`@for`)**: Ensure you’re using an Angular version that supports the new control flow (Angular 17+), and that your template is saved as `app.html` with the correct component metadata.
- **Override Bootstrap**: Put your CSS *after* Bootstrap in the `styles` array or increase specificity in your selectors.

---

Happy coding! 🚗💨
