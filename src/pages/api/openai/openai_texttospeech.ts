const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY // 'grok key';

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
    const {text, voice} = await body

    console.log({text})

    if (!text) {
      return new Response('Missing "text" parameter in request body.', {
        status: 400,
      })
    }

    // Construct the TTS request
    const requestBody = {
      model: 'tts-1',
      voice: voice || 'alloy',
      input: text,
    }

    // Call the OpenAI TTS API
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.log({errorText})
      return new Response(`OpenAI TTS API error: ${errorText}`, {
        status: openaiResponse.status,
      })
    }

    console.log(openaiResponse)

    // Return a streamed response back to the client
    // Astro’s Response can accept a ReadableStream directly
    return new Response(openaiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        // Uncomment if you want to trigger browser download:
        // 'Content-Disposition': 'attachment; filename="speech.mp3"'
      },
    })
  } catch (err: any) {
    console.error(err)
    return new Response(`Error generating speech: ${err.message}`, {
      status: 500,
    })
  }
}
