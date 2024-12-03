import {girls_names} from '../../data/girls_names'
import {d, $, $$} from '../grok/grok.helpers'
import {playGrokStory, playText} from '../talkers2/wc-talkers.helpers'

function buildGirl(name: string) {
  const e_article = document.createElement('article')
  e_article.innerText = name

  e_article.addEventListener('click', async e => {
    const e_progress = document.createElement('progress')
    e_article.appendChild(e_progress)

    const audio = await playGrokStory(
      {
        voiceId: 'Matthew',
        engine: 'generative',
        name,
      },
      false
    )

    audio?.play?.()
    audio?.addEventListener('ended', () => {
      e_article.removeChild(e_progress)
    })

  })

  return e_article
}

function buildGirls(names: string[]) {
  const e_fragment = d.createDocumentFragment()
  names.forEach(name => {
    let element = buildGirl(name)
    e_fragment.appendChild(element)
  })
  return e_fragment
}

function filterResults(name: string, limit: number = 100) {
  const arr = [...girls_names]
  return arr
    .filter(item => item.indexOf(name.toLowerCase()) === 0)
    .slice(0, limit)
}

d.addEventListener('DOMContentLoaded', async e => {
  const e_girls = $('#girls') as HTMLDivElement
  const e_name_filter = $('input[name="name_filter"]') as HTMLInputElement
  const e_limit = $('input[name="limit"]') as HTMLInputElement

  function runFilter() {
    const limit = Number(e_limit?.value)
    const name_filter = e_name_filter.value
    const fragment = buildGirls(filterResults(name_filter, limit))
    e_girls.innerHTML = ''
    e_girls.append(fragment)
  }

  runFilter()

  e_name_filter?.addEventListener('input', e => {
    runFilter()
  })

  e_limit?.addEventListener('input', e => {
    runFilter()
  })
})
