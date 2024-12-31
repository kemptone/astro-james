const cache: {
  [key: string]: any
} = {}

if (typeof window != 'undefined')
  customElements.define(
    'wc-meme-image',
    class MemeImage extends HTMLElement {
      async connectedCallback() {
        // only going to add, never remove observers for now

        this.innerHTML = `<img width="100" height="100">`

        if ('IntersectionObserver' in window) {
          let observer = new IntersectionObserver(entries => {
            entries.forEach(async entry => {
              if (entry.isIntersecting) {
                const {name = ''} = this.dataset

                // Element is visible; load data
                observer.unobserve(this)
                observer.disconnect()

                if (!cache[name]) {
                  const response = await fetch('/api/meme/get_meme_gif', {
                    method: 'POST',
                    body: JSON.stringify({name}),
                  })

                  const data = await response.json()
                  const gif = data?.results?.[0]?.media_formats?.gif

                  cache[name] = gif
                }

                const gif = cache[name]

                if (!gif) return

                const url: string = gif?.url
                const width: number = gif?.dims?.[0]
                const height: number = gif?.dims?.[1]

                this.querySelectorAll('img')?.forEach(img => {
                  img.src = url
                  img.width = width
                  img.height = height
                })
              }
            })
          })
          observer.observe(this)
        }
      }
    }
  )
