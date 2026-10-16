// Every call from the page to the Express server goes through this file.
import { API_URL } from './config.js'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is it running?')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }
  return data
}

export const getLanguages = () => request('/api/languages')
export const getMe = token => request('/api/me', { token })
export const runCode = (body, token) => request('/api/run', { method: 'POST', body, token })
export const explainError = (body, token) =>
  request('/api/explain', { method: 'POST', body, token })
