import ProtoForm from '../../components/ProtoForm/ProtoForm'
import './wc-talker'
import {type DescribeVoicesCommandOutput} from '@aws-sdk/client-polly'

const VOICES = 'get_voices'

function makeFace(name: string) {
  return `https://api.multiavatar.com/${name}.png`
}

type FormType = {
  texts: string[]
  voices: string[]
}

const dog = {
  [VOICES]: (function () {
    let _t = localStorage.getItem(VOICES)
    if (_t) return JSON.parse(_t) as DescribeVoicesCommandOutput
    return null
  })(),
}

async function getVoices() {
  if (dog[VOICES]) return dog[VOICES]
  const response = await fetch('/api/polly/list')
  const json = (await response.json()) as {data: DescribeVoicesCommandOutput}

  json.data.Voices = json.data.Voices?.filter?.(item => {
    return item.LanguageCode?.startsWith('en')
  })

  json.data.Voices?.forEach(item => {
    item.Face = makeFace(item.Name)
    return item
  })

  localStorage.setItem(VOICES, JSON.stringify(json.data))
  dog[VOICES] = json.data
}

document.addEventListener('DOMContentLoaded', async e => {
  const data = (await getVoices()) as DescribeVoicesCommandOutput

  // const e_form = document.querySelector('#talkers form') as HTMLFormElement
  const e_list = document.querySelector('#list') as HTMLFormElement
  const e_input_area = document.querySelector("#input_area") as HTMLDivElement
  const e_fragment = document.createDocumentFragment()

  data?.Voices?.forEach(item => {
    const element = document.createElement('wc-talker')
    element.setAttribute('data-info', JSON.stringify(item))
    element.setAttribute('data-preview', "1")
    e_fragment.appendChild(element)
  })

  e_list.append(e_fragment)

  e_list.addEventListener('clicked_add', e => {
    // @ts-ignore
    const detail = e.detail as Voice
    const element = document.createElement('wc-talker')
    element.setAttribute('data-info', JSON.stringify(detail))
    e_input_area.appendChild(element)
  })

  // ProtoForm<FormType>({
  //   e_form,
  //   onIsInvalid: () => {},
  //   onIsValid: () => {},
  //   onSubmit: form => {},
  // })
})
