// Every setting the server reads from .env, in one place
import 'dotenv/config'

export const PORT = process.env.PORT || 5000
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
export const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com'
export const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export const MAX_CODE_LENGTH = 50_000
export const MAX_STDIN_LENGTH = 10_000
