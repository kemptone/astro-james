import { memes2 } from '../../data/meme/memes2'
import {reactions} from '../../data/meme/reactions'

function clean(str: string) {
  if (str) {
    return str.replaceAll("'", '’').replaceAll('"', '”')
  }
  return ""
}

export const prerender = false
export async function GET() {
  const data = [ reactions, ...memes2 ].slice(0, 2000).map(item => ({
    name: clean(item.name),
    audio: 'https://www.myinstants.com' + clean(item.audio),
  }))

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
