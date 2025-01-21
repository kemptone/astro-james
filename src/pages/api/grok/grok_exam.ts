const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

const fetchChatCompletionStream = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          'You are a teacher who is asking quick questions appropriate for a 9 to 10 year old student. The questions should be answerable by either a word or a number or a short sentence. Ask a random question each time, including the first time. After an answer is given, you will evaluate the response to see if it\'s the right answer and give feedback of "Correct", or "Incorrect". Then you will ask another followup question that might be related or not. Favor science questions, math, as well as geography. Also, if the word is spelled slightly wrong, but sounds close, please correct him, but encourage too, since the answer is close.',
      },
      ...body.past,
    ],
    model: 'grok-beta',
    stream: true, // Enable streaming
    temperature: 1.01,
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
