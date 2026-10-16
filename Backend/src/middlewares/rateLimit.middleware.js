import rateLimit from 'express-rate-limit'

// Every run costs Judge0 CPU time and every explanation costs LLM tokens,
// so each IP address gets a fixed number of requests per minute.
export const limiter = (max, what) =>
  rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: `Too many ${what}. Wait a minute and try again.` },
  })
