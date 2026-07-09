import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  const requestUrl = new URL(request.url)
  const title = requestUrl.searchParams.get('title')?.trim()

  if (!title) {
    return new Response(JSON.stringify({ error: 'Missing title parameter.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const trailerSearchUrl = new URL('https://api.dailymotion.com/videos')
    trailerSearchUrl.searchParams.set('search', `${title} official trailer`)
    trailerSearchUrl.searchParams.set('fields', 'id,title,url,thumbnail_360_url')
    trailerSearchUrl.searchParams.set('limit', '6')

    const response = await fetch(trailerSearchUrl, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Trailer search failed upstream.' }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const payload = await response.json()
    const trailers = Array.isArray(payload?.list) ? payload.list : []
    const best = trailers[0]

    if (!best?.id) {
      return new Response(JSON.stringify({ embedUrl: '', title }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return new Response(
      JSON.stringify({
        title,
        trailerTitle: best.title || `${title} trailer`,
        embedUrl: `https://www.dailymotion.com/embed/video/${best.id}`,
        pageUrl: best.url || '',
        thumbnail: best.thumbnail_360_url || '',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800',
        },
      }
    )
  } catch (error) {
    console.error('Movie trailer route failed:', error)
    return new Response(JSON.stringify({ error: 'Movie trailer route failed.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
