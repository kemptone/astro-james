// import {MetaFlipTime} from '../../helpers/timeHelpers'
import {MetaFlipTime} from '@/helpers/timeHelpers'

const e_bitbibbiesBtn = document.getElementById('bitbibbies-btn')
const e_bitbibbiesStatus = document.getElementById('bitbibbies-status')
const e_chatInput = document.getElementById('chat-input') as HTMLInputElement
const e_sendBtn = document.getElementById('send-btn')
const e_speakBtn = document.getElementById('speak-btn')
const e_chatMessages = document.getElementById('chat-messages')
const e_timeInput = document.getElementById('time-input') as HTMLInputElement
const e_submitTimeBtn = document.getElementById('submit-time-btn')
const e_flippedDisplay = document.getElementById('flipped-display')

const {flipTime} = MetaFlipTime(e_timeInput, e_flippedDisplay)

let bitbibbiesActive = false

// Event listeners
e_bitbibbiesBtn?.addEventListener('click', toggleBitbibbies)
e_sendBtn?.addEventListener('click', sendMessage)
e_speakBtn?.addEventListener('click', speakLastMessage)
e_submitTimeBtn?.addEventListener('click', flipTime)

e_chatInput?.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage()
})

e_timeInput?.addEventListener('keypress', e => {
  if (e.key === 'Enter') flipTime()
})

function toggleBitbibbies() {
  bitbibbiesActive = !bitbibbiesActive

  if (bitbibbiesActive) {
    e_bitbibbiesBtn!.textContent = '✨ BitBibbies Active!'
    e_bitbibbiesBtn!.classList.add('active')
    e_bitbibbiesStatus!.textContent = '✅ BitBibbies Active - Games Enhanced!'
    e_bitbibbiesStatus!.classList.add('active')
  } else {
    e_bitbibbiesBtn!.textContent = 'Add BitBibbies'
    e_bitbibbiesBtn!.classList.remove('active')
    e_bitbibbiesStatus!.textContent = '❌ BitBibbies Not Added'
    e_bitbibbiesStatus!.classList.remove('active')
  }
}

function sendMessage() {
  const message = e_chatInput.value.trim()
  if (!message) return

  addUserMessage(message)
  e_chatInput.value = ''

  setTimeout(() => {
    const response = getMaliaResponse(message)
    addMaliaMessage(response)
    speakWithAna(response)
  }, 1000)
}

function addUserMessage(message: string) {
  const e_messageDiv = document.createElement('div')
  e_messageDiv.className = 'user-message'
  e_messageDiv.innerHTML = `<strong>You:</strong> ${message}`
  e_chatMessages?.appendChild(e_messageDiv)
  scrollToBottom()
}

function addMaliaMessage(message: string) {
  const e_messageDiv = document.createElement('div')
  e_messageDiv.className = 'malia-message'
  e_messageDiv.innerHTML = `<strong>Malia:</strong> ${message}`
  e_chatMessages?.appendChild(e_messageDiv)
  scrollToBottom()
}

function scrollToBottom() {
  if (e_chatMessages) {
    e_chatMessages.scrollTop = e_chatMessages.scrollHeight
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
    const response = await fetch('/api/polly/say_m', {
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
          voice.lang.includes('en')),
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
  const e_lastMaliaMessage = e_chatMessages?.querySelector(
    '.malia-message:last-child',
  )
  if (e_lastMaliaMessage) {
    const text = e_lastMaliaMessage.textContent?.replace(/^Malia:/, '') || ''
    speakWithAna(text.trim())
  }
}

// Initialize with a welcome message
addMaliaMessage(
  "Hello! I'm Malia and I'm excited to talk with you! Ask me anything you'd like, or try the time flipper below!",
)
