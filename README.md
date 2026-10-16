# CodeRun: Online Code Editor

Write and run code in 12 languages in the browser. Sign in with Google to get an AI explanation when your code fails.

## Features

- Monaco editor (the editor inside VS Code) with syntax highlighting and auto-completion
- 12 languages: C++, C, Python, Java, JavaScript, TypeScript, Go, Rust, Kotlin, C#, PHP, Ruby
- Custom input (stdin), output, compile and runtime errors, run time and memory
- Google sign-in, with a guest mode that can still run code
- "Explain this error with AI": sends the failing code and the error to Gemini and shows a short hint
- Your code is saved per language in the browser, so a refresh does not lose it
- Rate limits and size limits on the server

## How it works

```
Browser (React + Monaco)
   |  fetch: POST /api/run  { code, languageId, stdin }
   v
Express server  ---->  Judge0   (compiles and runs the code in a sandbox)
   |            ---->  Gemini   (explains an error)
   |            ---->  Google   (checks the sign-in token)
   v
JSON result back to the browser
```

The browser never talks to Judge0 or Gemini directly. All API keys stay on the server.

| File | What it does |
| --- | --- |
| `server/index.js` | The whole backend: auth check, rate limits, Judge0 call, Gemini call, routes |
| `server/languages.js` | The language list: Judge0 id, Monaco name, starter code |
| `client/src/api.js` | Every request from the page to the server |
| `client/src/App.jsx` | Decides between the login page and the editor; keeps the session |
| `client/src/Login.jsx` | Google button and "Continue as guest" |
| `client/src/EditorPage.jsx` | Editor, language picker, input, output, AI explanation |

## Run it locally

You need Node.js 18 or newer. Open two terminals.

Terminal 1, the server:

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Terminal 2, the page:

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173. Running code works straight away as a guest.

## Turn on Google sign-in

1. Go to Google Cloud Console, then APIs & Services, then Credentials.
2. Create an OAuth client ID of type "Web application".
3. Under "Authorised JavaScript origins" add `http://localhost:5173`.
4. Put the client ID in both `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`VITE_GOOGLE_CLIENT_ID`).
5. Restart both terminals.

## Turn on the AI explainer

1. Create an API key in Google AI Studio.
2. Put it in `server/.env` as `GEMINI_API_KEY`.
3. Restart the server. If the model name in `GEMINI_MODEL` is no longer offered, change it to a current one.

## Known limitations

- A Google sign-in lasts one hour, then you sign in again. There is no refresh.
- Nothing is stored on the server: no database, no saved files across devices.
- The rate limit is per IP address and kept in memory, so it resets when the server restarts and would not work across several servers.
- It uses the public Judge0 server, which is shared and can be slow or unavailable.
