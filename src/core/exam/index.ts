import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {
  d,
  $,
  playTextPromise,
  TinyMarkdownFormatter,
  playAll,
} from './grok.helpers'

type PastItem = {
  role: 'user' | 'assistant'
  content: string
}

const _past = localStorage.getItem('grok_exam')
const past: PastItem[] = _past ? JSON.parse(_past) : []
const last_index = past.map(item => item.role).lastIndexOf('assistant')

// const last_index = past.lastIndexOf(item => item.role === 'assistant') // past.findIndex(item => item.role === 'assistant')

past.splice(last_index)

d.addEventListener('DOMContentLoaded', async e => {
  const e_button = $('button[type="submit"]') as HTMLButtonElement
  const e_response = $('section.response') as HTMLElement
  const e_form = $('form') as HTMLFormElement
  const e_prompt = $('textarea[name="prompt"]') as HTMLTextAreaElement

  ProtoForm<{prompt: string}>({
    e_form,
    async onSubmit({values, e_form}) {
      let is_first = true
      const {prompt, read} = values
      const audios: Promise<Response>[] = []
      const chunks: string[] = []

      if (e_prompt) e_prompt.value = ''

      past.push({
        role: 'user',
        content: prompt,
      })

      localStorage.setItem('grok_exam', JSON.stringify(past))

      e_response.innerHTML = ' '
      e_button.innerHTML = 'thinking...'
      e_button.setAttribute('disabled', 'true')

      try {
        const response = await fetch('/api/grok/grok_exam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            past,
          }),
        })

        if (!response.body) {
          console.error('Stream not supported.')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let count = 0

        while (true) {
          count++
          let {done, value} = await reader.read()

          let index = chunks.join('').search(/[.;\?\!]/)

          if (index !== -1) {
            let text = chunks.join('')
            if (text) {
              audios.push(
                playTextPromise({
                  text,
                  voiceId: 'Matthew',
                  engine: 'neural',
                })
              )
            }
            if (is_first) {
              playAll(audios)
              is_first = false
            }
            chunks.length = 0
          }

          if (done) {
            let text = chunks.join('')
            if (text) {
              audios.push(
                playTextPromise({
                  text,
                  voiceId: 'Matthew',
                  engine: 'neural',
                })
              )
              chunks.length = 0
            }
            break
          }
          let chunk = decoder.decode(value, {stream: true})
          chunk.split('\n\n').forEach((item, index) => {
            let piece = item.replaceAll('data: ', '')

            if (piece === '[DONE]') {
              let text = chunks.join('')
              if (text) {
                audios.push(
                  playTextPromise({
                    text,
                    voiceId: 'Matthew',
                    engine: 'neural',
                  })
                )
                chunks.length = 0
              }
              e_response.innerHTML = TinyMarkdownFormatter.format(
                e_response.innerHTML
              )
            }

            if (!piece || piece === '[DONE]') return

            try {
              const json = JSON.parse(piece)
              const content = json?.choices?.[0]?.delta?.content
              e_response.textContent += content || ''
              if (read) {
                chunks.push(content)
              }
            } catch (error) {
              console.error(error)
            }
          })
        }

        past.push({role: 'assistant', content: e_response.innerText})

        e_button.innerText = '...'

        setTimeout(() => {
          e_form.querySelectorAll('.hidden')?.forEach(item => {
            item.classList.remove('hidden')
          })
          e_button.removeAttribute('disabled')
          e_button.innerText = 'What is your answer'
        }, 900)
      } catch (error) {}
    },
  })
})
