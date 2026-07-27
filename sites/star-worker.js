const STEFFAN_VOICE = 'en-US-SteffanNeural'
const MAX_NARRATION_LENGTH = 600

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8'},
  })
}

function escapeXml(value) {
  return String(value).replace(
    /[<>&'"]/g,
    character =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character]
  )
}

async function narrate(request, env) {
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) {
    return jsonResponse({error: 'Narration service is unavailable.'}, 503)
  }

  if (!/^[a-z0-9-]+$/i.test(env.AZURE_SPEECH_REGION)) {
    return jsonResponse({error: 'Narration service is misconfigured.'}, 500)
  }

  let body

  try {
    body = await request.json()
  } catch {
    return jsonResponse({error: 'Invalid JSON.'}, 400)
  }

  const text = String(body.text ?? body.text_hidden ?? '').trim()

  if (!text || text.length > MAX_NARRATION_LENGTH) {
    return jsonResponse(
      {error: `Narration must be 1–${MAX_NARRATION_LENGTH} characters.`},
      400
    )
  }

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice xml:lang="en-US" xml:gender="Male" name="${STEFFAN_VOICE}">${escapeXml(text)}</voice></speak>`
  const speechResponse = await fetch(
    `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
      },
      body: ssml,
    }
  )

  if (!speechResponse.ok || !speechResponse.body) {
    return jsonResponse({error: 'Failed to synthesize narration.'}, 502)
  }

  return new Response(speechResponse.body, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': 'inline; filename="steffan.wav"',
      'Content-Type': 'audio/wav',
    },
  })
}

async function fetchAsset(request, env) {
  const url = new URL(request.url)

  if (url.pathname === '/' || url.pathname === '/star') {
    url.pathname = '/star/index.html'
  }

  return env.ASSETS.fetch(new Request(url, request))
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (
      request.method === 'POST' &&
      url.pathname === '/api/polly/say_m'
    ) {
      return narrate(request, env)
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      return fetchAsset(request, env)
    }

    return jsonResponse({error: 'Method not allowed.'}, 405)
  },
}
