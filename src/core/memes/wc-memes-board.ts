if (typeof window !== 'undefined') {
  customElements.define(
    'wc-memes-board',
    class WcVoice extends HTMLElement {
      async connectedCallback() {

        // const response = await fetch('/api/meme/get_meme_gif', {
        //   method: 'POST',
        //   body: JSON.stringify({}),
        // })
        // debugger

      }
      //   async connectedComponent() {

      //     debugger

      //     const response = await fetch('/api/memes/get_meme_gif', {
      //         method : 'POST',
      //         body : JSON.stringify({})
      //     })

      //   }
    }
  )
}
