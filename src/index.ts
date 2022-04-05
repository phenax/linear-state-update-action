import * as core from '@actions/core'
// import * as github from '@actions/github'
import * as linear from '@linear/sdk'

const LINEAR_ENDPOINT = 'https://api.linear.app/graphql'

const createLinearRequest = (query: string) => (variables: any, apiKey: string) => fetch(LINEAR_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({ query, variables }),
})
  .then(r => r.json())
  .then(res => res?.errors ? Promise.reject(res) : res)

const updateState = createLinearRequest(`
  mutation IssueUpdate($id: String!, $stateId: String!) {
    issueUpdate(
      id: $id,
      input: {
        stateId: $stateId,
      }
    ) {
      success
    }
  }
`)

async function main(): Promise<void> {
  const apiKey: string = core.getInput('linear-api-key')
  const teamId: string = core.getInput('linear-team-key')

  const stateFrom: string = core.getInput('state-from')
  const stateTo: string = core.getInput('state-to')

  const linearClient = new linear.LinearClient({ apiKey })

  const issueResult = await loadAllMatchingIssues(
    linearClient,
    stateFrom,
    teamId,
  )
  const issueIds = await Promise.all(issueResult.nodes.map((issue) => issue.id))

  if (issueIds.length === 0) {
    core.info('No issues found')
    return;
  }

  core.info(`Updating ${issueIds.length} issues...`)
  const targetStateId = await getStateId(linearClient, stateTo)

  if (!targetStateId) {
    throw new Error('Invalid target state specified')
  }

  const result = await Promise.allSettled(issueIds.map(id =>
    updateState({ id, stateId: targetStateId }, apiKey)
    // NOTE: Linear SDK sometimes gives us an internal server error
    // linearClient.issueUpdate(id, { stateId: targetStateId })
  ))

  result.filter(res => res.status !== 'fulfilled').forEach(({ reason }: any) => {
    console.log(reason.errors)
    core.warning(reason)
  })

  console.log(`Updated ${result.filter(res => res.status === 'fulfilled').length} issues successfully`)
}

const getStateId = async (linearClient: linear.LinearClient, name: string): Promise<string | undefined> => {
  const targetStateRes = await linearClient.workflowStates({ filter: { name: { eq: name } }, first: 1 })
  return targetStateRes.nodes[0]?.id
}

const loadAllMatchingIssues = async (
  linearClient: linear.LinearClient,
  state: string,
  teamId: string,
): Promise<linear.IssueConnection> => {
  const result = await linearClient.issues({
    filter: {
      team: { key: { eq: teamId } },
      state: { name: { eq: state } },
    },
    first: 200,
  })

  const run = async (
    result: linear.IssueConnection,
  ): Promise<linear.IssueConnection> => {
    if (result.pageInfo.hasNextPage) {
      return run(await result.fetchNext())
    }
    return result
  }

  return run(result)
}

main().catch((error) => core.setFailed(error.message))
