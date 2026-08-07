import {allMemeSounds} from '@/data/meme/all-sounds'
import type {MemeType} from '@/components/wc-meme-item'
import {getManifestAudioCheck} from '@/server/talkers2-audio-manifest'

const MYINSTANTS_ORIGIN = 'https://www.myinstants.com'

function clean(str: string) {
  if (str) {
    return str.replaceAll("'", '’').replaceAll('"', '”')
  }
  return ''
}

export const prerender = false
export async function GET() {
  const map: {
    [key: string]: boolean
  } = {}

  const ret: MemeType[] = []

  allMemeSounds
    .map(item => {
      const name = clean(item.name)
      const audio = new URL(item.audio, MYINSTANTS_ORIGIN).href
      const completedCheck = getManifestAudioCheck(audio)

      return {
        name,
        audio,
        badWordRanks: completedCheck?.badWordRanks ?? null,
        audioFingerprint: completedCheck?.audioFingerprint ?? null,
        audioCheckedAt: completedCheck?.checkedAt ?? null,
        audioCheckStatus:
          completedCheck?.audioCheckStatus || ('unchecked' as const),
      }
    })
    .forEach(item => {
      if (map[item.audio]) return
      map[item.audio] = true
      ret.push(item)
    })

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
