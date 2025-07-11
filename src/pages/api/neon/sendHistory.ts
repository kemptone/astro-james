import type {Talkers2VoiceDetails} from '@/core/talkers2/types'
import {neon} from '@neondatabase/serverless'

// const databaseUrl = import.meta.env.DATABASE_URL;

// if (!databaseUrl) {
//   console.error('DATABASE_URL environment variable is not set.');
//   return new Response(JSON.stringify({ error: 'Server configuration error: Database URL not set.' }), {
//     status: 500,
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   });
// }

// const db = neon(databaseUrl);

// I want a few fields from the talkers2voice details
type StoreHistoryItem = {
  ShortName: string
  Gender: 'Male' | 'Female'
  Locale: string
  text: string
  express_as?: string
  engine?: string
  voice?: string
}

export const prerender = false
export async function POST({request}: {request: Request}) {
  // const databaseUrl = import.meta.env.DATABASE_URL;

  // if (!databaseUrl) {
  //     console.error('DATABASE_URL environment variable is not set.');
  //     return new Response(JSON.stringify({ error: 'Server configuration error: Database URL not set.' }), {
  //         status: 500,
  //         headers: {
  //             'Content-Type': 'application/json'
  //         }
  //     });
  // }

  // const db = neon(databaseUrl);

  let body
  try {
    body = await request.json() // Attempt to parse JSON
    console.log({body})
  } catch (error) {
    console.error('Failed to parse request body as JSON:', error)
    return new Response(JSON.stringify({error: 'Invalid JSON format'}), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  return new Response(JSON.stringify({
    success: true,
    body,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
