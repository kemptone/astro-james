import {buildStoryPreviewText} from '../../../core/girls/storyOptions'
import {bestBehaviorLetter, normalizeBehaviorLetter} from '@/core/girls/behaviorLetters'

const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

function buildFallbackStory(body: Record<string, string>) {
  return buildStoryPreviewText({
    personName: body.person_name || body.girl || 'This person',
    choice: body.choice || body.bad_thing || 'made a choice at school',
    behaviorScore: normalizeBehaviorLetter(
      body.behavior_score || bestBehaviorLetter
    ),
    howGood: normalizeBehaviorLetter(
      body.how_good || bestBehaviorLetter
    ),
    whatHappened:
      body.what_happened ||
      body.got_caught ||
      'the teacher noticed right away',
  })
}

const fetchChatCompletionStream = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          'Based on a JSON prompt, build a short school story. Use only these properties from the JSON: person_name, choice, behavior_score, how_good, and what_happened. behavior_score is a behavior letter on this ladder, from best to worst: +A through +Z, then +a through +z, then A through Z, then a through z, then -a through -z, and finally -A through -Z. how_good uses the same ladder. +A is the best letter, Z is neutral, and -Z is the worst letter. Each letter changes the tone, and behavior_score and how_good are separate letters. Do not use lists. Do not repeat the same descriptive phrase twice in the story. Use exactly 6 sentences and follow this frame: 1. "{person_name} has behavior letter day at school and chose {choice} in a {how_good}-style way." 2. "{behavior_score} is ... {how_good} is ..." 3. "{person_name} ..." 4. "When {what_happened}, the teacher said that choice caused {person_name} to have a school behavior letter of {behavior_score}." 5. "Other students could see ..." 6. "{person_name} ended the day understanding the moment went ..., and the parents ..."',
      },
      {
        role: 'user',
        content: JSON.stringify(body),
      },
    ],
    model: 'grok-beta',
    stream: true, // Enable streaming
    temperature: 1,
  }

  let json

  try {
    json = JSON.stringify(requestBody)
  } catch (error) {
    console.error('something is wrong with the requestBody', body, error)
    return null
  }

  if (!XAI_API_KEY) {
    return null
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: json,
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.body // Return the readable stream
  } catch (error) {
    console.error('Failed to fetch chat completion:', error)
    throw error
  }
}

// Streaming handler for Astro API route
export const prerender = false

export async function POST({request}: {request: Request}) {
  let body
  try {
    body = await request.json() // Attempt to parse JSON
  } catch (error) {
    console.error('Failed to parse request body as JSON:', error)
    return new Response(JSON.stringify({error: 'Invalid JSON format'}), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const stream = await fetchChatCompletionStream(body)
    if (!stream) {
      return new Response(`data: ${JSON.stringify({
        choices: [{delta: {content: buildFallbackStory(body)}}],
      })}\n\ndata: [DONE]\n\n`, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    // Stream the response to the client
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Error handling streaming:', error)
    return new Response(
      `data: ${JSON.stringify({
        choices: [{delta: {content: buildFallbackStory(body)}}
        ],
      })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
      }
    )
  }
}
