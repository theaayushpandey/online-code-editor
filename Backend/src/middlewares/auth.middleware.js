import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID } from '../config/env.js'

// The browser signs in with Google and gets an ID token: a JWT signed by Google.
// It sends that token in the Authorization header. We check Google's signature
// and that the token was issued for our app. No password ever reaches this server.
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

export async function attachUser(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    req.user = null // guest
    return next()
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: header.slice('Bearer '.length),
      audience: GOOGLE_CLIENT_ID,
    })
    const { sub, name, email, picture } = ticket.getPayload()
    req.user = { id: sub, name, email, picture }
    next()
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}

export function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Sign in with Google to use this feature.' })
  }
  next()
}
