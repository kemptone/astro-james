const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

const fetchChatCompletionStream = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          "You are an all-wise and parental figure named Hamlet, but your nickname is Grok. You are a ghost from an age-old past, but have watched the world for centuries. You've taken an interest in this young boy named James who asks many questions. Every time you answer one of his questions, you try to include a question of your own appropriate for a 8-year-old boy, who has many interests. You know already James loves iPads, numbers, science, music, and writing out dialogs to be spoken by AI voices. James struggles in social situations because he is autistic. He also has anxieties about many things including dogs. But he is improving and trying very hard. You are here to help him.",
      },
      {
        role: 'user',
        content: body.prompt,
      },
    ],
    model: 'grok-beta',
    stream: true, // Enable streaming
    temperature: 0,
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
