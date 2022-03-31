import * as core from '@actions/core'
import * as github from '@actions/github'
import * as linear from '@linear/sdk'

async function main(): Promise<void> {
  const apiKey: string = core.getInput('linear-key');
  // const teamId: string = core.getInput('linear-team-id');

  const stateFrom: string = core.getInput('state-from');
  const stateTo: string = core.getInput('state-to');

  console.log(apiKey, stateFrom, stateTo)

  const linearClient = new linear.LinearClient({ apiKey });
  const result = await linearClient.issues({
    filter: {
      state: { name: { eq: stateFrom } },
    }
  })

  console.log('>>>>>>>>>', result)
}

main().catch(error => core.setFailed(error.message))
