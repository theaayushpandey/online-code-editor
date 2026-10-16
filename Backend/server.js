import app from './src/app.js'
import { GEMINI_API_KEY, GOOGLE_CLIENT_ID, PORT } from './src/config/env.js'

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Google login: ${GOOGLE_CLIENT_ID ? 'on' : 'off (guest mode only)'}`)
  console.log(`AI explainer: ${GEMINI_API_KEY ? 'on' : 'off'}`)
})
