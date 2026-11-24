// Sets the admin password for /admin.
// Run with: pnpm admin:password
//
// Asks for a password (hidden while typing), then writes a scrypt hash of it
// to .env as ADMIN_PASSWORD_HASH. Also creates SESSION_SECRET if missing.
// The password itself is never saved anywhere.
import { randomBytes, scryptSync } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { stdin, stdout } from 'node:process'

const ENV_FILE = '.env'

// Characters typed (or piped in) after a line ends are kept for the next question.
let pending = ''

function ask(question) {
  return new Promise((resolve, reject) => {
    stdout.write(question)
    let value = ''
    const hidden = stdin.isTTY
    const finish = () => {
      if (hidden) stdin.setRawMode(false)
      stdin.pause()
      stdin.off('data', onData)
      stdin.off('end', onEnd)
      stdout.write('\n')
      resolve(value)
    }
    const take = (text) => {
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (char === '\n' || char === '\r') {
          pending = text.slice(i + 1).replace(/^\n/, '')
          finish()
          return true
        }
        if (char === '\u0003') {
          if (hidden) stdin.setRawMode(false)
          reject(new Error('Cancelled'))
          return true
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1)
        else value += char
      }
      return false
    }
    const onData = (chunk) => void take(chunk)
    const onEnd = () => finish()

    const buffered = pending
    pending = ''
    if (take(buffered)) return
    if (hidden) stdin.setRawMode(true)
    stdin.setEncoding('utf8')
    stdin.on('data', onData)
    stdin.on('end', onEnd)
    stdin.resume()
  })
}

function setEnv(text, key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  if (pattern.test(text)) return text.replace(pattern, line)
  return `${text.replace(/\n*$/, '\n')}${line}\n`
}

try {
  const password = await ask('New admin password (at least 10 characters): ')
  if (password.length < 10) {
    console.error('Too short. Nothing was changed.')
    process.exit(1)
  }
  const again = await ask('Type it again: ')
  if (again !== password) {
    console.error('The two passwords do not match. Nothing was changed.')
    process.exit(1)
  }

  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)

  let text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : ''
  text = setEnv(
    text,
    'ADMIN_PASSWORD_HASH',
    `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`,
  )
  if (!/^SESSION_SECRET=.{32,}$/m.test(text)) {
    text = setEnv(text, 'SESSION_SECRET', randomBytes(32).toString('hex'))
  }
  writeFileSync(ENV_FILE, text, { mode: 0o600 })

  console.log(
    'Admin password saved to .env. Restart the server, then sign in at /admin',
  )
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
