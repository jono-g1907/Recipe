# Gen AI API Tutorial

Learn to make API calls to ChatGPT and Google Gemini using Node.js and Express

## Table of Contents
- [1. Introduction](#1-introduction)
- [2. Prerequisites](#2-prerequisites)
- [3. Project Setup](#3-project-setup)
- [4. ChatGPT API Implementation](#4-chatgpt-api-implementation)
- [5. Google Gemini API Implementation](#5-google-gemini-api-implementation)
- [6. Running the Application](#6-running-the-application)

---

## 1. Introduction

This tutorial teaches you to integrate ChatGPT and Google Gemini APIs into a Node.js application. You'll learn:

- **API Integration** — Making HTTP requests to AI services  
- **Express.js Server** — Creating API endpoints  
- **Error Handling** — Managing API failures and responses  
- **Environment Variables** — Securely storing API keys  
- **Console Output** — Displaying AI responses

**What you'll build:** A Node.js server with endpoints that send prompts to ChatGPT and Google Gemini APIs, then display the responses in the console.

> **Note:** You'll need API keys from OpenAI (ChatGPT) and Google (Gemini) to use this tutorial. Both services offer free tiers for testing.

---

## 2. Prerequisites

Before starting this Gen AI tutorial, make sure you have:

- **Node.js v18 or higher** — Required for modern JavaScript features  
- **OpenAI API Key** — Sign up at <https://platform.openai.com>  
- **Google AI API Key** — Get from <https://makersuite.google.com/app/apikey>  
- **Basic understanding** of JavaScript and HTTP requests  
- **Text editor or IDE** (VS Code recommended)

**API Key Requirements:**

- **OpenAI:** Create account and generate API key in dashboard  
- **Google AI:** Enable Generative AI API and create credentials  
- **Both services** may require payment method for higher usage limits

---

## 3. Project Setup

### 1) Create Project Directory
```bash
mkdir genai-tutorial
cd genai-tutorial
```

### 2) Initialize Node.js Project
```bash
npm init -y
```

### 3) Install Dependencies
```bash
npm install express dotenv openai @google/generative-ai
```

**Dependencies explained:**
- `express`: Web framework for creating API endpoints  
- `dotenv`: Load environment variables from `.env` file  
- `openai`: Official OpenAI SDK for ChatGPT  
- `@google/generative-ai`: Official Google Gemini SDK

### 4) Create Environment File

Create `.env` file to store your API keys:

```dotenv
# .env
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

**Security:** Never commit `.env` files to version control. Add `.env` to your `.gitignore` file.

### 5) Project Structure

```
genai-tutorial/
├── package.json
├── server.js
├── .env
└── node_modules/
```

---

## 4. ChatGPT API Implementation

### 1) Create `server.js`

Create the main server file with ChatGPT integration:

```javascript
const express = require('express');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ChatGPT API function using OpenAI SDK
async function askChatGPT(prompt) {
  try {
    console.log('Sending request to ChatGPT...');
    console.log('Prompt:', prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7
    });

    const answer = completion.choices[0].message.content;

    console.log('ChatGPT Response:');
    console.log(answer);
    console.log('-------------------');

    return { success: true, response: answer, provider: 'ChatGPT' };
  } catch (error) {
    console.error('ChatGPT Error:', error.message);
    return { success: false, error: error.message, provider: 'ChatGPT' };
  }
}

// ChatGPT endpoint
app.post('/ask-chatgpt', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }
  const result = await askChatGPT(prompt);
  res.json(result);
});

// Test endpoint for ChatGPT
app.get('/test-chatgpt', async (req, res) => {
  const testPrompt = 'What are the differences between node.js and Golang? write no more than 50 words in English.';
  console.log('Testing ChatGPT with sample prompt...');
  const result = await askChatGPT(testPrompt);
  res.json(result);
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Gen AI Tutorial Server is running!',
    endpoints: [
      'POST /ask-chatgpt - Send prompt to ChatGPT',
      'GET /test-chatgpt - Test ChatGPT with sample prompt',
      'POST /ask-gemini - Send prompt to Google Gemini',
      'GET /test-gemini - Test Gemini with sample prompt'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET / - Server info');
  console.log('  POST /ask-chatgpt - ChatGPT API');
  console.log('  GET /test-chatgpt - Test ChatGPT');
  console.log('  POST /ask-gemini - Gemini API');
  console.log('  GET /test-gemini - Test Gemini');
});
```

**ChatGPT Implementation Features:**
- Official OpenAI SDK: Uses OpenAI's official Node.js SDK  
- Simple API: Clean, straightforward method calls  
- Automatic Authentication: API key handled by SDK  
- Console Logging: Shows prompt and response in console  
- Error Handling: Catches and displays API errors  
- Test Endpoint: Built-in test with sample prompt

---

## 5. Google Gemini API Implementation

### 1) Add Gemini Functions to `server.js`

Add these functions to your existing `server.js` file (after the ChatGPT functions):

```javascript
// Google Gemini API function
async function askGemini(prompt) {
  try {
    console.log('Sending request to Google Gemini...');
    console.log('Prompt:', prompt);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    console.log('Google Gemini Response:');
    console.log(answer);
    console.log('-------------------');

    return { success: true, response: answer, provider: 'Google Gemini' };
  } catch (error) {
    console.error('Google Gemini Error:', error.message);
    return { success: false, error: error.message, provider: 'Google Gemini' };
  }
}

// Gemini endpoint
app.post('/ask-gemini', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }
  const result = await askGemini(prompt);
  res.json(result);
});

// Test endpoint for Gemini
app.get('/test-gemini', async (req, res) => {
  const testPrompt = 'What are the differences between node.js and Golang? write no more than 50 words in English.';
  console.log('Testing Google Gemini with sample prompt...');
  const result = await askGemini(testPrompt);
  res.json(result);
});
```

**Google Gemini Implementation Features:**
- Official SDK: Uses Google's official generative AI SDK  
- Model Selection: Uses `gemini-pro` model for text generation  
- Simple API: Cleaner syntax compared to raw HTTP requests  
- Console Logging: Shows prompt and response in console  
- Error Handling: Catches and displays SDK errors  
- Test Endpoint: Built-in test with same sample prompt

### 2) Complete `server.js` File

Your complete `server.js` should include both ChatGPT and Gemini implementations with all endpoints working together.

**API Comparison:**
- **ChatGPT:** Uses official OpenAI SDK with `chat.completions.create` method  
- **Gemini:** Uses official Google SDK with `generateContent` method  
- **Both:** Use official SDKs for clean, simple implementation

---

## 6. Running the Application

### 1) Add Your API Keys

Update your `.env` file with real API keys:

```dotenv
# Replace with your actual API keys
OPENAI_API_KEY=sk-your-actual-openai-key
GOOGLE_API_KEY=your-actual-google-key
```

### 2) Start the Server
```bash
node server.js
```

You should see:

```
Server running on http://localhost:3000
Available endpoints:
  GET / - Server info
  POST /ask-chatgpt - ChatGPT API
  GET /test-chatgpt - Test ChatGPT
  POST /ask-gemini - Gemini API
  GET /test-gemini - Test Gemini
```

### 3) Test ChatGPT API

Open a new terminal and test the ChatGPT endpoint:

```bash
# Test ChatGPT with GET request (uses OpenAI SDK)
curl http://localhost:3000/test-chatgpt

# Or test with custom prompt
curl -X POST http://localhost:3000/ask-chatgpt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are the differences between node.js and Golang? write no more than 50 words in English."}'
```

### 4) Test Google Gemini API

Test the Google Gemini endpoint:

```bash
# Test Gemini with GET request
curl http://localhost:3000/test-gemini

# Or test with custom prompt
curl -X POST http://localhost:3000/ask-gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are the differences between node.js and Golang? write no more than 50 words in English."}'
```

### 5) Monitor Console Output

In your server terminal, you'll see the AI responses:

```text
# ChatGPT example output:
Sending request to ChatGPT...
Prompt: What are the differences between node.js and Golang? write no more than 50 words in English.
ChatGPT Response:
Node.js is a JavaScript runtime for server-side development, offering extensive libraries and fast development. Golang is a compiled language with better performance, built-in concurrency, and simpler deployment. Node.js excels in rapid prototyping; Go excels in system programming and high-performance applications.
-------------------
```

```text
# Gemini example output:
Sending request to Google Gemini...
Prompt: What are the differences between node.js and Golang? write no more than 50 words in English.
Google Gemini Response:
Node.js is a JavaScript runtime environment, interpreted and dynamic. Go is a compiled, statically-typed language. Node.js excels in web development with vast libraries. Go offers superior performance, concurrency, and is ideal for system programming and microservices.
-------------------
```

### 6) Test Error Handling

Test what happens with invalid API keys or network issues:

1. Try running with wrong API keys in `.env`  
2. Send requests with empty prompts  
3. Observe error messages in console
