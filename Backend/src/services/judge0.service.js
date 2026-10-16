import { JUDGE0_API_KEY, JUDGE0_URL } from '../config/env.js'

const toBase64 = text => Buffer.from(text ?? '', 'utf8').toString('base64')
const fromBase64 = text => (text ? Buffer.from(text, 'base64').toString('utf8') : '')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function judge0Headers() {
  const headers = { 'Content-Type': 'application/json' }
  if (JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY
    headers['X-RapidAPI-Host'] = new URL(JUDGE0_URL).host
  }
  return headers
}

// Judge0 is asynchronous: we submit the code and get a token back straight away,
// then ask for the result with that token until the status is no longer
// "In Queue" (1) or "Processing" (2).
export async function runOnJudge0({ code, languageId, stdin }) {
  const createRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: judge0Headers(),
    body: JSON.stringify({
      source_code: toBase64(code),
      language_id: languageId,
      stdin: toBase64(stdin),
      cpu_time_limit: 5,
    }),
  })
  if (!createRes.ok) {
    throw new Error(`Judge0 rejected the submission (HTTP ${createRes.status})`)
  }
  const { token } = await createRes.json()

  const fields = 'stdout,stderr,compile_output,message,status,time,memory'
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(attempt === 0 ? 500 : 1000)
    const res = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=${fields}`,
      { headers: judge0Headers() },
    )
    if (!res.ok) {
      throw new Error(`Judge0 could not return the result (HTTP ${res.status})`)
    }
    const result = await res.json()
    if (result.status.id > 2) {
      return {
        statusId: result.status.id,
        status: result.status.description,
        stdout: fromBase64(result.stdout),
        stderr: fromBase64(result.stderr),
        compileOutput: fromBase64(result.compile_output),
        message: fromBase64(result.message),
        time: result.time,
        memory: result.memory,
      }
    }
  }
  throw new Error('Judge0 took too long to respond')
}
