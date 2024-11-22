const subscriptionKey = import.meta.env.AZURE_SPEECH_KEY // 'YourSubscriptionKey';
const serviceRegion = import.meta.env.AZURE_SPEECH_REGION // 'YourServiceRegion';

const getVoicesRest = async () => {
  const url = `https://${serviceRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
    })
    const data = await response.json()
    return data // Returns a clean array of voices
  } catch (error) {
    console.error('Error fetching voices:', error)
    throw error
  }
}

export const prerender = false
export async function GET() {
  console.log('*** HELLO *** HELLO ***')

  const voices = await getVoicesRest()

  console.log({voices})

  return new Response(JSON.stringify(voices), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 400,
  })
}
