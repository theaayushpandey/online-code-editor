import express from 'express'
import cors from 'cors'
import { CLIENT_ORIGIN, GEMINI_API_KEY, GOOGLE_CLIENT_ID } from './config/env.js'
import authRouter from './routes/auth.routes.js'
import codeRouter from './routes/code.routes.js'
import aiRouter from './routes/ai.routes.js'

const app = express()
app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json({ limit: '200kb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, loginEnabled: Boolean(GOOGLE_CLIENT_ID), aiEnabled: Boolean(GEMINI_API_KEY) })
})

/* using all the routes here */
app.use('/api', authRouter)
app.use('/api', codeRouter)
app.use('/api', aiRouter)

export default app
