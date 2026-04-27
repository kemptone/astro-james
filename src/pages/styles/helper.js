export function addUserMessage(message) {
  const chatMessages = document.getElementById('chatMessages')
  const messageDiv = document.createElement('div')
  messageDiv.className = 'message user-message'
  appendMessageContent(messageDiv, 'You', message)
  chatMessages.appendChild(messageDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

export function addAiMessage(message) {
  const chatMessages = document.getElementById('chatMessages')
  const messageDiv = document.createElement('div')
  messageDiv.className = 'message ai-message'
  appendMessageContent(messageDiv, 'Kevin', message)
  chatMessages.appendChild(messageDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return messageDiv
}

function appendMessageContent(messageDiv, sender, message) {
  const senderDiv = document.createElement('div')
  senderDiv.className = 'message-sender'
  senderDiv.textContent = sender

  const bodyDiv = document.createElement('div')
  bodyDiv.className = 'message-body'
  bodyDiv.textContent = message

  messageDiv.append(senderDiv, bodyDiv)
}

function setMessageBody(messageDiv, message) {
  messageDiv.querySelector('.message-body').textContent = message
}

let previousResponseId = null

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
  const loadingDiv = addAiMessage('Kevin is thinking...')
  loadingDiv.classList.add('loading')

  try {
    const response = await fetch('/api/openai/sro14', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: message,
        previousResponseId,
      }),
    })

    const data = await response.json()

    if (data.id && data.message) {
      previousResponseId = data.id
      const aiResponse = data.message
      loadingDiv.remove()
      addAiMessage(aiResponse)

      // Speak the response with Kevin's voice
      speakWithKevin(aiResponse)
    } else {
      setMessageBody(loadingDiv, 'Sorry, I had trouble understanding that.')
      loadingDiv.classList.remove('loading')
    }
  } catch (error) {
    console.error('Chat error:', error)
    setMessageBody(
      loadingDiv,
      'Sorry, I had trouble connecting. Please try again.'
    )
    loadingDiv.classList.remove('loading')
  }
}
