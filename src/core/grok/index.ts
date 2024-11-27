import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {
  d,
  $,
  playTextPromise,
  TinyMarkdownFormatter,
  playAll,
} from './grok.helpers'

d.addEventListener('DOMContentLoaded', async e => {
  const e_button = $('button[type="submit"]') as HTMLButtonElement
  const e_reset = $('button[type="reset"]') as HTMLButtonElement
  const e_footer = $('footer') as HTMLElement
  const e_form = $('form') as HTMLFormElement

  e_reset.addEventListener('click', () => {
    e_footer.innerHTML = ''
  })

  ProtoForm<{prompt: string}>({
    e_form,
    async onSubmit({values}) {
      let is_first = true
      const {prompt, read} = values
      const audios: Promise<Response>[] = []
      const chunks: string[] = []

      e_footer.innerHTML = ' '
      e_button.innerHTML = 'thinking...'
      e_button.setAttribute('disabled', 'true')

      try {
        const response = await fetch('/api/grok/grok_stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
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

          if (chunks.length && chunks.length % 15 === 0) {
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
              e_button.innerHTML = 'Ask me'
              e_button.removeAttribute('disabled')
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
              e_footer.innerHTML = TinyMarkdownFormatter.format(
                e_footer.innerHTML
              )
            }

            if (!piece || piece === '[DONE]') return

            try {
              const json = JSON.parse(piece)
              const content = json?.choices?.[0]?.delta?.content
              e_footer.textContent += content || ''
              if (read) {
                chunks.push(content)
              }
            } catch (error) {
              console.error(error)
            }
          })
        }
      } catch (error) {}
    },
  })
})
