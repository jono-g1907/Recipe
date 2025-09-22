# Student Registry Application Tutorial (Mongoose + Express + EJS + Node)

Learn to build a complete CRUD application using **Mongoose**, **Express.js**, **EJS**, and **Node.js**.

---

## Table of Contents
1. [Introduction](#1-introduction)  
2. [Prerequisites](#2-prerequisites)  
3. [Project Setup](#3-project-setup)  
4. [Mongoose Setup](#4-mongoose-setup)  
5. [Express Server Setup](#5-express-server-setup)  
6. [EJS Templates](#6-ejs-templates)  
7. [CRUD Operations](#7-crud-operations)  
8. [Testing the Application](#8-testing-the-application)  
9. [Conclusion](#9-conclusion)

---

## 1. Introduction
In this tutorial, you'll learn how to build a complete **Student Registry** application using modern web development technologies:

- **Mongoose** — Elegant MongoDB object modeling for Node.js with built-in type casting, validation, and more  
- **Express.js** — Fast, minimalist web framework for Node.js  
- **EJS** — Embedded JavaScript templating engine for dynamic HTML  
- **Node.js** — JavaScript runtime for server-side development

**What you'll build:** A web application that allows you to add, view, edit, and delete student records with features like student ID, name, email, and course information.

---

## 2. Prerequisites
Before starting this tutorial, make sure you have:

- Node.js (v14 or higher) installed on your computer  
- MongoDB installed locally or access to MongoDB Atlas  
- Basic knowledge of JavaScript  
- Understanding of HTML and CSS  
- A code editor (VS Code recommended)

**Check your installations:**
```bash
# Versions
node --version
npm --version
mongod --version
```

---

## 3. Project Setup

### 1) Create a new project directory
```bash
mkdir student-registry
cd student-registry
```

### 2) Initialize npm and install dependencies
```bash
npm init -y
npm install express mongoose ejs bootstrap
npm install --save-dev nodemon
```

### 3) Create the following project structure
Create the following folders and files in your project directory:

```
student-registry/
├── app.js              # Main application file
├── db/
│   └── connection.js   # Mongoose connection
├── models/
│   └── Student.js      # Student model
├── routes/
│   └── students.js     # Student routes
├── views/
│   ├── partials/       # Reusable template parts
│   │   ├── header.ejs  # Header partial
│   │   └── footer.ejs  # Footer partial
│   ├── students.ejs    # Students list
│   ├── add.ejs         # Add student form
│   └── edit.ejs        # Edit student form
├── public/
│   ├── css/            # Custom stylesheets (optional)
│   └── js/             # Custom JavaScript (optional)
└── package.json        # Project dependencies
```

> **Note about Bootstrap:** Bootstrap CSS and JavaScript files will be served directly from the `node_modules` folder, so you don't need to copy them to the `public` folder. The Express server will handle this automatically.

> **Windows users:** Use your file explorer or code editor to create these folders and files. You can also use these commands:  
> • Create folders: `mkdir foldername`  
> • Create files: Use your code editor to create and save empty files

---

## 4. Mongoose Setup

### 1) Create Mongoose Connection
Create `db/connection.js`:

```js
const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/student_registry';

async function connectToMongoDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB via Mongoose');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = { connectToMongoDB };
```

**How this code works:** This connection file uses Mongoose to connect to MongoDB with a simple approach. Mongoose automatically handles database selection through the connection string. The `connectToMongoDB()` function uses `mongoose.connect()` to establish the connection. Event listeners handle connection states (connected, error, disconnected) for better monitoring. The graceful shutdown handler ensures the connection is properly closed when the application exits.

**Understanding the Mongoose Connection:**
- `mongoose`: ODM (Object Document Mapper) for MongoDB and Node.js  
- `mongoURI`: MongoDB connection string with database name included  
- `connectToMongoDB()`: Function to establish Mongoose connection  
- Event Listeners: Monitor connection state changes  
- Graceful Shutdown: Properly closes connection on app termination

---

### 2) Create Student Schema and Model
Create `models/Student.js`:

```js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/, 'Please enter a valid email']
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    enum: {
      values: ['Computer Science', 'Information Technology', 'Software Engineering', 'Data Science'],
      message: 'Please select a valid course'
    }
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1, 'Year must be between 1 and 4'],
    max: [4, 'Year must be between 1 and 4']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Create indexes for better query performance
studentSchema.index({ studentId: 1 });
studentSchema.index({ email: 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
studentSchema.set('toJSON', {
  virtuals: true
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
```

**How this works:** This file defines a Mongoose schema that provides structure and validation to our student documents. Required fields ensure data completeness; unique indexes prevent duplicates. Built-in validators like `minlength`, `maxlength`, and a regex ensure data quality. The `enum` validator restricts course values to predefined options. `timestamps` adds `createdAt` and `updatedAt`. Virtual fields like `fullName` provide computed properties without storing extra data.

**Understanding Mongoose Schema Features:**
- Field Types: String, Number, Date, Boolean, ObjectId, etc.  
- Validation: required, unique, min, max, regex, etc.  
- Indexes: Improve query performance for frequently searched fields  
- Virtuals: Computed properties that don't persist to MongoDB  
- Timestamps: Automatic `createdAt` and `updatedAt` tracking  
- Middleware: Pre/post hooks for document operations

---

## 5. Express Server Setup

### 1) Create the main application file
Create `app.js`:

```js
const express = require('express');
const path = require('path');
const { connectToMongoDB } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve Bootstrap CSS
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));

// Serve Bootstrap JavaScript
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

// Routes
const studentRoutes = require('./routes/students');
app.use('/students', studentRoutes);

// Home route
app.get('/', (req, res) => {
  res.redirect('/students');
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectToMongoDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 2) Update `package.json` scripts
Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

> **How this works:** These npm scripts provide convenient commands to run your application. `"dev"` uses nodemon to auto-restart during development.

> **Important:** Make sure MongoDB is running. If using MongoDB Atlas, replace the connection string with your Atlas connection string.

---

## 6. EJS Templates

### 1) Create the layout partial — `views/partials/header.ejs`
```ejs
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - Student Registry</title>
  <link href="/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand" href="/">Student Registry</a>
      <div class="navbar-nav">
        <a class="nav-link" href="/students">All Students</a>
        <a class="nav-link" href="/students/add">Add Student</a>
      </div>
    </div>
  </nav>
  <div class="container mt-4">
```

**How this works:** This header partial contains the HTML head section and navigation bar shared across pages. `<%= title %>` inserts the page title passed from the server.

---

### 2) Create the footer partial — `views/partials/footer.ejs`
```ejs
  </div>
  <footer class="bg-light text-center py-3 mt-5">
    <p>&copy; 2025 Student Registry Application</p>
  </footer>
  <script src="/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

**How this works:** Closes the layout, adds a footer, and includes Bootstrap JavaScript for interactive components.

---

### 3) Create the students list view — `views/students.ejs`
```ejs
<%- include('partials/header', { title: 'All Students' }) %>

<div class="d-flex justify-content-between align-items-center mb-4">
  <h2>All Students</h2>
  <a href="/students/add" class="btn btn-success">+ Add New Student</a>
</div>

<% if (students.length === 0) { %>
  <div class="alert alert-info">
    No students found. <a href="/students/add">Add the first student</a>
  </div>
<% } else { %>
  <div class="table-responsive">
    <table class="table table-striped table-hover">
      <thead class="table-dark">
        <tr>
          <th>Student ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Course</th>
          <th>Year</th>
          <th>Enrollment Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <% students.forEach(student => { %>
          <tr>
            <td><%= student.studentId %></td>
            <td><%= student.firstName %> <%= student.lastName %></td>
            <td><%= student.email %></td>
            <td><%= student.course %></td>
            <td><%= student.year %></td>
            <td><%= student.enrollmentDate.toLocaleDateString() %></td>
            <td>
              <a href="/students/<%= student._id %>/edit" class="btn btn-sm btn-warning">Edit</a>
              <form method="POST" action="/students/<%= student._id %>/delete" style="display: inline;">
                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
              </form>
            </td>
          </tr>
        <% }); %>
      </tbody>
    </table>
  </div>
<% } %>

<%- include('partials/footer') %>
```

**How this works:** Displays all students in a responsive table. Uses EJS conditionals and loops to render data and action buttons.

---

### 4) Create the add student form — `views/add.ejs`
```ejs
<%- include('partials/header', { title: 'Add Student' }) %>

<h2>Add New Student</h2>

<form method="POST" action="/students">
  <div class="row">
    <div class="col-md-6">
      <div class="mb-3">
        <label for="studentId" class="form-label">Student ID</label>
        <input type="text" class="form-control" id="studentId" name="studentId" required>
      </div>
    </div>
    <div class="col-md-6">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" class="form-control" id="email" name="email" required>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-6">
      <div class="mb-3">
        <label for="firstName" class="form-label">First Name</label>
        <input type="text" class="form-control" id="firstName" name="firstName" required>
      </div>
    </div>
    <div class="col-md-6">
      <div class="mb-3">
        <label for="lastName" class="form-label">Last Name</label>
        <input type="text" class="form-control" id="lastName" name="lastName" required>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-6">
      <div class="mb-3">
        <label for="course" class="form-label">Course</label>
        <select class="form-control" id="course" name="course" required>
          <option value="">Select a course</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Software Engineering">Software Engineering</option>
          <option value="Data Science">Data Science</option>
        </select>
      </div>
    </div>
    <div class="col-md-6">
      <div class="mb-3">
        <label for="year" class="form-label">Year</label>
        <select class="form-control" id="year" name="year" required>
          <option value="">Select year</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>
      </div>
    </div>
  </div>

  <div class="mb-3">
    <button type="submit" class="btn btn-primary">Add Student</button>
    <a href="/students" class="btn btn-secondary">Cancel</a>
  </div>
</form>

<%- include('partials/footer') %>
```

**How this works:** Standard HTML form with Bootstrap grid and required fields. Submits via POST to `/students`.

---

### 5) Create the edit student form — `views/edit.ejs`
```ejs
<%- include('partials/header', { title: 'Edit Student' }) %>

<h2>Edit Student</h2>

<form method="POST" action="/students/<%= student._id %>/update">
  <div class="row">
    <div class="col-md-6">
      <div class="mb-3">
        <label for="studentId" class="form-label">Student ID</label>
        <input type="text" class="form-control" id="studentId" name="studentId" value="<%= student.studentId %>" required>
      </div>
    </div>
    <div class="col-md-6">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" class="form-control" id="email" name="email" value="<%= student.email %>" required>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-6">
      <div class="mb-3">
        <label for="firstName" class="form-label">First Name</label>
        <input type="text" class="form-control" id="firstName" name="firstName" value="<%= student.firstName %>" required>
      </div>
    </div>
    <div class="col-md-6">
      <div class="mb-3">
        <label for="lastName" class="form-label">Last Name</label>
        <input type="text" class="form-control" id="lastName" name="lastName" value="<%= student.lastName %>" required>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-6">
      <div class="mb-3">
        <label for="course" class="form-label">Course</label>
        <select class="form-control" id="course" name="course" required>
          <option value="Computer Science" <%= student.course === 'Computer Science' ? 'selected' : '' %>>Computer Science</option>
          <option value="Information Technology" <%= student.course === 'Information Technology' ? 'selected' : '' %>>Information Technology</option>
          <option value="Software Engineering" <%= student.course === 'Software Engineering' ? 'selected' : '' %>>Software Engineering</option>
          <option value="Data Science" <%= student.course === 'Data Science' ? 'selected' : '' %>>Data Science</option>
        </select>
      </div>
    </div>
    <div class="col-md-6">
      <div class="mb-3">
        <label for="year" class="form-label">Year</label>
        <select class="form-control" id="year" name="year" required>
          <option value="1" <%= student.year === 1 ? 'selected' : '' %>>Year 1</option>
          <option value="2" <%= student.year === 2 ? 'selected' : '' %>>Year 2</option>
          <option value="3" <%= student.year === 3 ? 'selected' : '' %>>Year 3</option>
          <option value="4" <%= student.year === 4 ? 'selected' : '' %>>Year 4</option>
        </select>
      </div>
    </div>
  </div>

  <div class="mb-3">
    <button type="submit" class="btn btn-primary">Update Student</button>
    <a href="/students" class="btn btn-secondary">Cancel</a>
  </div>
</form>

<%- include('partials/footer') %>
```

**How this works:** Similar to the add form but pre-fills fields with existing data and posts to `/students/:id/update`.

---

## 7. CRUD Operations

### 1) Create the routes file
Create `routes/students.js`:

```js
const express = require('express');
const Student = require('../models/Student');

const router = express.Router();

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({})
      .sort({ enrollmentDate: -1 })
      .exec();
    res.render('students', { students });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// GET add student form
router.get('/add', (req, res) => {
  res.render('add');
});

// POST create new student
router.post('/', async (req, res) => {
  try {
    const { studentId, firstName, lastName, email, course, year } = req.body;

    // Create new student instance
    const newStudent = new Student({
      studentId,
      firstName,
      lastName,
      email,
      course,
      year: parseInt(year)
    });

    await newStudent.save();
    res.redirect('/students');
  } catch (error) {
    console.error(error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).send(`Validation Error: ${errors.join(', ')}`);
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).send(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
    }

    res.status(500).send('Server Error');
  }
});

// GET edit student form
router.get('/:id/edit', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).send('Student not found');
    }
    res.render('edit', { student });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// POST update student
router.post('/:id/update', async (req, res) => {
  try {
    const { studentId, firstName, lastName, email, course, year } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        studentId,
        firstName,
        lastName,
        email,
        course,
        year: parseInt(year)
      },
      {
        new: true,              // Return the updated document
        runValidators: true     // Run schema validation
      }
    );

    if (!updatedStudent) {
      return res.status(404).send('Student not found');
    }

    res.redirect('/students');
  } catch (error) {
    console.error(error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).send(`Validation Error: ${errors.join(', ')}`);
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).send(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
    }

    res.status(500).send('Server Error');
  }
});

// POST delete student
router.post('/:id/delete', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    if (!deletedStudent) {
      return res.status(404).send('Student not found');
    }

    res.redirect('/students');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
```

**How this code works:** This routes file defines all server endpoints for student operations using the Mongoose model. Each handler is `async` and uses `try/catch` to handle validation and duplicate-key errors explicitly.

---

### 2) Understanding Mongoose Query Examples
Here are some common Mongoose operations you can use in your Node.js application:

```js
// Import the Student model
const Student = require('./models/Student');

// Find all students
const students = await Student.find();

// Find students by course
const csStudents = await Student.find({ course: 'Computer Science' });

// Find students by year with sorting
const firstYearStudents = await Student.find({ year: 1 }).sort({ lastName: 1 });

// Count total students
const studentCount = await Student.countDocuments();

// Find one student by studentId
const student = await Student.findOne({ studentId: 'STU001' });

// Find student by MongoDB ObjectId
const studentById = await Student.findById(studentObjectId);

// Create a new student
const newStudent = new Student({
  studentId: 'STU002',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  course: 'Data Science',
  year: 2
});
await newStudent.save();

// Or create using Student.create()
const anotherStudent = await Student.create({
  studentId: 'STU003',
  firstName: 'Bob',
  lastName: 'Johnson',
  email: 'bob.johnson@example.com',
  course: 'Information Technology',
  year: 3
});

// Update a student's year
const updated = await Student.findByIdAndUpdate(
  studentId,
  { year: 3 },
  { new: true, runValidators: true }
);

// Update using findOneAndUpdate
await Student.findOneAndUpdate(
  { studentId: 'STU001' },
  { $set: { year: 4 } },
  { new: true }
);

// Delete a student by ID
await Student.findByIdAndDelete(studentId);

// Delete using findOneAndDelete
await Student.findOneAndDelete({ studentId: 'STU001' });

// Advanced queries with multiple conditions
const seniors = await Student.find({
  $and: [
    { year: { $gte: 3 } },
    { course: { $in: ['Computer Science', 'Software Engineering'] } }
  ]
});

// Query with regex (case-insensitive search)
const johnStudents = await Student.find({
  firstName: { $regex: /john/i }
});

// Use virtual field (fullName)
students.forEach(student => {
  console.log(student.fullName);
});
```

**How these commands work:** These are Mongoose operations you use within your Node.js application code. They benefit from schema validation, type casting, middleware, and better errors. All return Promises, so use `await`.

**Common Mongoose Query Methods:**
- Finding: `find()`, `findOne()`, `findById()`  
- Creating: `new Model() + save()`, `create()`  
- Updating: `findByIdAndUpdate()`, `findOneAndUpdate()`  
- Deleting: `findByIdAndDelete()`, `findOneAndDelete()`  
- Counting: `countDocuments()`, `estimatedDocumentCount()`  
- Sorting: `.sort()`; Limiting: `.limit()`

---

## 8. Testing the Application

### 1) Start MongoDB
```bash
# If using local MongoDB
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

### 2) Run the application
```bash
# For development with auto-restart
npm run dev

# Or for production
npm start
```

### 3) Test the features
- Open your browser and go to `http://localhost:3000`  
- You should see the student registry homepage  
- Click **"Add New Student"** to test **CREATE**  
- Fill in the form and submit to add a student  
- Test the **EDIT** functionality by clicking **Edit** on a student  
- Test the **DELETE** functionality by clicking **Delete** on a student

---

## 9. Conclusion
You now have a complete CRUD application using Mongoose, Express, EJS, and Node. Drop these files into a fresh repo and iterate. For production, consider environment variables (`dotenv`), centralized error pages, and flash messages for better UX.
