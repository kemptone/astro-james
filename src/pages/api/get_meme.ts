import type {APIRoute} from 'astro'

export const prerender = false

export const POST: APIRoute = async ({request}) => {
  let requestBody
  try {
    requestBody = await request.json()
    const {audio, name} = requestBody

    console.log({audio, name, requestBody})

    const response = await fetch(audio)

    if (!response.ok) {
      return new Response('Failed to fetch the MP3 file', {
        status: response.status,
      })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline', // or 'attachment' for download
      },
    })
  } catch (error) {
    console.error('Error reading the MP3 file:', error)
    return new Response('Error loading the file', {status: 500})
  }
}
