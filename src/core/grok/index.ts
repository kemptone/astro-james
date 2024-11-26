import ProtoForm from '../../components/ProtoForm/ProtoForm'

const d = document

class TinyMarkdownFormatter {
  static format(input: string): string {
    return (
      input
        // Bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
        // Italics: *text* or _text_
        .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
        // Headings: # Heading
        .replace(/^#{6}\s(.*$)/gm, '<h6>$1</h6>')
        .replace(/^#{5}\s(.*$)/gm, '<h5>$1</h5>')
        .replace(/^#{4}\s(.*$)/gm, '<h4>$1</h4>')
        .replace(/^#{3}\s(.*$)/gm, '<h3>$1</h3>')
        .replace(/^#{2}\s(.*$)/gm, '<h2>$1</h2>')
        .replace(/^#\s(.*$)/gm, '<h1>$1</h1>')
        // Links: [text](url)
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        // Line breaks: Two spaces at end of line
        .replace(/  \n/g, '<br/>')
    )
  }
}

type ChatCompletion = {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
      refusal: string | null
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details: {
      text_tokens: number
      audio_tokens: number
      image_tokens: number
      cached_tokens: number
    }
  }
  system_fingerprint: string
}

d.addEventListener('DOMContentLoaded', async e => {
  const $ = (selectors: string) => d.querySelector(selectors)
  const $$ = (selectors: string) => d.querySelectorAll(selectors)

  const e_button = $("button") as HTMLButtonElement
  const e_footer = $('footer') as HTMLElement
  const e_form = $('form') as HTMLFormElement

  const response = await fetch('/api/grok/stream', {
    method : 'POST',
    body : '{ hello : true }'
  });

  if (!response.body) {
    console.error('Stream not supported.');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    done = streamDone;

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      console.log('Received chunk:', chunk); // Process the chunk
      e_footer.innerHTML += chunk
    }
  }

  ProtoForm<{prompt: string}>({
    e_form,
    async onSubmit({values}) {
      const {prompt} = values

      e_button.innerHTML = 'thinking...'
      e_button.setAttribute('disabled', "true")

      try {
        const results = await fetch('/api/grok/grok', {
          method: 'POST',
          body: JSON.stringify({
            prompt,
          }),
        })
        const data = (await results.json()) as ChatCompletion
        const first = data?.choices[0]?.message?.content || ''
        if (e_footer) e_footer.innerHTML += TinyMarkdownFormatter.format(first)

        e_button.innerHTML = 'Ask me'
        e_button.removeAttribute('disabled')

      } catch (error) {}
    },
  })
})
