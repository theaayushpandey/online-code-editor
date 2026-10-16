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

## Folder structure

```
online-code-editor/
├── Backend/                         Express API (Node.js)
│   ├── server.js                    starts the server
│   └── src/
│       ├── app.js                   Express app: CORS, JSON, mounts the routes
│       ├── config/
│       │   ├── env.js               every setting read from .env
│       │   └── languages.js         language list: Judge0 id, Monaco name, starter code
│       ├── middlewares/
│       │   ├── auth.middleware.js   checks the Google sign-in token
│       │   └── rateLimit.middleware.js
│       ├── routes/                  URL -> controller
│       │   ├── auth.routes.js       GET  /api/me
│       │   ├── code.routes.js       GET  /api/languages, POST /api/run
│       │   └── ai.routes.js         POST /api/explain
│       ├── controllers/             checks the request, calls a service, sends the answer
│       │   ├── auth.controller.js
│       │   ├── code.controller.js
│       │   └── ai.controller.js
│       └── services/                talks to outside APIs
│           ├── judge0.service.js    compiles and runs the code
│           └── ai.service.js        AI integration: Gemini error explainer
└── Frontend/                        React + Vite page
    └── src/
        ├── main.jsx, App.jsx        entry; App picks the login page or the editor
        ├── config.js                API URL and Google client ID from .env
        ├── pages/
        │   ├── Login.jsx            Google button and "Continue as guest"
        │   └── EditorPage.jsx       editor, language picker, input, output, AI explanation
        └── services/
            └── api.js               every request from the page to the server
```

## Run it locally

You need Node.js 18 or newer. Open two terminals.

Terminal 1, the server:

```bash
cd Backend
npm install
copy .env.example .env
npm run dev
```

Terminal 2, the page:

```bash
cd Frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173. Running code works straight away as a guest.

## Turn on Google sign-in

1. Go to Google Cloud Console, then APIs & Services, then Credentials.
2. Create an OAuth client ID of type "Web application".
3. Under "Authorised JavaScript origins" add `http://localhost:5173`.
4. Put the client ID in both `Backend/.env` (`GOOGLE_CLIENT_ID`) and `Frontend/.env` (`VITE_GOOGLE_CLIENT_ID`).
5. Restart both terminals.

## Turn on the AI explainer

1. Create an API key in Google AI Studio.
2. Put it in `Backend/.env` as `GEMINI_API_KEY`.
3. Restart the server. If the model name in `GEMINI_MODEL` is no longer offered, change it to a current one.

## Known limitations

- A Google sign-in lasts one hour, then you sign in again. There is no refresh.
- Nothing is stored on the server: no database, no saved files across devices.
- The rate limit is per IP address and kept in memory, so it resets when the server restarts and would not work across several servers.
- It uses the public Judge0 server, which is shared and can be slow or unavailable.
