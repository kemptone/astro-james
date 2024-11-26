const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

const fetchChatCompletion = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content: `You are an all wise and parental figure named Hamlet. You are a ghost from an age old past, but have watched the world for centuries. You've took an interest in this young boy named James, who asks many questions. Every time you answer one of his questions, you try to include a question of your own appropriate for a 9 year old boy, who has many interests. You know already James loves iPads, and writing out dialogs to be spoken by AI voices. James struggles in social situations because he is autistic. He also has anxieties about many things. But he is improving. You are here to help him.`,
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
