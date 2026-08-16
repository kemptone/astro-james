import moderationManifest from '@/data/meme/moderation-manifest.json'
import {
  getPublishedMemeItems,
  MEME_AUDIO_ORIGIN,
} from '@/data/meme/inventory'
import {getBlockedAudioPaths} from '@/data/meme/moderation'
import type {MemeType} from '@/components/wc-meme-item'

function clean(str: string) {
  if (str) {
    return str.replaceAll("'", '’').replaceAll('"', '”')
  }
  return ''
}

export const prerender = false
export async function GET() {
  const blockedAudioPaths = getBlockedAudioPaths(moderationManifest)
  const ret: MemeType[] = getPublishedMemeItems(blockedAudioPaths).map(item => ({
    name: clean(item.name),
    audio: MEME_AUDIO_ORIGIN + clean(item.audio),
  }))

  // const data = [ ...reactions, ...memes2 ].slice(0, 2000).map(item => ({
  //   name: clean(item.name),
  //   audio: 'https://www.myinstants.com' + clean(item.audio),
  // }))

  /* This is is what I used to scrape it, using a browser

  const data = []
  document.querySelectorAll('.instants .instant').forEach( item => {
    const name = item.querySelector("a").innerText
    const audio = item.querySelector("button").getAttribute("onClick").replace("play(", "").replace(")", "").replaceAll("'", "").split(", ")[0]
    data.push({ name, audio })
  })
  console.log(data)

  */

  return new Response(JSON.stringify(ret), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
