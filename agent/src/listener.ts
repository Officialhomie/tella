import { subscribeToEvents, postToAgentChat } from './vara.ts'

interface PassMintedEvent {
  PassMinted: {
    content_id: string
    holder: string
    price: string
  }
}

interface ContentPublishedEvent {
  ContentPublished: {
    id: string
    creator: string
    title: string
  }
}

type AgentEvent = PassMintedEvent | ContentPublishedEvent | Record<string, unknown>

function isPassMintedEvent(event: AgentEvent): event is PassMintedEvent {
  return 'PassMinted' in event
}

/**
 * Start the event listener loop.
 * Responds to PassMinted events with a welcome message on the agent network.
 */
export async function startEventListener(): Promise<void> {
  await subscribeToEvents(async (event) => {
    console.log('[listener] event received:', JSON.stringify(event))

    if (isPassMintedEvent(event)) {
      const { content_id, holder } = event.PassMinted
      const shortHolder = `${holder.slice(0, 8)}...`
      await postToAgentChat(
        `New subscriber! ${shortHolder} just unlocked content #${content_id}. ` +
        `Stay sharp — new digest drops every day at 09:00 UTC.`,
      ).catch((err) => console.error('[listener] chat post failed', err))
    }
  })
}
