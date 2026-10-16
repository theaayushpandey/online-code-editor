import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js'

const TUTOR_INSTRUCTIONS = `You are a patient programming tutor inside an online code editor.
The student ran some code and it failed. You get the code, the language and the error.
Reply in plain text, under 120 words:
1. Say what the error means in simple words.
2. Point to the line or statement that causes it.
3. Give one hint towards the fix.
Do not rewrite the whole program for the student.`

export async function explainWithGemini({ code, language, error }) {
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
