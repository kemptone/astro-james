const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY // 'openai key';

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
    // Parse JSON body for the text we want to convert
    const {text} = await body

    if (!text) {
      return new Response('Missing "text" parameter in request body.', {
        status: 400,
      })
    }

    // Call the OpenAI Moderation API
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/moderations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'omni-moderation-latest',
          input: text,
        }),
      }
    )

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.log({errorText})
      return new Response(`OpenAI API error: ${errorText}`, {
        status: openaiResponse.status,
      })
    }

    return new Response(openaiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (err: any) {
    console.error(err)
    return new Response(`Error moderating text: ${err.message}`, {
      status: 500,
    })
  }
}
