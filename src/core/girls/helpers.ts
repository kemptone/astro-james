function getGrokResponse () {

}

// e_article.addEventListener('click', async e => {
//     const e_progress = document.createElement('progress')
//     e_article.appendChild(e_progress)

//     const results = await fetch('/api/grok/story', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({prompt: name}),
//     })

//     const json = await results.json()
//     const text = json?.choices?.[0]?.message?.content || ''

//     const response = await fetch('/api/polly/say', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         voiceId: 'Matthew',
//         engine: 'generative',
//         text,
//       }),
//     })

//     // Read the response body as a ReadableStream
//     const reader = response.body?.getReader()
//     const chunks = []

//     // Read chunks of data from the stream
//     while (true) {
//       const {done, value} = await reader?.read?.()
//       if (done) break
//       chunks.push(value)
//     }

//     // Convert chunks to a Blob
//     const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
//     const audioUrl = URL.createObjectURL(audioBlob)

//     // Create and play an audio element
//     const audio = new Audio(audioUrl)

//     audio.play()
//     audio.addEventListener('ended', () => {
//       e_article.removeChild(e_progress)
//     })
//   })