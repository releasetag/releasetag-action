const core = require('@actions/core');
const github = require('@actions/github');
const spawn = require('child-process-promise').spawn;

// Returns tag of last release
async function getLastReleaseTag(pattern) {
  let arguments = ['describe', 'HEAD', '--tags', '--abbrev=0']
  if (pattern) {
    arguments.push(`--match "${pattern}"`)
  }
  const output = await spawn('git', arguments)
  return output.stdout.trim()
}

// Returns array of notes since last release with a tag matching a pattern
async function getReleaseNotes(pattern) {
  let arguments = ['log', '--oneline"']
  const lastReleaseTag = await getLastReleaseTag(pattern)
  if (lastReleaseTag) {
    arguments.push(`${lastReleaseTag}..HEAD`)
  }
  const output = await spawn('git', arguments, { capture: [ 'stdout', 'stderr' ] })
  return output.stdout.trim().split('\n')
}

async function sendPost(url, options) {
  return new Promise((resolve, reject) => {
    request(url, options, (error, response, body) => {
      if (error || response.statusCode < 200 || response.statusCode > 299) {
        return reject(error)
      } else {
        return resolve(body)
      }
    })
  })
}

async function execute() {
  try {
    const token = core.getInput('token')
    const pattern = core.getInput('last-release-pattern')
    const notes = await getReleaseNotes(pattern)
    const result = await sendPost('https://api.releasetag.com/updaterelease', { token, notes })
    console.log(result)
  } catch (error) {
    core.setFailed(error.message)
  }
}

execute()
