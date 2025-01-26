const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

const fetchChatCompletionStream = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          'Based on a JSON prompt, build a story on how this girl got in trouble at school. Use the following properties from the JSON to build the story. girl = name of the girl, bad_thing = what did she do so bad, behavior_score = what score did she get as to how severe was the behavior, got_caught = how did she get caught, punishment_card = the name of the card the teacher gives the student as punishment. The result should be about 6 sentences.',
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
      return new Response('Stream not available', {status: 500})
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
      JSON.stringify({error: 'Failed to fetch chat completion'}),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
