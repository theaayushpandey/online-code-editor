import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { OAuth2Client } from 'google-auth-library'
import { LANGUAGES } from './languages.js'

const PORT = process.env.PORT || 5000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const MAX_CODE_LENGTH = 50_000
const MAX_STDIN_LENGTH = 10_000

const app = express()
app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json({ limit: '200kb' }))

// ---------- Auth ----------
// The browser signs in with Google and gets an ID token: a JWT signed by Google.
// It sends that token in the Authorization header. We check Google's signature
// and that the token was issued for our app. No password ever reaches this server.
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

async function attachUser(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    req.user = null // guest
    return next()
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: header.slice('Bearer '.length),
      audience: GOOGLE_CLIENT_ID,
    })
    const { sub, name, email, picture } = ticket.getPayload()
    req.user = { id: sub, name, email, picture }
    next()
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}

function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Sign in with Google to use this feature.' })
  }
  next()
}

// ---------- Rate limits ----------
// Every run costs Judge0 CPU time and every explanation costs LLM tokens,
// so each IP address gets a fixed number of requests per minute.
const limiter = (max, what) =>
  rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: `Too many ${what}. Wait a minute and try again.` },
  })

// ---------- Judge0 ----------
const toBase64 = text => Buffer.from(text ?? '', 'utf8').toString('base64')
const fromBase64 = text => (text ? Buffer.from(text, 'base64').toString('utf8') : '')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function judge0Headers() {
  const headers = { 'Content-Type': 'application/json' }
  if (process.env.JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY
    headers['X-RapidAPI-Host'] = new URL(JUDGE0_URL).host
  }
  return headers
}

// Judge0 is asynchronous: we submit the code and get a token back straight away,
// then ask for the result with that token until the status is no longer
// "In Queue" (1) or "Processing" (2).
async function runOnJudge0({ code, languageId, stdin }) {
  const createRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: judge0Headers(),
    body: JSON.stringify({
      source_code: toBase64(code),
      language_id: languageId,
      stdin: toBase64(stdin),
      cpu_time_limit: 5,
    }),
  })
  if (!createRes.ok) {
    throw new Error(`Judge0 rejected the submission (HTTP ${createRes.status})`)
  }
  const { token } = await createRes.json()

  const fields = 'stdout,stderr,compile_output,message,status,time,memory'
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(attempt === 0 ? 500 : 1000)
    const res = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=${fields}`,
      { headers: judge0Headers() },
    )
    if (!res.ok) {
      throw new Error(`Judge0 could not return the result (HTTP ${res.status})`)
    }
    const result = await res.json()
    if (result.status.id > 2) {
      return {
        statusId: result.status.id,
        status: result.status.description,
        stdout: fromBase64(result.stdout),
        stderr: fromBase64(result.stderr),
        compileOutput: fromBase64(result.compile_output),
        message: fromBase64(result.message),
        time: result.time,
        memory: result.memory,
      }
    }
  }
  throw new Error('Judge0 took too long to respond')
}

// ---------- Gemini ----------
const TUTOR_INSTRUCTIONS = `You are a patient programming tutor inside an online code editor.
The student ran some code and it failed. You get the code, the language and the error.
Reply in plain text, under 120 words:
1. Say what the error means in simple words.
2. Point to the line or statement that causes it.
3. Give one hint towards the fix.
Do not rewrite the whole program for the student.`

async function explainWithGemini({ code, language, error }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: TUTOR_INSTRUCTIONS }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Language: ${language}\n\nCode:\n${code}\n\nError:\n${error}` }],
          },
        ],
        // Low temperature: we want the same careful answer every time, not creativity
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
      }),
    },
  )
  if (!res.ok) {
    throw new Error(`Gemini request failed (HTTP ${res.status})`)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text).join('')
  if (!text) {
    throw new Error('Gemini returned an empty answer')
  }
  return text.trim()
}

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, loginEnabled: Boolean(GOOGLE_CLIENT_ID), aiEnabled: Boolean(GEMINI_API_KEY) })
})

app.get('/api/languages', (req, res) => {
  res.json(LANGUAGES)
})

app.get('/api/me', attachUser, requireUser, (req, res) => {
  res.json(req.user)
})

app.post('/api/run', limiter(20, 'runs'), attachUser, async (req, res) => {
  const { code, languageId, stdin = '' } = req.body
  const language = LANGUAGES.find(lang => lang.id === languageId)

  if (!language) {
    return res.status(400).json({ error: 'Unsupported language.' })
  }
  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'There is no code to run.' })
  }
  if (code.length > MAX_CODE_LENGTH || String(stdin).length > MAX_STDIN_LENGTH) {
    return res.status(413).json({ error: 'The code or input is too large.' })
  }

  try {
    res.json(await runOnJudge0({ code, languageId, stdin: String(stdin) }))
  } catch (err) {
    console.error('run failed:', err.message)
    res.status(502).json({ error: 'The code runner is not available right now. Try again.' })
  }
})

app.post('/api/explain', limiter(5, 'explanations'), attachUser, requireUser, async (req, res) => {
  const { code, languageId, error } = req.body
  const language = LANGUAGES.find(lang => lang.id === languageId)

  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'The AI explainer is not set up on this server.' })
  }
  if (!language || typeof code !== 'string' || typeof error !== 'string' || !error.trim()) {
    return res.status(400).json({ error: 'Send the code, the language and the error.' })
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(413).json({ error: 'The code is too large.' })
  }

  try {
    const explanation = await explainWithGemini({
      code,
      language: language.name,
      error: error.slice(0, 4000), // long stack traces would only waste tokens
    })
    res.json({ explanation })
  } catch (err) {
    console.error('explain failed:', err.message)
    res.status(502).json({ error: 'The AI explainer did not respond. Try again.' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Google login: ${GOOGLE_CLIENT_ID ? 'on' : 'off (guest mode only)'}`)
  console.log(`AI explainer: ${GEMINI_API_KEY ? 'on' : 'off'}`)
})
