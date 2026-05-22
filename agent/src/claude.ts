import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PERSONA = readFileSync(join(__dirname, '../prompts/persona.md'), 'utf8')

/** Default to Haiku — override with ANTHROPIC_MODEL in env if needed */
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY must be set')
    client = new Anthropic({ apiKey })
  }
  return client
}

export interface GeneratedContent {
  title: string
  description: string
  body: string
}

function parseContentResponse(text: string): GeneratedContent {
  // Extract JSON from response — Claude wraps it in ```json blocks or returns raw
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/)
  if (!jsonMatch?.[1]) {
    throw new Error('Could not parse content JSON from Claude response')
  }
  const parsed = JSON.parse(jsonMatch[1]) as GeneratedContent
  if (!parsed.title || !parsed.description || !parsed.body) {
    throw new Error('Claude response missing required fields: title, description, body')
  }
  return parsed
}

/**
 * Generate a weekly AI x Crypto news digest.
 * Uses web_search tool to find the latest stories.
 */
export async function generateNewsDigest(): Promise<GeneratedContent> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: PERSONA,
    messages: [
      {
        role: 'user',
        content:
          'Search for the latest AI x Crypto news from the past 7 days. ' +
          'Find the top 3 stories and produce a newsletter digest in the required JSON format.',
      },
    ],
  })

  // Extract final text block (after tool use)
  const textBlock = response.content.findLast((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in Claude response')
  }

  return parseContentResponse(textBlock.text)
}

/**
 * Generate a deep-dive article on a specific topic.
 */
export async function generateDeepDive(topic: string): Promise<GeneratedContent> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 6000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: PERSONA,
    messages: [
      {
        role: 'user',
        content:
          `Search for the latest information about: "${topic}". ` +
          'Produce a deep-dive analysis article in the required JSON format.',
      },
    ],
  })

  const textBlock = response.content.findLast((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in Claude response')
  }

  return parseContentResponse(textBlock.text)
}

