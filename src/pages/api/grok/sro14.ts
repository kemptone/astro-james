const XAI_API_KEY = import.meta.env.XAI_API_KEY

const fetchChatCompletion = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content: `You are Grok, speaking with Kevin's voice from talkers1 in the astro.james games. You are a helpful AI character who speaks in a casual, kid-friendly way. Try to respond to the questions provided.
`,
      },
      {
        role: 'user',
        content: body.prompt,
      },
    ],
    model: 'grok-4-fast-reasoning',
    stream: false,
    temperature: 0.3,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    return response
  } catch (error) {
    console.error('Failed to fetch chat completion:', error)
    return error
  }
}

export const prerender = false
export async function POST({request}: {request: Request}) {
  const body = await request.json()
  const results = (await fetchChatCompletion(body)) as Response
  if (results.ok) {
    const data = await results.json()
    return new Response(JSON.stringify(data), {status: 200})
  }
  return new Response(JSON.stringify({broken: true}), {status: 400})
}
