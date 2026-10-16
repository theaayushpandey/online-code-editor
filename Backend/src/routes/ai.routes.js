import express from 'express'
import { limiter } from '../middlewares/rateLimit.middleware.js'
import { attachUser, requireUser } from '../middlewares/auth.middleware.js'
import { explainErrorController } from '../controllers/ai.controller.js'

const aiRouter = express.Router()

/**
 * @route POST /api/explain
 * @description explain a failed run with Gemini
 * @access private (Google sign-in)
 */
aiRouter.post('/explain', limiter(5, 'explanations'), attachUser, requireUser, explainErrorController)

export default aiRouter
