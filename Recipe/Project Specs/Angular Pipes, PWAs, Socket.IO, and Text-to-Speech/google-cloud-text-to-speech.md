# Google Cloud Service: Text-to-Speech

![Project structure](sandbox:/mnt/data/02870631-322c-443a-b2ae-8068fcdca9d9.png)

Google Cloud Text-to-Speech enables developers to synthesize natural-sounding speech with **~30 voices**, available in multiple languages and variants. It applies DeepMind’s groundbreaking research in **WaveNet** and Google’s powerful neural networks to deliver high‑fidelity audio. With this easy-to-use API, you can create lifelike interactions across many applications and devices.

## Why use Cloud Services?

- Easy to integrate  
- Heavily tested  
- Pay as you go  
- No need to reinvent the wheel  
- Developing a reliable and accurate text‑to‑speech service from scratch can take months

---

## Goal

Develop a Node.js server-side application that converts text to speech (MP3) using **Google Cloud Text-to-Speech**.

---

## Configurations

### 1) Set up authentication

1. Go to the **Create service account key** page in the GCP Console: <https://console.cloud.google.com/iam-admin/serviceaccounts>  
2. Select your project.  
3. Click **Create Service account**.  
4. Enter a name into the **Service account name** field.  
5. **Do not** select a value from the **Role** drop‑down list (no role is required to access this service).  
6. Click **Create**.  
7. Click the three dots (**More options**) → **Manage keys**.  
8. Click **Add Key** → **Create new key** → **JSON**.  
9. A JSON file containing your key will download to your computer (you may rename it to `fit2095.json`).

### 2) Set the environment variable

Set `GOOGLE_APPLICATION_CREDENTIALS` to the **file path** of the JSON key. This applies only to the current shell session.

**Linux / macOS**:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"
```

**Windows (PowerShell)**:
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\[FILE_NAME].json"
```

> **Note:** If you open a new terminal session, set the variable again (or add it to your shell profile).

### 3) Enable the API

1. In the GCP Console, go to **APIs & Services → Library**.  
2. Search for **Text-to-Speech** (or **Translate** if applicable).  
3. Click **Enable** (skip if already enabled).

---

## Server Side (Text-to-Speech)

### Project Setup

1. Create a new folder, e.g., `text2speech`.
2. Install the Google Cloud client library:
   ```bash
   npm install @google-cloud/text-to-speech
   ```
3. Create a file named `app.js` and paste the following code:

```js
const fs = require("fs");

// Imports the Google Cloud client library
const textToSpeech = require("@google-cloud/text-to-speech");

// Creates a client
const client = new textToSpeech.TextToSpeechClient();

// The text to synthesize
const text = "Google Cloud Text-to-Speech lets developers take plain text and turn it into natural-sounding audio. And when I say natural, I mean it’s not the robotic voice you might remember from early text-to-speech systems. This service uses DeepMind’s WaveNet technology and Google’s powerful neural networks to generate voices that sound remarkably lifelike. Right now, you can choose from around 30 different voices, across multiple languages and even different accents or variants.";

// Construct the request
const request = {
  input: { text: text },
  // Select the language and SSML Voice Gender or Chirp 3 HD voices
  voice: { languageCode: "en-US", name: "en-US-Chirp3-HD-Leda" },
  // Select the type of audio encoding
  audioConfig: { audioEncoding: "MP3" },
};

// Performs the Text-to-Speech request
client.synthesizeSpeech(request, (err, response) => {
  if (err) {
    console.error("ERROR:", err);
    return;
  }

  // Write the binary audio content to a local file
  fs.writeFile("output.mp3", response.audioContent, "binary", err => {
    if (err) {
      console.error("ERROR:", err);
      return;
    }
    console.log("Audio content written to file: output.mp3");
  });
});
```

> Don’t forget to set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable as discussed earlier.

The project structure should look like the image above.

---

## Run the app

```bash
node app.js
```

If everything is configured correctly, a new file named **`output.mp3`** will be created in your project directory. Open it to test the results.
