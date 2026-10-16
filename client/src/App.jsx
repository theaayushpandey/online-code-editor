import { useEffect, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import Login from './Login.jsx'
import EditorPage from './EditorPage.jsx'
import { getMe } from './api.js'

const TOKEN_KEY = 'coderun.token'

// session is one of:
//   null                    -> not signed in, show the login page
//   { guest: true }         -> continued without an account
//   { token, user }         -> signed in with Google
export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // On page load, reuse the token from this tab if the server still accepts it
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    getMe(token)
      .then(user => setSession({ token, user }))
      .catch(() => sessionStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  async function handleGoogleLogin(token) {
    setError('')
    if (!token) {
      setError('Google sign-in was cancelled or failed. Try again.')
      return
    }
    try {
      const user = await getMe(token) // the server verifies the token with Google
      sessionStorage.setItem(TOKEN_KEY, token)
      setSession({ token, user })
    } catch (err) {
      setError(err.message)
    }
  }

  function handleLogout(message = '') {
    if (session?.token) googleLogout()
    sessionStorage.removeItem(TOKEN_KEY)
    setSession(null)
    setError(message)
  }

  if (loading) return <div className="center-screen">Loading...</div>

  if (!session) {
    return (
      <Login
        error={error}
        onGoogleLogin={handleGoogleLogin}
        onGuest={() => setSession({ guest: true })}
      />
    )
  }

  return <EditorPage session={session} onLogout={handleLogout} />
}
