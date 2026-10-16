import express from 'express'
import { attachUser, requireUser } from '../middlewares/auth.middleware.js'
import { getMeController } from '../controllers/auth.controller.js'

const authRouter = express.Router()

/**
 * @route GET /api/me
 * @description the signed-in Google user
 * @access private (Google sign-in)
 */
authRouter.get('/me', attachUser, requireUser, getMeController)

export default authRouter
