import express from 'express'
import { limiter } from '../middlewares/rateLimit.middleware.js'
import { attachUser } from '../middlewares/auth.middleware.js'
import { explainErrorController } from '../controllers/ai.controller.js'

const aiRouter = express.Router()

/**
 * @route POST /api/explain
 * @description explain a failed run with Gemini
 * @access public (guests too; the rate limit protects the Gemini quota)
 */
aiRouter.post('/explain', limiter(5, 'explanations'), attachUser, explainErrorController)

export default aiRouter
