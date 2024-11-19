import {PollyClient, DescribeVoicesCommand} from '@aws-sdk/client-polly'
const REGION = 'us-west-2' // Replace with your AWS region

export async function get({request}) {
  //   const pollyClient = new PollyClient({region: REGION})

  const pollyClient = new PollyClient({
    region: 'us-west-2', // Replace with your preferred AWS region
    credentials: {
      accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID, // Loaded from .env file
      secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY, // Loaded from .env file
    },
  })

  console.log(import.meta.env.aws_access_key_id)
  console.log(import.meta.env.aws_secret_access_key)

  const listVoices = async () => {
    try {
      const data = await pollyClient.send(
        new DescribeVoicesCommand({})
      )
      data.Voices.forEach(voice => {
        console.log(
          `Name: ${voice.Name}, Language: ${voice.LanguageName}, Gender: ${voice.Gender}`
        )
      })
      return data
    } catch (err) {
      console.error('Error listing voices:', err)
    }
  }

  const data = await listVoices()

  return new Response(
    JSON.stringify({
      message: 'Hello, this is an API response from Astro!',
      data,
    }, true, 2),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
