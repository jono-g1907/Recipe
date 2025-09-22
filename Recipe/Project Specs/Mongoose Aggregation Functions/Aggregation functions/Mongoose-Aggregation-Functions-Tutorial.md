# Mongoose Aggregation Functions Tutorial

Master MongoDB aggregation using Mongoose's powerful aggregation pipeline.

---

## Table of Contents
1. [Introduction to Aggregation](#1-introduction-to-aggregation)  
2. [Basic Aggregation Pipeline](#2-basic-aggregation-pipeline)  
3. [$match — Filtering Documents](#3-match---filtering-documents)  
4. [$group — Grouping and Calculations](#4-group---grouping-and-calculations)  
5. [$sort — Sorting Results](#5-sort---sorting-results)  
6. [$project — Selecting Fields](#6-project---selecting-fields)  
7. [$lookup — Joining Collections](#7-lookup---joining-collections)  
8. [$unwind — Deconstructing Arrays](#8-unwind---deconstructing-arrays)  
9. [Mathematical Operators](#9-mathematical-operators)  
10. [Conditional Operations](#10-conditional-operations)  
11. [Advanced Pipeline Combinations](#11-advanced-pipeline-combinations)  
12. [Practical Examples](#12-practical-examples)

---

## 1. Introduction to Aggregation

MongoDB aggregation is a powerful framework for data analysis and transformation. **Mongoose** provides a clean interface to MongoDB's aggregation pipeline, allowing you to process documents through multiple stages to get exactly the data you need.

**What is an Aggregation Pipeline?**  
An aggregation pipeline consists of multiple stages that process documents sequentially. Each stage transforms the documents and passes the results to the next stage—much like Unix pipes.

> **Important:** Aggregation results are plain JavaScript objects (POJOs), **not** Mongoose documents. They do **not** have Mongoose methods like `save()` or virtuals.

**Example model used below:**

```js
const mongoose = require('mongoose');

const Student = mongoose.model('Student', new mongoose.Schema({
  name: String,
  age: Number,
  course: String,
  year: Number,
  gpa: Number,
  enrollmentDate: Date
}));
```

---

## 2. Basic Aggregation Pipeline

### 1) Understanding Pipeline Structure
Every aggregation pipeline is an **array of stages**. Each stage is an object specifying an operation.

```js
// Basic aggregation syntax
const result = await Student.aggregate([
  { $match: { year: 2 } },                            // Stage 1: Filter
  { $group: { _id: '$course', count: { $sum: 1 } } }  // Stage 2: Group
]);
```

### 2) Simple Aggregation Example
Start with a basic aggregation to find all students:

```js
// Find all students (equivalent to Student.find())
const students = await Student.aggregate([
  { $match: {} } // Empty match gets all documents
]);

console.log(students); // Array of plain JavaScript objects
```

**Key Points:**
- Pipelines are arrays: `[ {stage}, {stage}, ... ]`
- Each stage processes the output of the previous stage
- Results are **POJOs**, not Mongoose documents
- Mongoose **doesn't** automatically cast types in aggregation pipelines

---

## 3. $match - Filtering Documents

### 1) Basic Filtering
The `$match` stage filters documents (similar to `find()`):

```js
// Find all Computer Science students
const csStudents = await Student.aggregate([
  { $match: { course: 'Computer Science' } }
]);

// Find students older than 20
const olderStudents = await Student.aggregate([
  { $match: { age: { $gt: 20 } } }
]);
```

### 2) Complex Match Conditions
Use MongoDB operators for complex filtering:

```js
// Multiple conditions
const advancedMatch = await Student.aggregate([
  {
    $match: {
      $and: [
        { age: { $gte: 18 } },
        { gpa: { $gt: 3.0 } },
        { course: { $in: ['Computer Science', 'Engineering'] } }
      ]
    }
  }
]);

// Using regex for text search
const nameSearch = await Student.aggregate([
  { $match: { name: { $regex: /^John/, $options: 'i' } } }
]);
```

> **Note:** Aggregation **does not** auto-cast strings to `ObjectId`. If matching by `_id`, convert explicitly:  
> `{ $match: { _id: new mongoose.Types.ObjectId(idString) } }`

---

## 4. $group - Grouping and Calculations

### 1) Basic Grouping
Group documents by specified fields:

```js
// Count students by course
const studentsByCourse = await Student.aggregate([
  {
    $group: {
      _id: '$course',            // Group by course
      studentCount: { $sum: 1 }  // Count documents per group
    }
  }
]);

// Example result:
// [ { _id: 'Computer Science', studentCount: 25 }, { _id: 'Engineering', studentCount: 30 } ]
```

### 2) Mathematical Aggregations
Perform calculations within groups:

```js
// Calculate statistics by course
const courseStats = await Student.aggregate([
  {
    $group: {
      _id: '$course',
      totalStudents: { $sum: 1 },
      averageGPA:   { $avg: '$gpa' },
      highestGPA:   { $max: '$gpa' },
      lowestGPA:    { $min: '$gpa' },
      totalAges:    { $sum: '$age' }
    }
  }
]);
```

### 3) Multiple Field Grouping
Group by multiple fields using an object:

```js
// Group by course and year
const courseYearStats = await Student.aggregate([
  {
    $group: {
      _id: { course: '$course', year: '$year' },
      count:  { $sum: 1 },
      avgGPA: { $avg: '$gpa' }
    }
  }
]);

// Result structure:
// { _id: { course: 'Computer Science', year: 2 }, count: 10, avgGPA: 3.2 }
```

**Common `$group` Operators:**
- `$sum` — Add values or count documents
- `$avg` — Average
- `$min` / `$max` — Min / Max
- `$first` / `$last` — First / Last value in group
- `$push` — Collect values into an array
- `$addToSet` — Collect **unique** values into an array

---

## 5. $sort - Sorting Results

### 1) Basic Sorting
Order documents:

```js
// Sort students by age (ascending)
const sortedByAge = await Student.aggregate([
  { $sort: { age: 1 } } // 1 = ascending, -1 = descending
]);

// Sort by GPA descending
const sortedByGPA = await Student.aggregate([
  { $sort: { gpa: -1 } }
]);
```

### 2) Multiple Field Sorting
Specify a priority order:

```js
// Sort by course (asc), then GPA (desc)
const multiSort = await Student.aggregate([
  { $sort: { course: 1, gpa: -1 } }
]);

// Combine with grouping
const sortedGroupResults = await Student.aggregate([
  { $group: { _id: '$course', avgGPA: { $avg: '$gpa' } } },
  { $sort: { avgGPA: -1 } }
]);
```

> **Performance Tip:** Place `$sort` **early** when possible—especially before expensive `$group` stages.

---

## 6. $project - Selecting Fields

### 1) Field Selection
Choose fields to include or exclude:

```js
// Include only name and course
const selectedFields = await Student.aggregate([
  { $project: { name: 1, course: 1 } }
]);

// Exclude specific fields
const excludeFields = await Student.aggregate([
  { $project: { _id: 0, __v: 0 } }
]);
```

### 2) Creating Computed Fields
Use expressions to construct new fields:

```js
// Add computed fields
const withComputedFields = await Student.aggregate([
  {
    $project: {
      name: 1,
      course: 1,
      gpa: 1,
      // Letter grade from GPA
      grade: {
        $cond: {
          if: { $gte: ['$gpa', 3.5] },
          then: 'A',
          else: 'B'
        }
      },
      // Age in months
      ageInMonths: { $multiply: ['$age', 12] },
      // Full year description
      yearDescription: { $concat: ['Year ', { $toString: '$year' }] }
    }
  }
]);
```

### 3) Nested Field Operations
Work with nested objects/arrays:

```js
// Assuming students have embedded address
const nestedProjection = await Student.aggregate([
  {
    $project: {
      name: 1,
      'address.city': 1,
      'address.state': 1,
      cityAndState: { $concat: ['$address.city', ', ', '$address.state'] }
    }
  }
]);
```

**$project Field Syntax:**
- `field: 1` — Include
- `field: 0` — Exclude
- `newField: <expression>` — Computed field
- `'nested.field': 1` — Include nested field  
*Note: Cannot mix inclusion (1) and exclusion (0) in the same `$project` (except `_id`).*

---

## 7. $lookup - Joining Collections

### 1) Basic Lookup
Perform a left outer join with another collection:

```js
// Join students with course details (Courses collection)
const studentsWithCourseInfo = await Student.aggregate([
  {
    $lookup: {
      from: 'courses',        // Collection to join
      localField: 'course',   // Field from students
      foreignField: 'name',   // Field from courses
      as: 'courseDetails'     // Output array field
    }
  }
]);
```

### 2) Advanced Lookup with Pipeline
Use a nested pipeline for more control:

```js
const advancedLookup = await Student.aggregate([
  {
    $lookup: {
      from: 'courses',
      let: { studentCourse: '$course', studentYear: '$year' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$name', '$$studentCourse'] },
                { $lte: ['$minYear', '$$studentYear'] }
              ]
            }
          }
        },
        { $project: { name: 1, credits: 1, description: 1 } }
      ],
      as: 'eligibleCourses'
    }
  }
]);
```

> **Performance Note:** `$lookup` can be expensive. Index the **foreign field** and reduce documents early with `$match`.

---

## 8. $unwind - Deconstructing Arrays

### 1) Basic Unwind
Split array elements into separate documents:

```js
// Assuming students have a subjects array
const unwoundSubjects = await Student.aggregate([
  { $unwind: '$subjects' }
]);

// If subjects = ['Math', 'Science'] -> two output documents
```

### 2) Unwind with Options
Handle empty arrays and preserve nulls:

```js
const unwindWithOptions = await Student.aggregate([
  {
    $unwind: {
      path: '$subjects',
      includeArrayIndex: 'subjectIndex', // Index of element
      preserveNullAndEmptyArrays: true   // Keep docs without the field
    }
  }
]);

// Useful after lookup
const lookupAndUnwind = await Student.aggregate([
  {
    $lookup: {
      from: 'courses',
      localField: 'course',
      foreignField: 'name',
      as: 'courseInfo'
    }
  },
  { $unwind: '$courseInfo' } // Convert array -> object
]);
```

**When to use `$unwind`:**
- After `$lookup` to flatten arrays
- To analyze individual array elements
- Before `$group` when grouping by array elements
- To flatten nested structures

---

## 9. Mathematical Operators

### 1) Basic Math Operations
Perform arithmetic directly in the pipeline:

```js
const mathOperations = await Student.aggregate([
  {
    $project: {
      name: 1,
      age: 1,
      gpa: 1,
      doubleAge:     { $multiply: ['$age', 2] },
      gpaPercentage: { $multiply: ['$gpa', 25] }, // 4.0 -> 100
      yearsPlusAge:  { $add: ['$year', '$age'] },
      ageDifference: { $subtract: ['$age', 18] }
    }
  }
]);
```

### 2) Advanced Mathematical Functions
Use more complex functions:

```js
const advancedMath = await Student.aggregate([
  {
    $project: {
      name: 1,
      gpa: 1,
      gpaDeviation: { $abs: { $subtract: ['$gpa', 3.0] } },
      ageSquared:   { $pow: ['$age', 2] },
      gpaRounded:   { $ceil: '$gpa' },
      gpaFloor:     { $floor: '$gpa' },
      evenAge:      { $eq: [{ $mod: ['$age', 2] }, 0] }
    }
  }
]);
```

### 3) Mathematical Aggregation in Groups
Combine with `$group` calculations:

```js
const mathGrouping = await Student.aggregate([
  {
    $group: {
      _id: '$course',
      totalStudents: { $sum: 1 },
      averageAge:    { $avg: '$age' },
      totalAgeYears: { $sum: '$age' },
      // Weighted GPA (assumes 'credits' field exists)
      weightedGPA: {
        $avg: { $multiply: ['$gpa', '$credits'] }
      },
      // Age range
      ageRange: { $subtract: [{ $max: '$age' }, { $min: '$age' }] }
    }
  }
]);
```

**Available Math Operators:**
- **Arithmetic:** `$add`, `$subtract`, `$multiply`, `$divide`
- **Comparison:** `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
- **Advanced:** `$abs`, `$ceil`, `$floor`, `$pow`, `$sqrt`, `$mod`
- **Trigonometric:** `$sin`, `$cos`, `$tan` (MongoDB version-dependent)

---

## 10. Conditional Operations

### 1) Basic Conditional (`$cond`)
If/then/else logic:

```js
const conditionalGrades = await Student.aggregate([
  {
    $project: {
      name: 1,
      gpa: 1,
      grade: {
        $cond: {
          if: { $gte: ['$gpa', 3.5] },
          then: 'A',
          else: 'B'
        }
      },
      status: {
        $cond: {
          if: { $gte: ['$age', 18] },
          then: 'Adult',
          else: 'Minor'
        }
      }
    }
  }
]);
```

### 2) Multiple Conditions (`$switch`)
Branching logic with multiple cases:

```js
const gradeClassification = await Student.aggregate([
  {
    $project: {
      name: 1,
      gpa: 1,
      letterGrade: {
        $switch: {
          branches: [
            { case: { $gte: ['$gpa', 3.7] }, then: 'A'  },
            { case: { $gte: ['$gpa', 3.3] }, then: 'A-' },
            { case: { $gte: ['$gpa', 3.0] }, then: 'B+' },
            { case: { $gte: ['$gpa', 2.7] }, then: 'B'  },
            { case: { $gte: ['$gpa', 2.3] }, then: 'B-' },
            { case: { $gte: ['$gpa', 2.0] }, then: 'C+' }
          ],
          default: 'C'
        }
      },
      yearLevel: {
        $switch: {
          branches: [
            { case: { $eq: ['$year', 1] }, then: 'Freshman'  },
            { case: { $eq: ['$year', 2] }, then: 'Sophomore' },
            { case: { $eq: ['$year', 3] }, then: 'Junior'    },
            { case: { $eq: ['$year', 4] }, then: 'Senior'    }
          ],
          default: 'Unknown'
        }
      }
    }
  }
]);
```

### 3) Conditional Aggregation
Conditionals inside `$group`:

```js
const conditionalStats = await Student.aggregate([
  {
    $group: {
      _id: '$course',
      totalStudents: { $sum: 1 },
      highGPACount: {
        $sum: {
          $cond: [{ $gte: ['$gpa', 3.5] }, 1, 0]
        }
      },
      adultAgeSum: {
        $sum: {
          $cond: [{ $gte: ['$age', 18] }, '$age', 0]
        }
      },
      upperClassGPA: {
        $avg: {
          $cond: [{ $gt: ['$year', 2] }, '$gpa', null]
        }
      }
    }
  }
]);
```

**Conditional Operators:**
- `$cond` — if/then/else
- `$switch` — multi-branch
- `$ifNull` — default for null/missing
- Logic: `$and`, `$or`, `$not`
- Comparison: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`

---

## 11. Advanced Pipeline Combinations

### 1) Complex Multi-Stage Pipeline
Combine multiple stages for comprehensive analysis:

```js
const comprehensiveAnalysis = await Student.aggregate([
  // Stage 1: Filter active students
  { $match: { status: 'active', gpa: { $exists: true } } },

  // Stage 2: Add computed fields
  {
    $project: {
      name: 1,
      course: 1,
      year: 1,
      gpa: 1,
      age: 1,
      gradeLevel: {
        $switch: {
          branches: [
            { case: { $gte: ['$gpa', 3.5] }, then: 'Excellent' },
            { case: { $gte: ['$gpa', 3.0] }, then: 'Good' },
            { case: { $gte: ['$gpa', 2.5] }, then: 'Average' }
          ],
          default: 'Below Average'
        }
      }
    }
  },

  // Stage 3: Group by course and grade level
  {
    $group: {
      _id: { course: '$course', gradeLevel: '$gradeLevel' },
      studentCount: { $sum: 1 },
      averageGPA:   { $avg: '$gpa' },
      averageAge:   { $avg: '$age' }
    }
  },

  // Stage 4: Sort results
  { $sort: { '_id.course': 1, averageGPA: -1 } }
]);
```

### 2) Using `$facet` for Multiple Analyses
Run multiple independent analyses in parallel:

```js
const multiAnalysis = await Student.aggregate([
  {
    $facet: {
      // Analysis 1: GPA distribution
      gpaDistribution: [
        {
          $bucket: {
            groupBy: '$gpa',
            boundaries: [0, 2.0, 2.5, 3.0, 3.5, 4.0],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              averageAge: { $avg: '$age' }
            }
          }
        }
      ],

      // Analysis 2: Course statistics
      courseStats: [
        { $group: { _id: '$course', totalStudents: { $sum: 1 }, avgGPA: { $avg: '$gpa' } } },
        { $sort: { avgGPA: -1 } }
      ],

      // Analysis 3: Age demographics
      ageDemographics: [
        { $group: { _id: null, totalStudents: { $sum: 1 }, averageAge: { $avg: '$age' }, minAge: { $min: '$age' }, maxAge: { $max: '$age' } } }
      ]
    }
  }
]);
```

**Pipeline Performance Tips:**
- Place `$match` as early as possible
- Use `$project` to reduce document size before expensive stages
- Ensure helpful indexes exist for `$match` and `$sort`
- Use `$limit` when appropriate

---

## 12. Practical Examples

### 1) Academic Performance Report

```js
const performanceReport = await Student.aggregate([
  // Filter for current semester
  { $match: { semester: 'Fall 2023', gpa: { $exists: true } } },

  // Add performance categories
  {
    $addFields: {
      performanceLevel: {
        $switch: {
          branches: [
            { case: { $gte: ['$gpa', 3.7] }, then: 'Dean\'s List' },
            { case: { $gte: ['$gpa', 3.0] }, then: 'Good Standing' },
            { case: { $gte: ['$gpa', 2.0] }, then: 'Satisfactory' }
          ],
          default: 'Academic Probation'
        }
      }
    }
  },

  // Group by performance level
  {
    $group: {
      _id: '$performanceLevel',
      studentCount: { $sum: 1 },
      averageGPA:   { $avg: '$gpa' },
      courses:      { $addToSet: '$course' }
    }
  },

  // Sort by average GPA
  { $sort: { averageGPA: -1 } }
]);
```

### 2) Course Enrollment Analytics

```js
const enrollmentAnalytics = await Student.aggregate([
  // Group by course
  {
    $group: {
      _id: '$course',
      totalEnrolled: { $sum: 1 },
      averageAge:    { $avg: '$age' },
      gpaRange: {
        $push: { studentName: '$name', gpa: '$gpa', year: '$year' }
      }
    }
  },

  // Add capacity analysis
  {
    $addFields: {
      enrollmentStatus: {
        $cond: { if: { $gte: ['$totalEnrolled', 30] }, then: 'Full', else: 'Available' }
      }
    }
  },

  // Sort by enrollment
  { $sort: { totalEnrolled: -1 } }
]);
```

### 3) Year-over-Year Comparison

```js
const yearComparison = await Student.aggregate([
  // Group by academic year and course
  {
    $group: {
      _id: { academicYear: '$academicYear', course: '$course' },
      studentCount: { $sum: 1 },
      averageGPA:   { $avg: '$gpa' },
      totalCredits: { $sum: '$credits' }
    }
  },

  // Reshape for comparison
  {
    $group: {
      _id: '$_id.course',
      yearlyData: {
        $push: {
          year: '$_id.academicYear',
          students: '$studentCount',
          avgGPA: '$averageGPA',
          credits: '$totalCredits'
        }
      }
    }
  },

  // Calculate growth metrics between consecutive years
  {
    $addFields: {
      growthAnalysis: {
        $map: {
          input: { $range: [1, { $size: '$yearlyData' }] },
          as: 'index',
          in: {
            $let: {
              vars: {
                current:  { $arrayElemAt: ['$yearlyData', '$$index'] },
                previous: { $arrayElemAt: ['$yearlyData', { $subtract: ['$$index', 1] }] }
              },
              in: {
                year: '$$current.year',
                growth: {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ['$$current.students', '$$previous.students'] },
                        '$$previous.students'
                      ]
                    },
                    100
                  ]
                }
              }
            }
          }
        }
      }
    }
  }
]);
```

**Best Practices for Aggregation Pipelines:**
- Start with data exploration using simple pipelines
- Build complex pipelines incrementally and test each stage
- Use `explain()` to analyze performance
- Create indexes for frequently matched/sorted fields
- Document complex pipelines for team knowledge
- Test with various data sizes for scalability

**Next Steps:** Practice these concepts with your own data. Start simple and layer complexity. Aggregation is powerful—use it thoughtfully for performance and clarity.
