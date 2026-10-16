import express from 'express'
import { limiter } from '../middlewares/rateLimit.middleware.js'
import { attachUser } from '../middlewares/auth.middleware.js'
import { getLanguagesController, runCodeController } from '../controllers/code.controller.js'

const codeRouter = express.Router()

/**
 * @route GET /api/languages
 * @description list of supported languages with their starter code
 * @access public
 */
codeRouter.get('/languages', getLanguagesController)

/**
 * @route POST /api/run
 * @description run code on Judge0 and return its output
 * @access public (guests can run code)
 */
codeRouter.post('/run', limiter(20, 'runs'), attachUser, runCodeController)

export default codeRouter
