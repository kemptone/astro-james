const subscriptionKey = import.meta.env.AZURE_SPEECH_KEY // 'YourSubscriptionKey';
const serviceRegion = import.meta.env.AZURE_SPEECH_REGION // 'YourServiceRegion';

async function synthesizeSpeech(requestBody: any) {
  const {
    ShortName,
    Gender,
    Locale,
    text,
    text_hidden,
    express_as,
    engine,
    voice,
  } = requestBody

  console.log({
    ShortName,
    text,
  })

  const inner = `${text || text_hidden}`
  const wrapped =
    express_as || engine
      ? `<mstts:express-as style='${
          express_as || engine
        }'>${inner}</mstts:express-as>`
      : inner

  const ssmlContent = `
<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
  <voice xml:lang='${Locale}' xml:gender='${Gender}' name='${
    ShortName || voice
  }'>
  ${wrapped}
  </voice>
</speak>
`

  const response = await fetch(
    `https://${serviceRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
        'Content-Type': 'application/ssml+xml',
      },
      body: ssmlContent,
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  return response.blob()
}

export const prerender = false
export async function POST({
  request,
}: {
  request: Request & {
    body: any
  }
}) {
  let requestBody

  try {
    requestBody = await request.json()
  } catch (err) {
    return new Response(JSON.stringify({error: 'Invalid JSON', requestBody}), {
      status: 400,
    })
  }

  try {
    const output = await synthesizeSpeech(requestBody)
    return new Response(output, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="output.mp3"',
      },
    })
  } catch (error) {
    console.error('Error synthesizing speech:', error)
    return new Response(
      JSON.stringify({error: 'Failed to synthesize speech'}),
      {status: 400}
    )
  }
}
