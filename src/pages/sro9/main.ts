import {MetaFlipTime} from './timeHelpers'

const bitbibbiesBtn = document.getElementById('bitbibbies-btn')
const bitbibbiesStatus = document.getElementById('bitbibbies-status')
const chatInput = document.getElementById('chat-input') as HTMLInputElement
const sendBtn = document.getElementById('send-btn')
const speakBtn = document.getElementById('speak-btn')
const chatMessages = document.getElementById('chat-messages')
const timeInput = document.getElementById('time-input') as HTMLInputElement
const submitTimeBtn = document.getElementById('submit-time-btn')
const flippedDisplay = document.getElementById('flipped-display')

const {flipTime} = MetaFlipTime(timeInput, flippedDisplay)

let bitbibbiesActive = false

// Event listeners
bitbibbiesBtn?.addEventListener('click', toggleBitbibbies)
sendBtn?.addEventListener('click', sendMessage)
speakBtn?.addEventListener('click', speakLastMessage)
submitTimeBtn?.addEventListener('click', flipTime)

chatInput?.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage()
})

timeInput?.addEventListener('keypress', e => {
  if (e.key === 'Enter') flipTime()
})

function toggleBitbibbies() {
  bitbibbiesActive = !bitbibbiesActive

  if (bitbibbiesActive) {
    bitbibbiesBtn!.textContent = '✨ BitBibbies Active!'
    bitbibbiesBtn!.classList.add('active')
    bitbibbiesStatus!.textContent = '✅ BitBibbies Active - Games Enhanced!'
    bitbibbiesStatus!.classList.add('active')
  } else {
    bitbibbiesBtn!.textContent = 'Add BitBibbies'
    bitbibbiesBtn!.classList.remove('active')
    bitbibbiesStatus!.textContent = '❌ BitBibbies Not Added'
    bitbibbiesStatus!.classList.remove('active')
  }
}

function sendMessage() {
  const message = chatInput.value.trim()
  if (!message) return

  addUserMessage(message)
  chatInput.value = ''

  setTimeout(() => {
    const response = getMaliaResponse(message)
    addMaliaMessage(response)
    speakWithAna(response)
  }, 1000)
}

function addUserMessage(message: string) {
  const messageDiv = document.createElement('div')
  messageDiv.className = 'user-message'
  messageDiv.innerHTML = `<strong>You:</strong> ${message}`
  chatMessages?.appendChild(messageDiv)
  scrollToBottom()
}

function addMaliaMessage(message: string) {
  const messageDiv = document.createElement('div')
  messageDiv.className = 'malia-message'
  messageDiv.innerHTML = `<strong>Malia:</strong> ${message}`
  chatMessages?.appendChild(messageDiv)
  scrollToBottom()
}

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

function getMaliaResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hi there! I'm Malia! I'm a kid and I love talking with new people. You've never talked with a child before, right? What would you like to know?"
  }

  if (lowerMessage.includes('age') || lowerMessage.includes('old')) {
    return "I'm just a kid! I love playing games and learning new things. Do you want to try the time flipper? It's really cool!"
  }

  if (lowerMessage.includes('time') || lowerMessage.includes('flip')) {
    return "Oh, the time flipper is so much fun! You type in a time like 2:00 PM and it flips to 10:00 AM! It's like magic but with numbers!"
  }

  if (lowerMessage.includes('ana') || lowerMessage.includes('voice')) {
    return "Yes! I speak with Ana's voice from Microsoft! It's the same voice from talkers2. Isn't it cool how I sound like a real kid?"
  }

  if (lowerMessage.includes('bitbibbies')) {
    return "BitBibbies make everything better! When they're active, all the games work together and everything is more fun!"
  }

  if (lowerMessage.includes('sro') || lowerMessage.includes('game')) {
    return 'SRO games are the best! This is the 3rd decoration of SRO9. Each SRO game teaches you something different. I love being part of this one!'
  }

  if (lowerMessage.includes('school') || lowerMessage.includes('learn')) {
    return "I love learning! Numbers and time are so interesting. Did you know that when you flip time, it's like looking in a mirror but for numbers?"
  }

  if (lowerMessage.includes('play') || lowerMessage.includes('fun')) {
    return "Let's play! Try typing different times in the time flipper and see what happens. Or ask me more questions - I love answering them!"
  }

  return `That's really interesting! As a kid, I'm always curious about everything. You said "${userMessage}" - can you tell me more about that? I love learning new things!`
}

async function speakWithAna(text: string) {
  try {
    const response = await fetch('https://boodeboo.com/api/polly/say_m', {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        pragma: 'no-cache',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      body: JSON.stringify({
        Name: 'Microsoft Server Speech Text to Speech Voice (en-US, AnaNeural)',
        DisplayName: 'Ana',
        LocalName: 'Ana',
        ShortName: 'en-US-AnaNeural',
        Gender: 'Female',
        Locale: 'en-US',
        LocaleName: 'English (United States)',
        SampleRateHertz: '48000',
        VoiceType: 'Neural',
        Status: 'GA',
        VoiceTag: '[object Object]',
        WordsPerMinute: '135',
        Face: 'https://api.dicebear.com/9.x/croodles-neutral/svg?seed=en-US-AnaNeural',
        text_hidden: '',
        text: text,
      }),
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
    })

    if (response.ok) {
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    } else {
      // Fallback to browser speech synthesis
      fallbackSpeak(text)
    }
  } catch (error) {
    console.log('Using fallback speech synthesis')
    fallbackSpeak(text)
  }
}

function fallbackSpeak(text: string) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = speechSynthesis.getVoices()

    // Try to find a child-like or female voice
    const childVoice = voices.find(
      voice =>
        voice.name.toLowerCase().includes('ana') ||
        voice.name.toLowerCase().includes('child') ||
        (voice.name.toLowerCase().includes('female') &&
          voice.lang.includes('en'))
    )

    if (childVoice) {
      utterance.voice = childVoice
    }

    utterance.pitch = 1.3 // Higher pitch for child-like voice
    utterance.rate = 1.1 // Slightly faster speech
    speechSynthesis.speak(utterance)
  }
}

function speakLastMessage() {
  const lastMaliaMessage = chatMessages?.querySelector(
    '.malia-message:last-child'
  )
  if (lastMaliaMessage) {
    const text = lastMaliaMessage.textContent?.replace(/^Malia:/, '') || ''
    speakWithAna(text.trim())
  }
}

// Initialize with a welcome message
addMaliaMessage(
  "Hello! I'm Malia and I'm excited to talk with you! Ask me anything you'd like, or try the time flipper below!"
)
