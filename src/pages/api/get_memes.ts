import {reactions} from '../../data/meme/reactions'

function clean(str: string) {
  return str.replaceAll("'", '’').replaceAll('"', '”')
}

export const prerender = false
export async function GET() {
  const data = reactions.slice(0, 100).map(item => ({
    name: clean(item.name),
    audio: 'https://www.myinstants.com' + clean(item.audio),
  }))

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
