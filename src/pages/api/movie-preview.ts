import type { APIRoute } from 'astro'

export const prerender = false

const ALLOWED_HOSTS = [
  'video-ssl.itunes.apple.com',
  'video.itunes.apple.com',
  'trailers.apple.com',
  'movietrailers.apple.com',
  'upload.wikimedia.org',
]

function isAllowedMovieHost(hostname: string) {
  return ALLOWED_HOSTS.includes(hostname)
}

export const GET: APIRoute = async ({ request }) => {
  const requestUrl = new URL(request.url)
  const rawUrl = requestUrl.searchParams.get('url')?.trim()

  if (!rawUrl) {
    return new Response('Missing url parameter.', { status: 400 })
  }

  let sourceUrl: URL

  try {
    sourceUrl = new URL(rawUrl)
  } catch {
    return new Response('Invalid movie source URL.', { status: 400 })
  }

  if (sourceUrl.protocol !== 'https:' || !isAllowedMovieHost(sourceUrl.hostname)) {
    return new Response('Movie source host is not allowed.', { status: 403 })
  }

  try {
    const range = request.headers.get('range')
    const upstream = await fetch(sourceUrl, {
      headers: {
        Accept: 'video/*',
        ...(range ? { Range: range } : {}),
      },
    })

    if (!upstream.ok && upstream.status !== 206) {
      return new Response('Movie source could not be loaded.', { status: upstream.status })
    }

    const headers = new Headers()
    const passthroughHeaders = [
      'accept-ranges',
      'cache-control',
      'content-length',
      'content-range',
      'content-type',
      'etag',
      'last-modified',
    ]

    passthroughHeaders.forEach(name => {
      const value = upstream.headers.get(name)
      if (value) {
        headers.set(name, value)
      }
    })

    headers.set('Content-Disposition', 'inline')
    headers.set('Access-Control-Allow-Origin', '*')

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    })
  } catch (error) {
    console.error('Movie source route failed:', error)
    return new Response('Movie source route failed.', { status: 500 })
  }
}
