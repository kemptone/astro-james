const STEPHEN_VOICE_ID = 'Stephen'
const STEPHEN_ENGINE = 'neural'
const DEFAULT_AWS_REGION = 'us-west-2'
const MAX_NARRATION_LENGTH = 600
const textEncoder = new TextEncoder()

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8'},
  })
}

function toBytes(value) {
  return typeof value === 'string' ? textEncoder.encode(value) : value
}

function toHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', toBytes(value))
  return new Uint8Array(digest)
}

async function hmac(key, value) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toBytes(key),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    toBytes(value)
  )
  return new Uint8Array(signature)
}

function awsTimestamp(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

async function createAwsAuthorization({
  accessKeyId,
  body,
  region,
  secretAccessKey,
  sessionToken,
}) {
  const service = 'polly'
  const host = `polly.${region}.amazonaws.com`
  const amzDate = awsTimestamp(new Date())
  const dateStamp = amzDate.slice(0, 8)
  const canonicalHeaderEntries = [
    ['content-type', 'application/json'],
    ['host', host],
    ['x-amz-date', amzDate],
  ]

  if (sessionToken) {
    canonicalHeaderEntries.push(['x-amz-security-token', sessionToken])
  }

  const canonicalHeaders =
    canonicalHeaderEntries
      .map(([name, value]) => `${name}:${String(value).trim()}`)
      .join('\n') + '\n'
  const signedHeaders = canonicalHeaderEntries
    .map(([name]) => name)
    .join(';')
  const payloadHash = toHex(await sha256(body))
  const canonicalRequest = [
    'POST',
    '/v1/speech',
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    toHex(await sha256(canonicalRequest)),
  ].join('\n')
  const dateKey = await hmac(`AWS4${secretAccessKey}`, dateStamp)
  const regionKey = await hmac(dateKey, region)
  const serviceKey = await hmac(regionKey, service)
  const signingKey = await hmac(serviceKey, 'aws4_request')
  const signature = toHex(await hmac(signingKey, stringToSign))

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    amzDate,
    host,
  }
}

async function narrate(request, env) {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    return jsonResponse({error: 'Narration service is unavailable.'}, 503)
  }

  const region = env.AWS_REGION || DEFAULT_AWS_REGION
  if (!/^[a-z0-9-]+$/i.test(region)) {
    return jsonResponse({error: 'Narration service is misconfigured.'}, 500)
  }

  let requestBody

  try {
    requestBody = await request.json()
  } catch {
    return jsonResponse({error: 'Invalid JSON.'}, 400)
  }

  const text = String(requestBody.text ?? requestBody.text_hidden ?? '').trim()
  if (!text || text.length > MAX_NARRATION_LENGTH) {
    return jsonResponse(
      {error: `Narration must be 1–${MAX_NARRATION_LENGTH} characters.`},
      400
    )
  }

  const body = JSON.stringify({
    Engine: STEPHEN_ENGINE,
    OutputFormat: 'mp3',
    Text: text,
    TextType: 'text',
    VoiceId: STEPHEN_VOICE_ID,
  })
  const signed = await createAwsAuthorization({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    body,
    region,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    sessionToken: env.AWS_SESSION_TOKEN,
  })
  const headers = {
    Authorization: signed.authorization,
    'Content-Type': 'application/json',
    'X-Amz-Date': signed.amzDate,
  }

  if (env.AWS_SESSION_TOKEN) {
    headers['X-Amz-Security-Token'] = env.AWS_SESSION_TOKEN
  }

  const speechResponse = await fetch(`https://${signed.host}/v1/speech`, {
    method: 'POST',
    headers,
    body,
  })

  if (!speechResponse.ok || !speechResponse.body) {
    return jsonResponse({error: 'Failed to synthesize narration.'}, 502)
  }

  return new Response(speechResponse.body, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': 'inline; filename="stephen.mp3"',
      'Content-Type': 'audio/mpeg',
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

    if (request.method === 'POST' && url.pathname === '/api/polly/say') {
      return narrate(request, env)
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      return fetchAsset(request, env)
    }

    return jsonResponse({error: 'Method not allowed.'}, 405)
  },
}
