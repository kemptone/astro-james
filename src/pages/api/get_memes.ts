import { memes2 } from '../../data/meme/memes2'
import {reactions} from '../../data/meme/reactions'
import type { MemeType } from '@components/wc-meme-item'

function clean(str: string) {
  if (str) {
    return str.replaceAll("'", '’').replaceAll('"', '”')
  }
  return ""
}

export const prerender = false
export async function GET() {

  const map : {
    [key : string] : boolean
  } = {}

  const ret : MemeType[] = []

  ;[...reactions, ...memes2]
  .map(item => ({
    name: clean(item.name),
    audio: 'https://www.myinstants.com' + clean(item.audio),
  }))
  .forEach( item => {
    if (map[item.audio]) return
    map[item.audio] = true
    ret.push(item)
  })

  // const data = [ ...reactions, ...memes2 ].slice(0, 2000).map(item => ({
  //   name: clean(item.name),
  //   audio: 'https://www.myinstants.com' + clean(item.audio),
  // }))

  return new Response(JSON.stringify(ret), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
