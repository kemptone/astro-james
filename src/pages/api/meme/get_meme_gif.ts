// Define the API URL and key
const apiKey = import.meta.env.TENOR_API_KEY // Replace with your actual API key
const clientKey = 'get_meme_1' // Your client key
const limit = 1 // Number of results to fetch

export const prerender = false
export async function POST({request}: {request: Request}) {
  let requestBody

  try {
    requestBody = await request.json()
  } catch (err) {
    return new Response(JSON.stringify({error: 'Invalid JSON'}), {status: 400})
  }
  const { name } = requestBody
  const url = `https://tenor.googleapis.com/v2/search?q=${name}&key=${apiKey}&client_key=${clientKey}&limit=${limit}&contentfilter=medium`
  // const body = await getMemeGif(name)
  const response = await fetch(url)
  const json = await response.text()
  return new Response(json, { status : 200})
}
