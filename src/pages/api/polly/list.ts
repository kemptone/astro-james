import {PollyClient, DescribeVoicesCommand} from '@aws-sdk/client-polly'

export const prerender = false
export async function get({request}) {
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
      return {data}
    } catch (err) {
      console.error('Error listing voices:', err)
      return {err}
    }
  }

  const {data, err} = await listVoices()

  return new Response(
    JSON.stringify({
      data,
      err,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
