import {PollyClient, DescribeVoicesCommand} from '@aws-sdk/client-polly'

export const prerender = false
export async function GET() {

  const pollyClient = new PollyClient({
    region: 'us-west-2', // Replace with your preferred AWS region
    credentials: {
      accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID, // Loaded from .env file
      secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY, // Loaded from .env file
    },
  })

  const listVoices = async () => {
    try {
      const data = await pollyClient.send(new DescribeVoicesCommand({}))
      return data
    } catch (err) {
      console.error('Error listing voices:', err)

      let outputErr = "Was not able to output the error"

      try {
        outputErr = JSON.stringify(err)
      } catch (err) {
      }

      return new Response(outputErr, {
        status: 400
      })
    }
  }

  const data = await listVoices()

  return new Response(
    JSON.stringify(data),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
