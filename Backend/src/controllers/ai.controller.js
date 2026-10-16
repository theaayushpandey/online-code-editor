import { LANGUAGES } from '../config/languages.js'
import { GEMINI_API_KEY, MAX_CODE_LENGTH } from '../config/env.js'
import { explainWithGemini } from '../services/ai.service.js'

export async function explainErrorController(req, res) {
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
}
