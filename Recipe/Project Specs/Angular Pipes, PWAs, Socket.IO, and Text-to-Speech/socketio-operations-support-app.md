# Part IV: Socket.io — Operations Support App

Build an application where users request support for an arithmetic operation and everyone can share their results in real-time using **Socket.io**.

---

## Frontend (Angular)

### 1) Scaffold & Dependencies

```bash
# Create the Angular app
ng n week10LabSocket

# Install dependencies
npm install express
npm install socket.io-client
npm install @types/socket.io-client
```

### 2) `app.ts` (root component)

```ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { io } from 'socket.io-client';

interface Result {
  name: string;
  value: number
}

interface Operation {
  name: string;
  opt:string;
  isOptActive: boolean;
  result: number;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'week11app';
  userName = '';
  results: Result[] = [];
  result: Result = { name: '', value: 0 };
  operation: Operation = { name: '', isOptActive: false, opt: '', result: 0 };
  socket: any;

  constructor() {
    this.socket = io();
  }
  ngOnInit() {
    this.listen2Events();
  }

  listen2Events() {
    this.socket.on("onResult", (data: Result) => {
      this.results.push(data);
    });

    this.socket.on("onOperation", (data: Operation) => {
      this.operation = data;
      this.results=[];
    });
  }

  sendOperation() {
    this.socket.emit("operation", this.operation);
  }

  sendResult() {
    let obj = {
      name: this.userName,
      value: this.result.value
    }
    this.socket.emit("result", obj);
  }
}
```

### 3) `app.html` (template)

```html
<form class="m-4 ">
  <div class="form-group py-sm-3 mb-0">
    <label for="name">Name</label>
    <input type="text" class="form-control" id="name" placeholder="Your Name" name="name" [(ngModel)]="userName">
  </div>
  @if(!operation.isOptActive){
  <div>
    <div class="form-group py-sm-3 mb-0">
      <label for="car">Operation</label>
      <input type="text" class="form-control" id="car" name="description" placeholder="operation Description"
        [(ngModel)]="operation.opt">
    </div>
    <div class="form-group py-sm-3  mb-sm-3">
      <label for="target">Result</label>
      <input type="number" class="form-control mb-sm-3" id="target" name="target" [(ngModel)]="operation.result">
    </div>
    <button (click)="sendOperation()" type="submit" class="btn btn-primary">New operation</button>
  </div>
  }
</form>


<!-- <hr class="rounded"> -->
@if(operation.isOptActive){
<div>
  <form class="m-4 ">
    <div>
      <h2>Operation:{{operation.opt}}</h2>
    </div>

    <div class="form-group py-sm-3  mb-sm-3">
      <label for="target">Your Result</label>
      <input type="number" class="form-control mb-sm-3" id="target" name="value" [(ngModel)]="result.value">
    </div>
    <button type="submit" class="btn btn-primary" (click)="sendResult()">Send Result</button>
  </form>

  <table class="table">
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">Name</th>
        <th scope="col">Result</th>
      </tr>
    </thead>
    <tbody>
      @for(result of results; track result; let i = $index){
      <tr>
        <td>{{i+1}}</td>
        <td>{{result.name}}</td>
        <td>{{result.value}}</td>
      </tr>
    }
    </tbody>
  </table>

</div>
}
```

---

## Backend Server

The backend maintains a single `operation` object tracking the current operation, whether it’s active, and the expected result.

- **On client connect**: emit the current operation via `onOperation`.
- **On `operation` event**: mark as active and broadcast the operation to all clients.
- **On `result` event**: broadcast the submitted result to all clients; if it matches the expected result, mark the operation inactive and reset it, then broadcast the updated (inactive) state.

> **File:** `backend/app.js`

```js
const express = require("express");
const path = require("path");
const app = express();
const server = require("http").Server(app);

const io = require("socket.io")(server);

const port = 8080;

let operation = {
  operation: "",
  isOptActive: false,
  result: 0,
};
app.use(express.static("./dist/week10LabSocket/browser"));

io.on("connection", (socket) => {
  socket.emit("onOperation", operation);

  socket.on("operation", (data) => {
    data.isOptActive = true;
    operation = data;
    io.emit("onOperation", operation);
  });

  socket.on("result", (data) => {
    io.emit("onResult", data);
    if (operation.result == data.value) {
      operation.isOptActive = false;
      operation.opt = "";
      operation.name = "";
      operation.result = 0;
      io.emit("onOperation", operation);
    }
  });
});

server.listen(port, () => {
  console.log("Listening on port " + port);
});
```

---

## Build & Run

From the Angular project root:

```bash
# Build the Angular app for production
ng build

# Start the backend (from project root if backend/app.js exists there)
node .\backend\app.js
```

Now open your browser to the backend’s host (default `http://localhost:8080`) to serve the built Angular app and connect clients via Socket.io.
