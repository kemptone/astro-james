export function addUserMessage(message) {
  const chatMessages = document.getElementById('chatMessages')
  const messageDiv = document.createElement('div')
  messageDiv.className = 'message user-message'
  messageDiv.textContent = message
  chatMessages.appendChild(messageDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

export function addGrokMessage(message) {
  const chatMessages = document.getElementById('chatMessages')
  const messageDiv = document.createElement('div')
  messageDiv.className = 'message grok-message'
  messageDiv.textContent = message
  chatMessages.appendChild(messageDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return messageDiv
}

export async function speakWithKevin(text) {
  try {
    const response = await fetch('/api/polly/say', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voiceId: 'Kevin',
        engine: 'neural',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch audio')
    }

    const reader = response.body?.getReader()
    const chunks = []

    while (true) {
      const {done, value} = await reader?.read()
      if (done) break
      chunks.push(value)
    }

    const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    audio.play()
  } catch (error) {
    console.error('Speech error:', error)
  }
}

export async function handleChatSubmit(e) {
  e.preventDefault()
  const input = document.getElementById('messageInput')
  const message = input.value.trim()

  if (!message) return

  addUserMessage(message)
  input.value = ''

  // Show loading state
  const loadingDiv = addGrokMessage('Kevin is thinking...')
  loadingDiv.classList.add('loading')

  try {
    const response = await fetch('/api/grok/sro14', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: message,
      }),
    })

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const grokResponse = data.choices[0].message.content
      loadingDiv.remove()
      addGrokMessage(grokResponse)

      // Speak the response with Kevin's voice
      speakWithKevin(grokResponse)
    } else {
      loadingDiv.textContent = 'Sorry, I had trouble understanding that.'
      loadingDiv.classList.remove('loading')
    }
  } catch (error) {
    console.error('Chat error:', error)
    loadingDiv.textContent =
      'Sorry, I had trouble connecting. Please try again.'
    loadingDiv.classList.remove('loading')
  }
}
