import {girls_names} from '../../data/girls_names'
import {d, $, $$} from '../grok/grok.helpers'
import {playGrokStory, playText} from '../talkers2/wc-talkers.helpers'

async function playStory(e: MouseEvent) {
  const target = e.target as HTMLElement
  const e_parent = target.parentElement as HTMLElement

  const {name = ''} = target.dataset

  const e_progress = document.createElement('progress')
  e_parent.appendChild(e_progress)

  if (name) {
    const audio = await playGrokStory(
      {
        voiceId: 'Matthew',
        engine: 'generative',
        name,
      },
      true
    )

    audio?.addEventListener('ended', () => {
      e_parent.removeChild(e_progress)
    })
  }
}

function buildGirl(name: string, index = 1) {
  const e_article = d.createElement('article')
  const e_button = d.createElement('button')
  const e_span = d.createElement('span')
  const e_num = d.createElement('b')

  e_num.innerText = String(index + 1)
  e_span.innerText = name
  e_button.innerText = '▶'
  e_button.setAttribute("data-name", name)
  // e_button.type = 'button'

  e_article.appendChild(e_num)
  e_article.appendChild(e_span)
  e_article.appendChild(e_button)

  e_button.addEventListener('click', playStory)

  // e_button.addEventListener('click', async e => {
  //   const e_progress = document.createElement('progress')
  //   e_article.appendChild(e_progress)

  //   const audio = await playGrokStory(
  //     {
  //       voiceId: 'Matthew',
  //       engine: 'generative',
  //       name,
  //     },
  //     false
  //   )

  //   audio?.play?.()
  //   audio?.addEventListener('ended', () => {
  //     e_article.removeChild(e_progress)
  //   })
  // })

  return e_article
}

function buildGirls(names: string[]) {
  const e_fragment = d.createDocumentFragment()
  names.forEach((name, index) => {
    let element = buildGirl(name, index)
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
