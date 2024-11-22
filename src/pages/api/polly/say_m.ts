import sdk from 'microsoft-cognitiveservices-speech-sdk'
import {PassThrough} from 'node:stream'

// Replace with your Azure subscription key and service region
const subscriptionKey = import.meta.env.AZURE_SPEECH_KEY // 'YourSubscriptionKey';
const serviceRegion = import.meta.env.AZURE_SPEECH_REGION // 'YourServiceRegion';

async function synthesizeSpeech() {
  const ssmlContent = `
<speak version='1.0' xml:lang='en-US'>
  <voice xml:lang='en-US' xml:gender='Male' name='en-US-ChristopherNeural'>
    I'm excited to try text to speech!
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
        Authorization: `Bearer ${subscriptionKey}`, // Replace with your actual access token
      },
      body: ssmlContent,
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  const blob = await response.blob()
  return blob
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

  const text: string = requestBody.text
  const voiceName: string = requestBody.voiceName

  if (!text || !voiceName) {
    return new Response(
      JSON.stringify({error: 'Invalid voiceName or text', voiceName, text}),
      {
        status: 400,
      }
    )
  }

  try {
    const output = await synthesizeSpeech()
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
