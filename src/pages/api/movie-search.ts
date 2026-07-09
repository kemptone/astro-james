import type { APIRoute } from 'astro'

export const prerender = false

const SEARCH_LIMIT = 8

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function upscaleArtwork(url: string) {
  return url.replace(/\/100x100bb\./, '/600x600bb.')
}

function scoreAppleMovieMatch(trackName: string, desiredTitle: string) {
  const trackTitle = normalizeTitle(trackName)
  let score = 0

  if (trackTitle === desiredTitle) score += 100
  if (trackTitle.startsWith(desiredTitle)) score += 40
  if (trackTitle.includes(desiredTitle)) score += 25
  if (desiredTitle.includes(trackTitle)) score += 12

  score -= Math.abs(trackTitle.length - desiredTitle.length)
  return score
}

async function fetchWikipediaResults(term: string) {
  const wikipediaUrl = new URL('https://en.wikipedia.org/w/api.php')
  wikipediaUrl.searchParams.set('action', 'query')
  wikipediaUrl.searchParams.set('generator', 'search')
  wikipediaUrl.searchParams.set('gsrsearch', `${term} film`)
  wikipediaUrl.searchParams.set('gsrlimit', String(SEARCH_LIMIT))
  wikipediaUrl.searchParams.set('prop', 'pageimages|extracts|info')
  wikipediaUrl.searchParams.set('inprop', 'url')
  wikipediaUrl.searchParams.set('piprop', 'thumbnail')
  wikipediaUrl.searchParams.set('pithumbsize', '480')
  wikipediaUrl.searchParams.set('exintro', '1')
  wikipediaUrl.searchParams.set('explaintext', '1')
  wikipediaUrl.searchParams.set('format', 'json')

  const response = await fetch(wikipediaUrl, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Wikipedia search failed with ${response.status}.`)
  }

  const payload = await response.json()
  const pages = Object.values(payload?.query?.pages || {}) as Array<Record<string, any>>

  return pages
    .filter(page => typeof page.title === 'string')
    .map(page => ({
      pageid: page.pageid,
      title: page.title,
      description: page.extract || 'No description yet.',
      thumbnail: page.thumbnail?.source || '',
      pageUrl: page.fullurl || '',
    }))
}

async function fetchApplePreviewForTitle(title: string) {
  const appleUrl = new URL('https://itunes.apple.com/search')
  appleUrl.searchParams.set('term', title)
  appleUrl.searchParams.set('country', 'us')
  appleUrl.searchParams.set('media', 'all')
  appleUrl.searchParams.set('limit', '25')

  const response = await fetch(appleUrl, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Apple preview search failed with ${response.status}.`)
  }

  const payload = await response.json()
  const desiredTitle = normalizeTitle(title)
  const results = Array.isArray(payload?.results) ? payload.results : []

  const candidates = results.filter(item => {
    return (
      item?.kind === 'feature-movie' &&
      typeof item?.trackName === 'string' &&
      typeof item?.previewUrl === 'string' &&
      /^https:\/\/(video-ssl\.itunes\.apple\.com|video\.itunes\.apple\.com|trailers\.apple\.com|movietrailers\.apple\.com)\//.test(
        item.previewUrl,
      )
    )
  })

  if (!candidates.length) {
    return null
  }

  const scored = candidates
    .map(item => {
      return { item, score: scoreAppleMovieMatch(item.trackName, desiredTitle) }
    })
    .sort((left, right) => right.score - left.score)

  const best = scored[0]?.item

  if (!best) {
    return null
  }

  return {
    previewUrl: best.previewUrl || '',
    previewTitle: best.trackName || '',
    exactPreviewMatch: normalizeTitle(best.trackName || '') === desiredTitle,
    trackViewUrl: best.trackViewUrl || '',
    artwork: best.artworkUrl100 ? upscaleArtwork(best.artworkUrl100) : '',
    year: typeof best.releaseDate === 'string' ? best.releaseDate.slice(0, 4) : '',
    genre: best.primaryGenreName || 'Movie',
    durationSeconds:
      typeof best.trackTimeMillis === 'number' ? Math.max(0, Math.floor(best.trackTimeMillis / 1000)) : 0,
    description: best.longDescription || best.shortDescription || '',
  }
}

async function fetchAppleMovieCandidates(term: string) {
  const appleUrl = new URL('https://itunes.apple.com/search')
  appleUrl.searchParams.set('term', term)
  appleUrl.searchParams.set('country', 'us')
  appleUrl.searchParams.set('media', 'all')
  appleUrl.searchParams.set('limit', '25')

  const response = await fetch(appleUrl, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Apple movie search failed with ${response.status}.`)
  }

  const payload = await response.json()
  const desiredTitle = normalizeTitle(term)
  const results = Array.isArray(payload?.results) ? payload.results : []

  return results
    .filter(item => {
      return (
        item?.kind === 'feature-movie' &&
        typeof item?.trackName === 'string' &&
        typeof item?.previewUrl === 'string' &&
        /^https:\/\/(video-ssl\.itunes\.apple\.com|video\.itunes\.apple\.com|trailers\.apple\.com|movietrailers\.apple\.com)\//.test(
          item.previewUrl,
        )
      )
    })
    .map(item => ({ item, score: scoreAppleMovieMatch(item.trackName, desiredTitle) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, SEARCH_LIMIT)
    .map(({ item }) => ({
      pageid: String(item.trackId || item.trackName),
      title: item.trackName || 'Movie',
      description: item.longDescription || item.shortDescription || 'No description yet.',
      thumbnail: item.artworkUrl100 ? upscaleArtwork(item.artworkUrl100) : '',
      pageUrl: item.trackViewUrl || '',
      previewUrl: item.previewUrl || '',
      previewTitle: item.trackName || '',
      exactPreviewMatch: true,
      year: typeof item.releaseDate === 'string' ? item.releaseDate.slice(0, 4) : '',
      category: item.primaryGenreName || 'Movie',
      durationSeconds:
        typeof item.trackTimeMillis === 'number' ? Math.max(0, Math.floor(item.trackTimeMillis / 1000)) : 0,
    }))
}

export const GET: APIRoute = async ({ request }) => {
  const requestUrl = new URL(request.url)
  const term = requestUrl.searchParams.get('term')?.trim()

  if (!term) {
    return new Response(JSON.stringify({ error: 'Missing term parameter.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    let wikipediaResults: Array<{
      pageid: string
      title: string
      description: string
      thumbnail: string
      pageUrl: string
    }> = []

    try {
      wikipediaResults = await fetchWikipediaResults(term)
    } catch (error) {
      console.error('Wikipedia movie search fallback triggered:', error)
    }

    if (!wikipediaResults.length) {
      const appleResults = await fetchAppleMovieCandidates(term)

      return new Response(JSON.stringify({ results: appleResults }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900',
        },
      })
    }

    const results = await Promise.all(
      wikipediaResults.map(async movie => {
        try {
          const applePreview = await fetchApplePreviewForTitle(movie.title)

          return {
            pageid: movie.pageid,
            title: movie.title,
            description: movie.description || applePreview?.description || 'No description yet.',
            thumbnail: applePreview?.artwork || movie.thumbnail || '',
            pageUrl: applePreview?.trackViewUrl || movie.pageUrl || '',
            previewUrl: applePreview?.previewUrl || '',
            previewTitle: applePreview?.previewTitle || '',
            exactPreviewMatch: applePreview?.exactPreviewMatch ?? false,
            year: applePreview?.year || '',
            category: applePreview?.genre || 'Movie',
            durationSeconds: applePreview?.durationSeconds || 0,
          }
        } catch (error) {
          console.error(`Apple preview lookup failed for ${movie.title}:`, error)

          return {
            pageid: movie.pageid,
            title: movie.title,
            description: movie.description || 'No description yet.',
            thumbnail: movie.thumbnail || '',
            pageUrl: movie.pageUrl || '',
            previewUrl: '',
            previewTitle: '',
            exactPreviewMatch: false,
            year: '',
            category: 'Movie',
            durationSeconds: 0,
          }
        }
      }),
    )

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900',
      },
    })
  } catch (error) {
    console.error('Movie search route failed:', error)
    return new Response(JSON.stringify({ error: 'Movie search route failed.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
