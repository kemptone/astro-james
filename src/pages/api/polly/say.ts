import {
  Engine,
  PollyClient,
  SynthesizeSpeechCommand,
  type SynthesizeSpeechCommandInput,
  type VoiceId,
} from '@aws-sdk/client-polly'

type RequestBody = {
  text: string
  voiceId: string
}

export const prerender = false

export async function post({
  request,
}: {
  request: Request & {
    body: RequestBody
  }
}) {
  let requestBody

  try {
    requestBody = await request.json()
  } catch (err) {
    return new Response(JSON.stringify({error: 'Invalid JSON'}), {status: 400})
  }

  const pollyClient = new PollyClient({
    region: 'us-west-2', // Replace with your preferred AWS region
    credentials: {
      accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID, // Loaded from .env file
      secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY, // Loaded from .env file
    },
  })

  // const {text, voiceId} = request.body
  const text: string = requestBody.text
  const voiceId: VoiceId = requestBody.voiceId as VoiceId
  const engine: Engine = requestBody.engine as Engine

  if (!text || !voiceId) {

    return new Response(
      JSON.stringify({
        missing_text: true,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
          'Custom-Header': 'value',
        },
      }
    )
  }

  const params: SynthesizeSpeechCommandInput = {
    OutputFormat: 'mp3', // You can change this to 'pcm' or 'ogg_vorbis'
    Text: text,
    VoiceId: voiceId,
    Engine: engine,
    TextType: 'text', // Change to 'ssml' if using SSML input
  }

  try {
    const command = new SynthesizeSpeechCommand(params)
    const response = await pollyClient.send(command)

    const res = new Response('', {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="output.mp3"',
        'Content-Length': response.AudioStream.length,
      },
    })

    // Stream the audio directly to the response
    response.AudioStream.pipe(res)

    return response

  } catch (error) {
    console.error('Error synthesizing speech:', error)
    return new Response(JSON.stringify({}), {
      status: 500,
    })
  }
}
