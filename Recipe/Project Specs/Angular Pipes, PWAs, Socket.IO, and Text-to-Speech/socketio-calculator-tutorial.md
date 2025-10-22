# Socket.io Calculator Tutorial

Build a real-time calculator using Socket.io with Angular frontend and Node.js backend.

## Table of Contents
1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Node.js Backend Setup](#3-nodejs-backend-setup)
4. [Angular Frontend Setup](#4-angular-frontend-setup)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Running the Application](#7-running-the-application)

---

## 1. Introduction
This tutorial teaches you to build a real-time calculator using Socket.io for communication between an Angular frontend and Node.js backend. You'll learn:

- **Socket.io Integration** — Real-time bidirectional communication  
- **Angular Socket Client** — Connecting Angular app to Socket.io server  
- **Node.js Socket Server** — Handling Socket.io connections and events  
- **Event-Based Architecture** — Emit and listen to custom events  
- **Real-time Calculations** — Send inputs and receive results instantly  

**What you'll build:** A simple calculator where users enter two numbers and select an operation. The Angular app sends these values to the Node.js backend via Socket.io, which performs the calculation and sends the result back in real time.

**Architecture:** This tutorial demonstrates client–server communication using Socket.io events without any database persistence.

---

## 2. Prerequisites
Before starting this Socket.io tutorial, make sure you have:

- **Node.js v18 or higher** — Required for Socket.io and Angular  
- **Angular CLI** — Install: `npm install -g @angular/cli@latest`  
- **Socket.io knowledge** — Basic understanding of WebSocket communication  
- **Basic understanding of JavaScript/TypeScript and Angular**  
- **Text editor or IDE** (VS Code recommended)

**Version Requirements:**
- **Node.js:** Run `node --version` (must be v18+)  
- **Angular CLI:** Run `ng --version` (should be latest)  
- **Socket.io:** We'll use **v4.x** (latest stable version)

---

## 3. Node.js Backend Setup

### 1) Create Backend Directory
```bash
mkdir socketio-calculator
cd socketio-calculator
mkdir backend
cd backend
```

### 2) Initialize Node.js Project
```bash
npm init -y
```

### 3) Install Backend Dependencies
```bash
npm install express socket.io cors
```

**Dependencies explained:**
- `express`: Web framework for Node.js  
- `socket.io`: Real-time bidirectional communication  
- `cors`: Enable Cross-Origin Resource Sharing

### 4) Backend Project Structure
```
backend/
├── package.json
├── server.js
└── node_modules/
```

---

## 4. Angular Frontend Setup

### 1) Create Angular Project
> From the **main project directory**:
```bash
cd ..
ng new frontend --standalone --routing=false --style=css
cd frontend
```

### 2) Install Frontend Dependencies
```bash
npm install socket.io-client bootstrap
```

**Dependencies explained:**
- `socket.io-client`: Socket.io client library for Angular  
- `bootstrap`: CSS framework for styling

### 3) Configure Bootstrap in `angular.json`
Add Bootstrap CSS to your `angular.json` file:
```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

### 4) Project Structure
```
socketio-calculator/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── node_modules/
└── frontend/
    ├── src/app/
    │   ├── app.ts
    │   ├── app.html
    │   └── app.css
    └── package.json
```

---

## 5. Backend Implementation

### 1) Create `server.js`
Create `backend/server.js`:
```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

// Enable CORS for Express
app.use(cors());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for calculation requests
  socket.on('calculate', (data) => {
    console.log('Received calculation request:', data);
    
    const { num1, num2, operation } = data;
    
    // Convert strings to numbers
    const number1 = parseFloat(num1);
    const number2 = parseFloat(num2);
    
    // Validate inputs
    if (isNaN(number1) || isNaN(number2)) {
      socket.emit('result', {
        success: false,
        error: 'Invalid numbers provided'
      });
      return;
    }

    let result;
    let success = true;
    let error = null;

    // Perform calculation based on operation
    switch (operation) {
      case 'add':
        result = number1 + number2;
        break;
      case 'subtract':
        result = number1 - number2;
        break;
      case 'multiply':
        result = number1 * number2;
        break;
      case 'divide':
        if (number2 === 0) {
          success = false;
          error = 'Division by zero is not allowed';
        } else {
          result = number1 / number2;
        }
        break;
      default:
        success = false;
        error = 'Invalid operation';
    }

    // Send result back to client
    if (success) {
      socket.emit('result', {
        success: true,
        result: result,
        operation: operation,
        num1: number1,
        num2: number2
      });
    } else {
      socket.emit('result', {
        success: false,
        error: error
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
```

**Backend Features:**
- **Socket.io Server:** Handles real-time connections  
- **CORS Configuration:** Allows Angular app to connect  
- **`calculate` Event:** Listens for calculation requests  
- **`result` Event:** Emits calculation results or errors  
- **Input Validation:** Validates numbers and operations  
- **Error Handling:** Handles division by zero and invalid inputs

---

## 6. Frontend Implementation

### 1) Update `app.ts`
Update `src/app/app.ts`:
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  private socket: Socket;
  
  // Form data
  num1: string = '';
  num2: string = '';
  operation: string = 'add';
  
  // Result data
  result: number | null = null;
  error: string = '';
  isLoading: boolean = false;
  lastCalculation: string = '';
  
  // Connection status
  isConnected: boolean = false;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  ngOnInit(): void {
    // Handle connection
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    // Handle disconnection
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    // Listen for calculation results
    this.socket.on('result', (data: any) => {
      console.log('Received result:', data);
      this.isLoading = false;
      
      if (data.success) {
        this.result = data.result;
        this.error = '';
        this.lastCalculation = `${data.num1} ${this.getOperationSymbol(data.operation)} ${data.num2} = ${data.result}`;
      } else {
        this.result = null;
        this.error = data.error;
        this.lastCalculation = '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  calculate(): void {
    // Reset previous results
    this.result = null;
    this.error = '';
    this.isLoading = true;
    this.lastCalculation = '';

    // Emit calculation request to server
    this.socket.emit('calculate', {
      num1: this.num1,
      num2: this.num2,
      operation: this.operation
    });
  }

  clear(): void {
    this.num1 = '';
    this.num2 = '';
    this.operation = 'add';
    this.result = null;
    this.error = '';
    this.lastCalculation = '';
    this.isLoading = false;
  }

  isFormValid(): boolean {
    return String(this.num1).trim() !== '' && String(this.num2).trim() !== '' && this.isConnected;
  }

  private getOperationSymbol(operation: string): string {
    switch (operation) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '?';
    }
  }
}
```

**Component Features:**
- **Socket.io Client:** Connects to the backend server  
- **Real-time Communication:** Emits and listens to events  
- **Form Validation:** Validates inputs before sending  
- **Connection Status:** Shows connection state to user  
- **Loading State:** Provides feedback during calculations  
- **Error Handling:** Displays server-side errors

### 2) Create `app.html`
Create `src/app/app.html`:
```html
<div class="container mt-4">
  <div class="row justify-content-center">
    <div class="col-md-6">
      <h1 class="text-center mb-4">
        <span class="socketio-highlight">Socket.io</span> Calculator
      </h1>

      <!-- Connection Status -->
      <div class="alert" [class.alert-success]="isConnected" [class.alert-danger]="!isConnected" role="alert">
        <strong>Connection Status:</strong> 
        @if(isConnected){
        <span>✅ Connected to server</span>
        }@else{
        <span>❌ Disconnected from server</span>
        }
      </div>

      <!-- Calculator Form -->
      <div class="card mb-4">
        <div class="card-header">
          <h4>Calculator</h4>
        </div>
        <div class="card-body">
          <form (ngSubmit)="calculate()">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="num1" class="form-label">First Number</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="num1"
                    [(ngModel)]="num1"
                    name="num1"
                    placeholder="Enter first number"
                    step="any"
                    required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="num2" class="form-label">Second Number</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="num2"
                    [(ngModel)]="num2"
                    name="num2"
                    placeholder="Enter second number"
                    step="any"
                    required>
                </div>
              </div>
            </div>
            
            <div class="mb-3">
              <label for="operation" class="form-label">Operation</label>
              <select 
                class="form-control" 
                id="operation"
                [(ngModel)]="operation"
                name="operation">
                <option value="add">Addition (+)</option>
                <option value="subtract">Subtraction (-)</option>
                <option value="multiply">Multiplication (×)</option>
                <option value="divide">Division (÷)</option>
              </select>
            </div>
            
            <div class="mb-3">
              <button 
                type="submit" 
                class="btn btn-primary me-2"
                [disabled]="!isFormValid() || isLoading">
                @if(isLoading){
                <span>Calculating...</span>
                }@else{
                <span>Calculate</span>
                }
              </button>
              <button 
                type="button" 
                class="btn btn-secondary"
                (click)="clear()">
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Results -->
      @if(result !== null || error){
      <div class="card">
        <div class="card-header">
          <h4>Result</h4>
        </div>
        <div class="card-body">
          <!-- Success Result -->
          @if(result !== null){
          <div class="alert alert-success">
            <h5>✅ Calculation Successful</h5>
            <p class="mb-1"><strong>Calculation:</strong> {{ lastCalculation }}</p>
            <p class="mb-0"><strong>Result:</strong> <span class="h4">{{ result }}</span></p>
          </div>
          }

          <!-- Error Result -->
          @if(error){
          <div *ngIf="error" class="alert alert-danger">
            <h5>❌ Calculation Error</h5>
            <p class="mb-0"><strong>Error:</strong> {{ error }}</p>
          </div>
          }
        </div>
      </div>
      }

      <!-- Loading Indicator -->
      @if(isLoading){
      <div *ngIf="isLoading" class="text-center mt-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Sending calculation to server...</p>
      </div>
      }
    </div>
  </div>
</div>
```

**Template Features:**
- **Connection Status:** Visual indicator of Socket.io connection  
- **Reactive Form:** Two-way data binding with validation  
- **Loading States:** Shows progress during calculations  
- **Result Display:** Shows successful results or errors  
- **Bootstrap Styling:** Responsive and professional layout

### 3) Add CSS Styling
Update `src/app/app.css`:
```css
.socketio-highlight {
  background: #17a2b8;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.card {
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.btn-primary {
  background-color: #17a2b8;
  border-color: #17a2b8;
}

.btn-primary:hover {
  background-color: #138496;
  border-color: #117a8b;
}

.form-control:focus {
  border-color: #17a2b8;
  box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25);
}

.spinner-border {
  width: 2rem;
  height: 2rem;
}
```

---

## 7. Running the Application

### 1) Start the Backend Server
> In the **backend** directory:
```bash
cd backend
node server.js
```
You should see:
```
Socket.io server running on port 3000
```

### 2) Start the Angular Frontend
> In a new terminal, in the **frontend** directory:
```bash
cd frontend
ng serve
```
Angular will start on `http://localhost:4200`.

### 3) Test the Socket.io Communication
- Open `http://localhost:4200` in your browser  
- Verify the connection status shows **“✅ Connected to server”**  
- Enter two numbers (e.g., 10 and 5)  
- Select an operation (e.g., Addition)  
- Click **Calculate** and see the real-time result  
- Try different operations and numbers  
- Test error cases like division by zero

### 4) Monitor Socket.io Events
In your backend terminal, you'll see:
```text
# When user connects:
A user connected: [socket-id]

# When calculation is requested:
Received calculation request: { num1: '10', num2: '5', operation: 'add' }

# When user disconnects:
User disconnected: [socket-id]
```

---

🎉 **Success!** You now have a working Socket.io calculator that demonstrates real-time communication between an Angular frontend and Node.js backend. The app shows live connection status, handles calculations instantly, and provides proper error handling.
