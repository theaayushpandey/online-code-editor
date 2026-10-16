import { LANGUAGES } from '../config/languages.js'
import { MAX_CODE_LENGTH, MAX_STDIN_LENGTH } from '../config/env.js'
import { runOnJudge0 } from '../services/judge0.service.js'

export function getLanguagesController(req, res) {
  res.json(LANGUAGES)
}

export async function runCodeController(req, res) {
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
}
