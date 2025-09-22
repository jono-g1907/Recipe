# Task 2 — Data Model Implementation & JavaScript Fundamentals (Printable)

**Unit:** FIT2095 — Full‑Stack Development  
**Prepared for:** Coursework repository inclusion and printing  
**Author (Sample Data):** Jonathan Gan — **ID:** 31477046

---

> **About this document**  
> This Markdown is a clean, print‑friendly transcription of the provided brief for **Task 2** plus accompanying JavaScript fundamentals and backend exercises. Obvious typos and broken code from the source have been corrected so examples will run as‑is.

---

## 1) Task 2: Data Model Implementation

Create **JavaScript classes or object structures** to represent the **Recipe** and **InventoryItem** entities defined in the *Data Model* section of your project specification (see `project.pdf`).

### Requirements
- Implement **all attributes** defined in the data model tables.  
- Include **data validation** and simple **data manipulation** methods.  
- **Initialise** the application with sample data that includes:
  - Name: `Jonathan Gan`
  - ID: `31477046`

> **Tip**: Keep validation close to data creation; throw descriptive errors on invalid attributes.

### Example Skeletons (fill attributes per your project’s data tables)
```js
// models/Recipe.js
export class Recipe {
  /**
   * @param {object} props
   */
  constructor(props) {
    const {
      id, name, ingredients, instructions,
      servings, createdAt, updatedAt, ...rest
    } = props ?? {};

    // --- Minimal sample validations (expand per your data table) ---
    if (!id || typeof id !== "string") throw new Error("Recipe.id is required (string).");
    if (!name || typeof name !== "string") throw new Error("Recipe.name is required (string).");
    if (!Array.isArray(ingredients)) throw new Error("Recipe.ingredients must be an array.");
    if (!instructions || typeof instructions !== "string") throw new Error("Recipe.instructions is required (string).");
    if (servings != null && (!Number.isFinite(servings) || servings <= 0))
      throw new Error("Recipe.servings must be a positive number if provided.");

    this.id = id;
    this.name = name;
    this.ingredients = ingredients;
    this.instructions = instructions;
    this.servings = servings ?? 1;
    this.createdAt = createdAt ?? new Date().toISOString();
    this.updatedAt = updatedAt ?? this.createdAt;

    // Capture any additional attributes defined in your model table
    Object.assign(this, rest);
  }

  update(patch) {
    Object.assign(this, patch);
    this.updatedAt = new Date().toISOString();
  }
}
```

```js
// models/InventoryItem.js
export class InventoryItem {
  /**
   * @param {object} props
   */
  constructor(props) {
    const { id, name, quantity, unit, location, expiresAt, ...rest } = props ?? {};

    if (!id || typeof id !== "string") throw new Error("InventoryItem.id is required (string).");
    if (!name || typeof name !== "string") throw new Error("InventoryItem.name is required (string).");
    if (!Number.isFinite(quantity) || quantity < 0) throw new Error("InventoryItem.quantity must be ≥ 0.");
    if (unit && typeof unit !== "string") throw new Error("InventoryItem.unit must be a string when provided.");
    if (expiresAt && Number.isNaN(Date.parse(expiresAt))) throw new Error("InventoryItem.expiresAt must be ISO date.");

    this.id = id;
    this.name = name;
    this.quantity = quantity;
    this.unit = unit ?? "unit";
    this.location = location ?? "pantry";
    this.expiresAt = expiresAt ?? null;

    Object.assign(this, rest);
  }

  add(n) { this.quantity = Math.max(0, this.quantity + Number(n || 0)); }
  remove(n) { this.quantity = Math.max(0, this.quantity - Number(n || 0)); }
  isExpired(now = new Date()) {
    return this.expiresAt ? new Date(this.expiresAt) < now : false;
  }
}
```

```js
// seed/sampleData.js
import { Recipe } from "./models/Recipe.js";
import { InventoryItem } from "./models/InventoryItem.js";

export const student = { name: "Jonathan Gan", id: "31477046" };

export const inventory = [
  new InventoryItem({ id: "inv-001", name: "Flour", quantity: 2, unit: "kg" }),
  new InventoryItem({ id: "inv-002", name: "Eggs", quantity: 12, unit: "pcs" }),
];

export const recipes = [
  new Recipe({
    id: "rec-31477046-1",
    name: "Protein Oats",
    ingredients: ["Oats", "Milk", "Protein powder"],
    instructions: "Combine ingredients, simmer 5–7 minutes. Serve warm.",
    servings: 1,
  }),
];
```

<div style="page-break-after: always;"></div>

## 2) JavaScript Fundamentals

### Task 1: Environment Setup & Basic Output
Write a JavaScript program to display information and your details.

```js
// information display
console.log("=== Information ===");
console.log("Code: 2095");
console.log("Name: Full-Stack Development");
console.log("Name: Jonathan Gan");
console.log("ID: 31477046");
console.log("02, 2025");
```

**Explanation**: `console.log()` writes to the terminal/browser console—useful for tracing and debugging.

---

### Task 2: Date Manipulation & Formatting
```js
// Current moment
const currentDate = new Date();

// Extract components
const day = currentDate.getDate();
const month = currentDate.getMonth() + 1; // 0-11, so +1
const year = currentDate.getFullYear();
const hours = currentDate.getHours();
const minutes = currentDate.getMinutes();

// Formats
console.log("Custom Format: " + day + "/" + month + "/" + year);
console.log(`Template Literal Format: ${day}/${month}/${year} ${hours}:${minutes}`);
console.log("Locale String: " + currentDate.toLocaleString());
console.log("ISO Format: " + currentDate.toISOString());
```

**Explanation**: `Date` supports parsing/formatting; remember months are zero‑based.

---

### Task 3: Array Search Algorithm
```js
/**
 * Counts the number of times a specific element appears in an array
 * @param {Array} inputArray - The array to search through
 * @param {*} targetElement - The element to count
 * @returns {number} - The number of occurrences
 */
function countOccurrences(inputArray, targetElement) {
  let occurrenceCount = 0;
  for (let index = 0; index < inputArray.length; index++) {
    if (inputArray[index] === targetElement) {
      occurrenceCount++;
    }
    // Alternative: occurrenceCount += (inputArray[index] === targetElement);
  }
  return occurrenceCount;
}

// Tests
const sampleNumbers = [5, 2, 8, 2, 9, 1, 2, 7, 2, 3];
console.log(`Occurrences of 2: ${countOccurrences(sampleNumbers, 2)}`);

const mixedArray = ["apple", "banana", "apple", "orange", "apple"];
console.log(`Occurrences of 'apple': ${countOccurrences(mixedArray, "apple")}`);
```

**Explanation**: Linear scan, **O(n)** time. Uses strict equality `===`.

---

### Task 4: Frequency Analysis with Modern JavaScript
```js
/**
 * Analyze frequency of all elements in an array
 * @param {Array} dataArray
 */
function analyzeFrequency(dataArray) {
  console.log("\n=== Frequency Analysis ===");
  console.log(`Input Array: [${dataArray.join(", ")}]`);

  // Method 1: Plain object
  const frequencyMap = {};
  for (const element of dataArray) {
    frequencyMap[element] = frequencyMap[element] ? frequencyMap[element] + 1 : 1;
  }
  console.log("\nFrequency Results:");
  Object.entries(frequencyMap).forEach(([element, count]) => {
    console.log(`${element} --> ${count} occurrence(s)`);
  });

  // Method 2: ES6 Map (keeps insertion order)
  console.log("\nUsing ES6 Map approach:");
  const frequencyMapES6 = new Map();
  dataArray.forEach((el) => frequencyMapES6.set(el, (frequencyMapES6.get(el) || 0) + 1));

  const sortedResults = Array.from(frequencyMapES6.entries()).sort((a, b) => b[1] - a[1]);
  console.log("Sorted by frequency (highest first):");
  sortedResults.forEach(([element, count]) => console.log(`${element} --> ${count} occurrence(s)`));
}

// Demos
analyzeFrequency([3, 7, 3, 1, 4, 3, 7, 1, 4, 4]);
analyzeFrequency(["red", "blue", "red", "green", "blue", "red", "yellow"]);
```

**Concepts**: object/Map, `Object.entries`, `Array.from`, custom sort comparators, arrow functions.

<div style="page-break-after: always;"></div>

## 3) Stack Data Structure (LIFO)

```js
/**
 * Stack Data Structure (LIFO)
 * Common uses: function call management, undo, expression evaluation
 */
class Stack {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  get elements() { return [...this.items]; } // defensive copy
  isEmpty() { return this.items.length === 0; }

  push(element) {
    this.items.push(element);
    console.log(`Pushed '${element}' to stack. Size: ${this.size}`);
  }
  pop() {
    if (this.isEmpty()) {
      console.log("Cannot pop from empty stack");
      return undefined;
    }
    const popped = this.items.pop();
    console.log(`Popped '${popped}' from stack. Size: ${this.size}`);
    return popped;
  }
  peek() {
    if (this.isEmpty()) {
      console.log("Stack is empty - nothing to peek");
      return undefined;
    }
    return this.items[this.items.length - 1];
  }
  contains(element) { return this.items.includes(element); }
  display() {
    console.log("\n=== Stack Contents ===");
    if (this.isEmpty()) return void console.log("Stack is empty");
    console.log("Top");
    for (let i = this.items.length - 1; i >= 0; i--) console.log(`│ ${this.items[i]} │`);
    console.log("└───┘\nBottom");
  }
}

// Demo
const bookStack = new Stack();
console.log("=== Stack Operations Demo ===");
bookStack.push("JavaScript: The Good Parts");
bookStack.push("Clean Code");
bookStack.push("Design Patterns");
bookStack.push("Algorithms & Data Structures");
bookStack.display();
console.log(`\nTop book: ${bookStack.peek()}`);
console.log("\nRemoving books:");
bookStack.pop();
bookStack.pop();
bookStack.display();
console.log(`\nContains 'Clean Code'? ${bookStack.contains("Clean Code")}`);
console.log(`Contains 'Python Guide'? ${bookStack.contains("Python Guide")}`);
console.log(`\nStack size: ${bookStack.size}`);
console.log(`Is stack empty? ${bookStack.isEmpty()}`);
console.log("\nEmptying the stack:");
while (!bookStack.isEmpty()) bookStack.pop();
bookStack.display();
```

### Practical Example: Browser History via Stack
```js
class BrowserHistory {
  constructor() {
    this.history = new Stack();
    this.currentPage = null;
  }
  visitPage(url) {
    if (this.currentPage) this.history.push(this.currentPage);
    this.currentPage = url;
    console.log(`Visiting: ${url}`);
  }
  goBack() {
    if (this.history.isEmpty()) return void console.log("No previous page to go back to");
    console.log(`Going back from: ${this.currentPage}`);
    this.currentPage = this.history.pop();
    console.log(`Now on: ${this.currentPage}`);
  }
  showCurrentPage() {
    console.log(`Current page: ${this.currentPage || "No page loaded"}`);
  }
}

// Demo
console.log("\n=== Browser History Demo ===");
const browser = new BrowserHistory();
browser.visitPage("https://google.com");
browser.visitPage("https://stackoverflow.com");
browser.visitPage("https://github.com");
browser.visitPage("https://developer.mozilla.org");
browser.showCurrentPage();
browser.goBack();
browser.goBack();
browser.showCurrentPage();
```

<div style="page-break-after: always;"></div>

## 4) JavaScript: let, const, var (Binding)

```js
function varTest() {
  var x = 1;
  if (true) {
    var x = 2;  // same variable!
    console.log(x); // 2
  }
  console.log(x);   // 2
}

function letTest() {
  let x = 1;
  if (true) {
    let x = 2;  // different variable (block‑scoped)
    console.log(x); // 2
  }
  console.log(x);   // 1
}

varTest();
letTest();

const number = 42;
try {
  // number = 99; // Uncomment to see TypeError in strict contexts
} catch (err) {
  console.log(err);
}
console.log(number); // 42
```

**Notes**:  
- `var` is function‑scoped.  
- `let` and `const` are block‑scoped.  
- `const` prevents reassignment (but objects can still have mutable properties).

---

## 5) Closures (Intro)
```js
var createClient = function (initialName) {
  var age;
  var name = initialName;

  return {
    setName: function (newName) { name = newName; },
    getName: function () { return name; },
    getAge: function () { return age; },
    setAge: function (newAge) {
      if (newAge > 0 && newAge < 100) { age = newAge; }
    }
  };
};

var client = createClient("Tom");
console.log(client.getName());
client.setName("John");
client.setAge(50);
console.log(client.getAge());
console.log(client.getName());
```

**Concept**: The inner functions capture (`close over`) variables from the outer function’s scope, keeping them alive.

<div style="page-break-after: always;"></div>

## 6) Node.js: File System & Simple HTTP Servers

### Part I — Read File & Minimal HTTP Server

**`readfile.js`**
```js
const fs = require("fs");

function readFile(fileName) {
  fs.readFile(fileName, (error, content) => {
    if (error) {
      console.log("Sorry we got an error");
    } else {
      console.log(content.toString());
    }
  });
}

readFile("./data.txt");
```

**`data.txt`** — put any text.

Run:
```bash
node readfile.js
```

**`app.js`**
```js
const http = require("http");

http.createServer((request, response) => {
  console.log("request", request.url);
  response.writeHead(200);
  response.write("Lab Week 2");
  response.end();
}).listen(8080);

console.log("Server running at http://localhost:8080/");
```

Run:
```bash
node app.js
```

---

### Part II — Serve HTML Files

**`server.js`**
```js
const http = require("http");
const fs = require("fs");

http.createServer((req, res) => {
  fs.readFile("./views/index.html", (error, content) => {
    if (error) {
      console.log("Sorry we got an error");
      res.statusCode = 500;
      res.end("Error");
    } else {
      res.end(content);
    }
  });
}).listen(8080);
```

**`views/index.html`**
```html
<!doctype html>
<html>
  <body>
    <h4>Week 2 Calculator</h4>
  </body>
</html>
```

**Add a second route (`/info`)**

```js
const http = require("http");
const fs = require("fs");

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  let fileName = null;

  switch (pathname) {
    case "/":
      fileName = "./views/index.html";
      break;
    case "/info":
      fileName = "./views/info.html";
      break;
    default:
      res.statusCode = 404;
      res.end("Not found");
      return;
  }

  fs.readFile(fileName, (error, content) => {
    if (error) {
      console.log("Sorry we got an error");
      res.statusCode = 500;
      res.end("Error");
    } else {
      res.end(content);
    }
  });
}).listen(8080);
```

**`views/info.html`**
```html
<!doctype html>
<html>
  <body>
    <a href="/">Home</a>
    <h3>FIT2095 Topics</h3>
  </body>
</html>
```

**Update `views/index.html` with link to `/info`**
```html
<!doctype html>
<html>
  <body>
    <h4>Week 2 Calculator</h4>
    <h5><a href="/info">Info Page</a></h5>
  </body>
</html>
```

---

### Part III — Calculator Endpoints with Query String

**Add `/add` and `/sub` routes:**
```js
const http = require("http");

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  switch (url.pathname) {
    case "/add": {
      const x = parseInt(url.searchParams.get("x"));
      const y = parseInt(url.searchParams.get("y"));
      const result = x + y;
      res.end(`The result of ${x} + ${y} is ${result}`);
      return;
    }
    case "/sub": {
      const x = parseInt(url.searchParams.get("x"));
      const y = parseInt(url.searchParams.get("y"));
      const result = x - y;
      res.end(`The result of ${x} - ${y} is ${result}`);
      return;
    }
    default:
      res.statusCode = 404;
      res.end("Not found");
  }
}).listen(8080);
```

---

### Part V — Backend Simple Calculator (`/run`)

**Examples**
- `http://localhost:8080/run?n1=10&n2=2&opt=div` → The result is 5  
- `http://localhost:8080/run?n1=10&n2=2&opt=multi` → The result is 20  
- `http://localhost:8080/run?n1=10&n2=2&opt=add` → The result is 12  
- `http://localhost:8080/run?n1=10&n2=2&opt=sub` → The result is 8  

**Server**
```js
const http = require("http");
const PORT_NUMBER = 8080;

http.createServer((req, res) => {
  console.log("URL=" + req.url);
  res.writeHead(200, { "Content-Type": "text/html" });

  const baseURL = "http://" + req.headers.host + "/";
  const url = new URL(req.url, baseURL);

  if (url.pathname !== "/run") {
    res.statusCode = 404;
    return void res.end("Not found");
  }

  const n1 = parseFloat(url.searchParams.get("n1"));
  const n2 = parseFloat(url.searchParams.get("n2"));
  const opt = url.searchParams.get("opt");

  let result = NaN;
  switch (opt) {
    case "add": result = n1 + n2; break;
    case "sub": result = n1 - n2; break;
    case "multi": result = n1 * n2; break;
    case "div": result = n1 / n2; break;
    default:
      res.statusCode = 400;
      return void res.end("Unknown operation");
  }

  res.end(`The result is ${result}`);
}).listen(PORT_NUMBER, () => {
  console.log("Welcome!! The server is listening on port " + PORT_NUMBER);
});
```

---

## Printing Tips
- For best results, print to PDF with margins set to *Default* and enable “Background graphics” if your PDF tool supports it.  
- This document includes manual page‑breaks via `<div style="page-break-after: always;"></div>` where sections are long.

---

**Source:** Task 2 brief and examples (transcribed & corrected from provided PDF).
