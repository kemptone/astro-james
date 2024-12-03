const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

const fetchChatCompletion = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content: "Take the prompt as a Name of a girl. Write a short 2 sentence story describing how the girl got in trouble at school. Also, what color card did she get as punishment. The Black card is the worst.",
      },
      {
        role: 'user',
        content: body.prompt,
      },
    ],
    model: 'grok-beta',
    stream: false,
    temperature: 0,
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
    // const data = await response.json()
    // console.log(data)
    return response
    // return data
  } catch (error) {
    console.error('Failed to fetch chat completion:', error)
    return error
  }
}

//   fetchChatCompletion();

export const prerender = false
export async function POST({request}: {request: Request}) {
  const body = await request.json()
  // console.log({body})
  const results = (await fetchChatCompletion(body)) as Response
  if (results.ok) {
    const data = await results.json()
    return new Response(JSON.stringify(data), {status: 200})
  }
  return new Response(JSON.stringify({broken: true}), {status: 400})
}
