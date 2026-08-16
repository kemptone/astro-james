import type {APIRoute} from 'astro'
import moderationManifest from '@/data/meme/moderation-manifest.json'
import {
  canonicalizeAudioPath,
  MEME_AUDIO_ORIGIN,
} from '@/data/meme/inventory'
import {getBlockedAudioPaths} from '@/data/meme/moderation'

export const prerender = false

const blockedAudioPaths = getBlockedAudioPaths(moderationManifest)

export const POST: APIRoute = async ({request}) => {
  try {
    const requestBody = await request.json()
    const audioUrl = new URL(requestBody?.audio)

    if (audioUrl.origin !== MEME_AUDIO_ORIGIN) {
      return new Response('Invalid audio URL', {status: 400})
    }

    const audioPath = canonicalizeAudioPath(audioUrl.pathname)
    if (blockedAudioPaths.has(audioPath)) {
      return new Response('Audio not found', {status: 404})
    }

    const response = await fetch(audioUrl)

    if (!response.ok) {
      return new Response('Failed to fetch the MP3 file', {
        status: response.status,
      })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline', // or 'attachment' for download
      },
    })
  } catch (error) {
    console.error('Error reading the MP3 file:', error)
    return new Response('Error loading the file', {status: 500})
  }
}
