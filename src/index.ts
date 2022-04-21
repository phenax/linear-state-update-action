import * as core from '@actions/core'
// import * as github from '@actions/github'
import * as linear from '@linear/sdk'

async function main(): Promise<void> {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
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
    return
  }

  core.info(`Updating ${issueIds.length} issues...`)
  const targetStateId = await getStateId(linearClient, stateTo, teamId)

  if (!targetStateId) {
    throw new Error('Invalid target state specified')
  }

  const results = await Promise.allSettled(
    issueIds.map((id) =>
      linearClient.issueUpdate(id, { stateId: targetStateId }),
    ),
  )

  const failedResults = results.filter((res) => res.status !== 'fulfilled')

  failedResults.forEach(({ reason }: any) => {
    console.log(JSON.stringify(reason, null, 2))
    core.warning(reason)
  })

  const successCount = results.filter((res) => res.status === 'fulfilled').length
  console.log(`Updated ${successCount} issues successfully. ${failedResults.length} failures`)
}

const getStateId = async (
  linearClient: linear.LinearClient,
  name: string,
  teamId: string,
): Promise<string | undefined> => {
  const targetStateRes = await linearClient.workflowStates({
    filter: { name: { eq: name }, team: { key: { eq: teamId } } },
    first: 1,
  })
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
