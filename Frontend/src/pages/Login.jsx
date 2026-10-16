import { GoogleLogin } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID } from '../config.js'

export default function Login({ error, onGoogleLogin, onGuest }) {
  return (
    <div className="center-screen">
      <div className="login-card">
        <div className="logo">&lt;/&gt;</div>
        <h1>CodeRun</h1>
        <p className="muted">
          Write, run and debug code in 12 languages, right in your browser.
        </p>

        {GOOGLE_CLIENT_ID ? (
          <div className="google-button">
            <GoogleLogin
              // credential is the ID token (a JWT) that Google issued for this user
              onSuccess={response => onGoogleLogin(response.credential)}
              onError={() => onGoogleLogin(null)}
              theme="filled_blue"
              size="large"
              text="continue_with"
            />
          </div>
        ) : (
          <p className="notice">
            Google sign-in is not set up yet. Add VITE_GOOGLE_CLIENT_ID to Frontend/.env.
          </p>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="divider">or</div>

        <button className="btn btn-ghost" onClick={onGuest}>
          Continue as guest
        </button>
        <p className="muted small">
          Guests can run code. Sign in to unlock the AI error explainer.
        </p>
      </div>
    </div>
  )
}
