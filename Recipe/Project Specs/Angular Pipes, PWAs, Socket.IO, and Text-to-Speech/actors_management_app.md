# Actors Management App (Angular + Express + MongoDB)

A small full‑stack application that demonstrates Angular **standalone components**, **routing**, **pipes**, and an **HTTP service** talking to a Node/Express + MongoDB backend. It serves a simple actors library where you can list, add, and delete actors. The actor’s **age** is computed on the client via a custom pipe.

> ✅ **Tested on modern Angular (v17+)** with the new control‑flow syntax (`@for`). The app uses a standalone setup (no NgModules).

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Frontend (Angular)](#frontend-angular)
  - [1) Create the App & Generate Artifacts](#1-create-the-app--generate-artifacts)
  - [2) Routing Configuration](#2-routing-configuration)
  - [3) Root Component](#3-root-component)
  - [4) Database Service](#4-database-service)
  - [5) Add Actor Component](#5-add-actor-component)
  - [6) Delete Actor Component](#6-delete-actor-component)
  - [7) List Actors Component](#7-list-actors-component)
  - [8) Age Pipe](#8-age-pipe)
- [Backend (Express + MongoDB)](#backend-express--mongodb)
  - [Mongoose Model](#mongoose-model)
  - [Controller](#controller)
  - [Server](#server)
- [Installing Dependencies](#installing-dependencies)
- [Build & Run](#build--run)
- [API Endpoints](#api-endpoints)
- [Notes & Common Pitfalls](#notes--common-pitfalls)

---

## Prerequisites
- **Node.js** 18+
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`
- **Angular CLI** (optional, but recommended):

```bash
npm i -g @angular/cli
```

---

## Project Structure
```
actorApp/
├─ backend/
│  ├─ controller/
│  │  └─ actorController.js
│  ├─ models/
│  │  └─ actor.js
│  └─ server.js
├─ src/
│  ├─ app/
│  │  ├─ add-actor/
│  │  │  ├─ add-actor.ts
│  │  │  ├─ add-actor.html
│  │  │  └─ add-actor.css
│  │  ├─ delete-actor/
│  │  │  ├─ delete-actor.ts
│  │  │  ├─ delete-actor.html
│  │  │  └─ delete-actor.css
│  │  ├─ list-actors/
│  │  │  ├─ list-actors.ts
│  │  │  ├─ list-actors.html
│  │  │  └─ list-actors.css
│  │  ├─ app.config.ts
│  │  ├─ app.routes.ts
│  │  ├─ app.ts
│  │  ├─ app.html
│  │  ├─ app.css
│  │  ├─ database.ts
│  │  └─ page-pipe.ts
└─ ...
```

---

## Frontend (Angular)

### 1) Create the App & Generate Artifacts
```bash
ng new actorApp
cd actorApp

# Components
ng g c addActor --standalone
ng g c deleteActor --standalone
ng g c listActors --standalone

# Pipe (age calculator)
ng g p PAge --standalone

# Service (HTTP data access)
ng g s database
```

> The `--standalone` flag ensures each component/pipe can be imported directly without NgModules.

---

### 2) Routing Configuration
**`src/app/app.config.ts`**
```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient()
  ]
};
```

**`src/app/app.routes.ts`**
```ts
import { Routes } from '@angular/router';
import { ListActors } from './list-actors/list-actors';
import { AddActor } from './add-actor/add-actor';
import { DeleteActor } from './delete-actor/delete-actor';

export const routes: Routes = [
  { path: 'list-actors', component: ListActors },
  { path: 'add-actor', component: AddActor },
  { path: 'delete-actor', component: DeleteActor },
  { path: '', redirectTo: '/list-actors', pathMatch: 'full' },
  { path: '**', component: ListActors },
];
```

**`src/app/app.html`**
```html
<nav class="navbar navbar-expand-sm bg-dark navbar-dark">
  <ul class="navbar-nav">
    <li class="nav-item">
      <a class="nav-link" routerLink="/list-actors" routerLinkActive="active">List Actors</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" routerLink="/add-actor" routerLinkActive="active">Add Actor</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" routerLink="/delete-actor" routerLinkActive="active">Delete Actor</a>
    </li>
  </ul>
</nav>

<router-outlet></router-outlet>
```

---

### 3) Root Component
**`src/app/app.ts`**
```ts
import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('actorApp');
}
```

---

### 4) Database Service
**`src/app/database.ts`**
```ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({ providedIn: 'root' })
export class Database {
  constructor(private http: HttpClient) {}

  getActors() {
    return this.http.get('/actors');
  }
  createActor(data: object) {
    return this.http.post('/actors', data, httpOptions);
  }
  deleteActor(id: string) {
    const url = `/actors/${id}`;
    return this.http.delete(url, httpOptions);
  }
}
```

---

### 5) Add Actor Component
**`src/app/add-actor/add-actor.ts`**
```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Database } from '../database';

@Component({
  selector: 'app-add-actor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-actor.html',
  styleUrl: './add-actor.css'
})
export class AddActor {
  fullName = '';
  bYear = 0;
  actorId = '';

  constructor(private dbService: Database, private router: Router) {}

  onSaveActor() {
    const obj = { name: this.fullName, bYear: this.bYear };
    this.dbService.createActor(obj).subscribe(() => {
      // ✅ Navigate to the defined route path
      this.router.navigate(['/list-actors']);
    });
  }
}
```

**`src/app/add-actor/add-actor.html`**
```html
<div class="section">
  <div class="form-group">
    <label for="actorName">Full Name</label>
    <input type="text" class="form-control" id="actorName" [(ngModel)]="fullName">
  </div>
  <div class="form-group">
    <label for="birthYear">Birth Year</label>
    <input type="number" class="form-control" id="birthYear" [(ngModel)]="bYear">
  </div>
  <button type="submit" class="btn btn-primary" (click)="onSaveActor()">Save Actor</button>
</div>
```

---

### 6) Delete Actor Component
**`src/app/delete-actor/delete-actor.ts`**
```ts
import { Component } from '@angular/core';
import { Database } from '../database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delete-actor',
  standalone: true,
  imports: [],
  templateUrl: './delete-actor.html',
  styleUrl: './delete-actor.css'
})
export class DeleteActor {
  actorsDB: any[] = [];

  constructor(private dbService: Database, private router: Router) {}

  // Get all Actors
  onGetActors() {
    return this.dbService.getActors().subscribe((data: any) => {
      this.actorsDB = data;
    });
  }

  // Delete Actor
  onDeleteActor(item: any) {
    this.dbService.deleteActor(item._id).subscribe(() => {
      this.onGetActors();
      // ✅ Navigate to the defined route path
      this.router.navigate(['/list-actors']);
    });
  }

  // Invoked when the component is initialized
  ngOnInit() {
    this.onGetActors();
  }
}
```

**`src/app/delete-actor/delete-actor.html`**
```html
<div class="section">
  <table class="table table-striped">
    <tr>
      <th>Name</th>
      <th>Birth Year</th>
      <th>Delete?</th>
    </tr>
    @for (item of actorsDB; track item) {
      <tr>
        <td>{{ item.name }}</td>
        <td>{{ item.bYear }}</td>
        <td>
          <button type="button" class="btn btn-primary" (click)="onDeleteActor(item)">Delete</button>
        </td>
      </tr>
    }
  </table>
</div>
```

---

### 7) List Actors Component
**`src/app/list-actors/list-actors.ts`**
```ts
import { Component } from '@angular/core';
import { PAgePipe } from '../page-pipe';
import { Database } from '../database';

@Component({
  selector: 'app-list-actors',
  standalone: true,
  imports: [PAgePipe],
  templateUrl: './list-actors.html',
  styleUrl: './list-actors.css'
})
export class ListActors {
  actorsDB: any[] = [];

  constructor(private dbService: Database) {}

  ngOnInit() {
    console.log('Hi From ListActors ngOnInit');
    this.dbService.getActors().subscribe((data: any) => {
      this.actorsDB = data;
    });
  }
}
```

**`src/app/list-actors/list-actors.html`**
```html
<div class="section">
  <table class="table table-striped">
    <tr>
      <th>Name</th>
      <th>Birth Year</th>
      <th>Age</th>
    </tr>
    @for (item of actorsDB; track item) {
      <tr>
        <td>{{ item.name }}</td>
        <td>{{ item.bYear }}</td>
        <td>{{ item.bYear | pAge }}</td>
      </tr>
    }
  </table>
</div>
```

---

### 8) Age Pipe
**`src/app/page-pipe.ts`**
```ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pAge', standalone: true }) // ✅ standalone so it can be imported directly
export class PAgePipe implements PipeTransform {
  transform(value: number): number {
    const currentYear = new Date().getFullYear();
    return currentYear - value;
  }
}
```

---

## Backend (Express + MongoDB)

### Mongoose Model
**`backend/models/actor.js`**
```js
const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bYear: { type: Number, required: true }
});

module.exports = mongoose.model('Actor', actorSchema);
```

### Controller
**`backend/controller/actorController.js`**
```js
const Actor = require('../models/actor');

module.exports = {
  getAll: async function (req, res) {
    const actors = await Actor.find({});
    res.json(actors);
  },

  createOne: async function (req, res) {
    const newActorDetails = req.body;
    const actor = new Actor(newActorDetails);
    await actor.save();
    res.json(actor);
  },

  getOne: async function (req, res) {
    const actor = await Actor.findOne({ _id: req.params.id })
      // .populate('movies') // Note: only relevant if your schema adds a movies field
      .exec();
    res.json(actor);
  },

  deleteOne: async function (req, res) {
    const doc = await Actor.deleteOne({ _id: req.params.id });
    res.json(doc);
  },
};
```

### Server
**`backend/server.js`**
```js
const express = require('express');
const mongoose = require('mongoose');
const actorController = require('./controller/actorController');
const path = require('path');

const app = express();
app.use(express.json());

// Serve the Angular build output
app.use(express.static(path.join(__dirname, '..', 'dist', 'actorApp', 'browser')));

// Simple logger
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Mongo connection
async function connect() {
  await mongoose.connect('mongodb://127.0.0.1:27017/actor');
}
connect().catch(err => console.error('Mongo connection error:', err));

// Actor endpoints
app.get('/actors', actorController.getAll);
app.post('/actors', actorController.createOne);
app.delete('/actors/:id', actorController.deleteOne);

// Fallback to index.html for client routes (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'actorApp', 'browser', 'index.html'));
});

// Start server
const PORT = 8080;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
```

---

## Installing Dependencies
In the **project root**:
```bash
# Frontend styling
npm i bootstrap

# Backend deps
cd backend
npm i express mongoose
```

If you’re importing Bootstrap in your Angular app, add it to your global styles (e.g., `src/styles.css`):
```css
@import url('/bootstrap.min.css');
```
Or install via npm and import from `node_modules` as desired.

---

## Build & Run
1. **Build Angular** (from project root):
   ```bash
   ng build
   ```
   This outputs to `dist/actorApp/browser`.

2. **Start Backend**:
   ```bash
   node backend/server.js
   ```

3. Open **http://localhost:8080** in your browser.

> The Express server serves the Angular build and exposes the `/actors` API.

---

## API Endpoints
- `GET /actors` → list all actors
- `POST /actors` → create an actor `{ name: string, bYear: number }`
- `DELETE /actors/:id` → delete an actor by Mongo `_id`

---

## Notes & Common Pitfalls
- **Route names vs navigation**: The routes use hyphens (`list-actors`, `add-actor`, `delete-actor`). Ensure navigation calls match exactly:
  ```ts
  this.router.navigate(['/list-actors']);
  ```
- **Standalone Pipe**: Because components import `PAgePipe` directly, mark the pipe `standalone: true`.
- **Angular Dev Server vs Express**: If you choose to run `ng serve` separately (on port 4200) instead of serving the build from Express, you’ll need **CORS** or a proxy. This README assumes Express serves the built Angular app.
- **Populate in `getOne`**: The sample uses `.populate('movies')`, which only works if your schema has a `movies` ref field. It’s commented in this README for clarity.
- **MongoDB**: Ensure your local Mongo instance is running before starting the Node server.

---

Happy hacking! 🎬

