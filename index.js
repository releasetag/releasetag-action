const core = require('@actions/core')
const github = require('@actions/github')
const spawn = require('child-process-promise').spawn
const https = require('https')

// Compile with:
// ncc build index.js --license licenses.txt

// Returns tag of last release
async function getLastReleaseTag(pattern) {
  let arguments = ['describe', 'HEAD', '--tags', '--abbrev=0']
  if (pattern) {
    arguments.push(`--match "${pattern}"`)
  }
  try {
    const output = await spawn('git', arguments)
    return output.stdout.trim()
  } catch {
    // No tags
    const output = await spawn('git', ['rev-list', '--max-parents=0', 'HEAD'], { capture: [ 'stdout', 'stderr' ] })
    return output.stdout.trim().split('\n')
  }
}

// Returns array of notes since last release with a tag matching a pattern
async function getReleaseNotes(pattern) {
  let arguments = ['log', '--oneline']
  const lastReleaseTag = await getLastReleaseTag(pattern)
  if (lastReleaseTag) {
    arguments.push(`${lastReleaseTag}..HEAD`)
  }
  const output = await spawn('git', arguments, { capture: [ 'stdout', 'stderr' ] })
  return output.stdout.trim().split('\n')
}

async function sendPost(url, data) {
  const dataString = JSON.stringify(data)

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length,
    },
    timeout: 5000, // in ms
  }

  console.log('Sending post to ' + url)
  console.log(data)
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(new Error(`HTTP status code ${res.statusCode}`))
      }

      const body = []
      res.on('data', (chunk) => body.push(chunk))
      res.on('end', () => {
        const resString = Buffer.concat(body).toString()
        resolve(resString)
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request time out'))
    })

    req.write(dataString)
    req.end()
  })
}

async function execute() {
  try {
    const token = core.getInput('token')
    const platform = core.getInput('platform')
    const product = core.getInput('product')
    const version = core.getInput('version')
    const pattern = core.getInput('last-release-pattern')
    const notes = await getReleaseNotes(pattern)
    console.log(notes)
    console.log('Updating release...')
    const result = await sendPost('https://us-central1-releasetag-2ca86.cloudfunctions.net/updateRelease', { token, notes, product, platform, version })
    console.log(result)
  } catch (error) {
    console.log('Error: ' + error.message)
    core.setFailed(error.message)
  }
}

execute()
