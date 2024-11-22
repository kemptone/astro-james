import {
  SpeechConfig,
  AudioConfig,
  SpeechSynthesizer,
  AudioOutputStream,
  ResultReason,
} from 'microsoft-cognitiveservices-speech-sdk'

// Replace with your Azure subscription key and service region
const subscriptionKey = import.meta.env.AZURE_SPEECH_KEY // 'YourSubscriptionKey';
const serviceRegion = import.meta.env.AZURE_SPEECH_REGION // 'YourServiceRegion';

// Set up the speech configuration
const speechConfig = SpeechConfig.fromSubscription(
  subscriptionKey,
  serviceRegion
)

// Types for the request body
interface SynthesizeRequest {
  text: string
  voiceName: string
}

// Utility function to synthesize speech
const synthesizeSpeech = async (
  text: string,
  voiceName: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    // const pushStream = AudioOutputStream.createPushStream()
    const pushStream = AudioOutputStream.createPullStream()
    const audioConfig = AudioConfig.fromStreamOutput(pushStream)
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)

    const audioChunks: Buffer[] = []

    // Collect audio chunks
    pushStream.on('data', (chunk: ArrayBuffer) => {
      audioChunks.push(Buffer.from(chunk))
    })

    pushStream.on('end', () => {
      synthesizer.close()
      resolve(Buffer.concat(audioChunks))
    })

    // Error handling for synthesis
    pushStream.on('error', error => {
      synthesizer.close()
      reject(error)
    })

    // Set voice and synthesize text
    speechConfig.speechSynthesisVoiceName = voiceName
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason !== ResultReason.SynthesizingAudioCompleted) {
          reject(new Error(result.errorDetails || 'Speech synthesis failed.'))
        }
      },
      error => {
        reject(error)
      }
    )
  })
}

type RequestBody = {
  text: string
  voiceId: string
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
    return new Response(JSON.stringify({error: 'Invalid JSON', requestBody}), {
      status: 400,
    })
  }

  const text: string = requestBody.text
  const voiceName: string = requestBody.voiceName

  if (!text || !voiceName) {
    return new Response(JSON.stringify({error: 'Invalid voiceName or text', voiceName, text}), {
      status: 400,
    })
  }

  try {
    const audioBuffer = await synthesizeSpeech(text, voiceName)
    return new Response(audioBuffer, {
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
