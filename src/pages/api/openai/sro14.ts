import {DEFAULT_GAME_NAME, normalizeGameName} from '@/core/sro14/settings'
import {buildInstructions, formatKevinReply, validatedLocalTurns} from '@/core/sro14/conversation'

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY

export const prerender = false

function getResponseText(data: any) {
  if (typeof data.output_text === 'string') {
    return data.output_text.trim()
  }

  return (data.output ?? [])
    .flatMap((item: any) => item.content ?? [])
    .filter(
      (content: any) =>
        content.type === 'output_text' && typeof content.text === 'string'
    )
    .map((content: any) => content.text)
    .join('\n')
    .trim()
}

export async function POST({request}: {request: Request}) {
  let body

  try {
    body = await request.json()
  } catch (error) {
    console.error('Failed to parse request body as JSON:', error)
    return new Response(JSON.stringify({error: 'Invalid JSON format'}), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  const gameName = normalizeGameName(body?.gameName) ?? DEFAULT_GAME_NAME
  const localTurns = validatedLocalTurns(body?.localTurns)
  const previousResponseId =
    typeof body?.previousResponseId === 'string'
      ? body.previousResponseId.trim()
      : ''

  if (!prompt) {
    return new Response(JSON.stringify({error: 'Missing "prompt" parameter'}), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({error: 'Missing OPENAI_API_KEY'}), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const requestBody: Record<string, unknown> = {
      model: 'gpt-4.1-mini',
      instructions: buildInstructions(gameName),
      input: localTurns.length ? [...localTurns, {role: 'user', content: prompt}] : prompt,
      temperature: 0.3,
    }

    if (previousResponseId) {
      requestBody.previous_response_id = previousResponseId
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI response error:', errorText)
      return new Response(
        JSON.stringify({
          error: 'OpenAI API error',
        }),
        {
          status: openaiResponse.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const data = await openaiResponse.json()
    const responseText = getResponseText(data)

    if (!responseText) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI response did not include text',
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const message = formatKevinReply(responseText)

    return new Response(
      JSON.stringify({
        id: data.id,
        message,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Failed to fetch OpenAI response:', error)
    return new Response(JSON.stringify({error: 'OpenAI request failed'}), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
