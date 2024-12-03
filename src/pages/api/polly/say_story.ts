import {
  Engine,
  PollyClient,
  SynthesizeSpeechCommand,
  type TextType,
  type SynthesizeSpeechCommandInput,
  type VoiceId,
} from '@aws-sdk/client-polly'
import { getRandomBehavior } from '../../../data/bad_stuff'


const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

type RequestBody = {
  text: string
  voiceId: string
  name: string
}

const fetchChatCompletion = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          'In three sentences. Take the prompt as a Name of a girl. And this bad behavior, ' +
          getRandomBehavior() +
          ', and create a short story how the girl got in trouble. Also, what color card did she get as punishment. The Black card is the worst.',
      },
      {
        role: 'user',
        content: body.name,
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
    return response.json()
    // return data
  } catch (error) {
    // console.error('Failed to fetch chat completion:', error)
    return '{ "error" : true }'
  }
}

export const prerender = false

export async function POST({
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

  const json = await fetchChatCompletion(requestBody)

  // console.log({ json })

  // @ts-ignore
  const text = json?.choices?.[0]?.message?.content || ''

  // console.log({ text })

  const pollyClient = new PollyClient({
    region: 'us-west-2', // Replace with your preferred AWS region
    credentials: {
      accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID, // Loaded from .env file
      secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY, // Loaded from .env file
    },
  })

  // const text: string = requestBody.text
  const voiceId: VoiceId = requestBody.voiceId as VoiceId
  const engine: Engine = requestBody.engine as Engine
  const textType: TextType = requestBody.textType as TextType

  if (!text || !voiceId) {
    return new Response(
      JSON.stringify({
        missing_text: true,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  const params: SynthesizeSpeechCommandInput = {
    OutputFormat: 'mp3', // You can change this to 'pcm' or 'ogg_vorbis'
    Text: text,
    VoiceId: voiceId,
    Engine: engine,
    TextType : textType || 'text', // Change to 'ssml' if using SSML input
  }

  try {
    const command = new SynthesizeSpeechCommand(params)
    const response = await pollyClient.send(command)

    // Collect the AudioStream data
    if (response.AudioStream) {
      const audioChunks = []
      for await (const chunk of response.AudioStream) {
        audioChunks.push(chunk)
      }
      const audioBuffer = Buffer.concat(audioChunks)

      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'inline; filename="output.mp3"',
        },
      })
    } else {
      throw new Error('AudioStream is empty')
    }
  } catch (error) {
    console.error('Error synthesizing speech:', error)
    return new Response(JSON.stringify({ error: 'Failed to synthesize speech' }), {
      status: 500,
    })
  }
}
