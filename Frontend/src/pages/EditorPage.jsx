import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { explainError, getLanguages, runCode } from '../services/api.js'

const ACCEPTED = 3 // Judge0 status id for a run that finished without errors
const savedCodeKey = languageId => `coderun.code.${languageId}`

export default function EditorPage({ session, onLogout }) {
  const [languages, setLanguages] = useState([])
  const [language, setLanguage] = useState(null)
  const [code, setCode] = useState('')
  const [stdin, setStdin] = useState('')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [error, setError] = useState('')

  const user = session.user

  // Load the language list once, then open the first language
  useEffect(() => {
    getLanguages()
      .then(list => {
        setLanguages(list)
        selectLanguage(list[0])
      })
      .catch(err => setError(err.message))
  }, [])

  function selectLanguage(next) {
    setLanguage(next)
    // Bring back what the user last wrote in this language, or the starter code
    setCode(localStorage.getItem(savedCodeKey(next.id)) ?? next.template)
    setResult(null)
    setExplanation('')
    setError('')
  }

  function handleCodeChange(value = '') {
    setCode(value)
    localStorage.setItem(savedCodeKey(language.id), value)
  }

  function handleReset() {
    localStorage.removeItem(savedCodeKey(language.id))
    setCode(language.template)
  }

  // A 401 means the Google token expired (they last one hour), so sign the user out
  function handleApiError(err) {
    if (err.status === 401 && session.token) {
      onLogout(err.message)
    } else {
      setError(err.message)
    }
  }

  async function handleRun() {
    if (running || !language) return
    setRunning(true)
    setError('')
    setResult(null)
    setExplanation('')
    try {
      setResult(await runCode({ code, languageId: language.id, stdin }, session.token))
    } catch (err) {
      handleApiError(err)
    } finally {
      setRunning(false)
    }
  }

  async function handleExplain() {
    setExplaining(true)
    setError('')
    try {
      const data = await explainError(
        { code, languageId: language.id, error: errorText(result) },
        session.token,
      )
      setExplanation(data.explanation)
    } catch (err) {
      handleApiError(err)
    } finally {
      setExplaining(false)
    }
  }

  const failed = result && result.statusId !== ACCEPTED

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="logo small-logo">&lt;/&gt;</span> CodeRun
        </div>

        <div className="toolbar">
          <select
            value={language?.id ?? ''}
            onChange={e => selectLanguage(languages.find(l => l.id === Number(e.target.value)))}
          >
            {languages.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost" onClick={handleReset} disabled={!language}>
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleRun} disabled={running || !language}>
            {running ? 'Running...' : 'Run  (Ctrl + Enter)'}
          </button>
        </div>

        <div className="user">
          {user ? (
            <>
              <img src={user.picture} alt="" referrerPolicy="no-referrer" />
              <span>{user.name}</span>
            </>
          ) : (
            <span className="muted">Guest</span>
          )}
          <button className="btn btn-ghost" onClick={() => onLogout()}>
            {user ? 'Sign out' : 'Sign in'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="editor-pane">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language?.monaco}
            value={code}
            onChange={handleCodeChange}
            onMount={(editor, monaco) => {
              // Ctrl/Cmd + Enter clicks the Run button, so it always uses the latest code
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
                document.getElementById('run-shortcut').click(),
              )
            }}
            options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
          />
          <button id="run-shortcut" hidden onClick={handleRun} />
        </section>

        <section className="side-pane">
          <div className="panel">
            <h2>Input (stdin)</h2>
            <textarea
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              placeholder="Anything your program reads from standard input"
              spellCheck={false}
            />
          </div>

          <div className="panel grow">
            <h2>
              Output
              {result && (
                <span className={`badge ${failed ? 'badge-bad' : 'badge-good'}`}>
                  {result.status}
                </span>
              )}
              {result?.time && (
                <span className="muted small">
                  {result.time}s · {result.memory} KB
                </span>
              )}
            </h2>

            {error && <p className="error-text">{error}</p>}
            {running && <p className="muted">Running your code...</p>}
            {!running && !result && !error && (
              <p className="muted">Run your code to see the output here.</p>
            )}

            {result?.stdout && <pre className="output">{result.stdout}</pre>}
            {failed && errorText(result) && <pre className="output output-bad">{errorText(result)}</pre>}
            {result && !failed && !result.stdout && <p className="muted">The program printed nothing.</p>}

            {failed && (
              <div className="ai-box">
                <button className="btn btn-ai" onClick={handleExplain} disabled={explaining}>
                  {explaining ? 'Thinking...' : 'Explain this error with AI'}
                </button>
                {explanation && (
                  <div className="ai-answer">
                    <p className="small muted">AI suggestion. It can be wrong, so check it against the error.</p>
                    <p>{explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

// Compile errors, runtime errors and Judge0's own message arrive in different fields
function errorText(result) {
  return [result.compileOutput, result.stderr, result.message].filter(Boolean).join('\n')
}
