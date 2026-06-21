import {buildStoryPreviewText} from '../../../core/girls/storyOptions'

const XAI_API_KEY = import.meta.env.XAI_API_KEY // 'grok key';

const CUSTOM_OPTION_KEYS = [
  'opening',
  'noticeLead',
  'notice',
  'handling',
  'sounded',
  'teacher',
  'classmates',
  'ending',
] as const

function buildFallbackStory(body: Record<string, string>) {
  return buildStoryPreviewText({
    personName: body.person_name || body.girl || 'This person',
    choice: body.choice || body.bad_thing || 'made a choice at school',
    styleScore: body.style_score,
    behaviorScore: body.behavior_score || '1000',
    whatHappened:
      body.what_happened ||
      body.got_caught ||
      'the teacher noticed right away',
    opening: body.opening,
    noticeLead: body.noticeLead,
    notice: body.notice,
    handling: body.handling,
    sounded: body.sounded,
    teacher: body.teacher,
    classmates: body.classmates,
    ending: body.ending,
  })
}

function hasCustomStoryOptions(body: Record<string, string>) {
  return CUSTOM_OPTION_KEYS.some(key => key in body)
}

const fetchChatCompletionStream = async (body: any) => {
  const url = 'https://api.x.ai/v1/chat/completions'

  const requestBody = {
    messages: [
      {
        role: 'system',
        content:
          'Based on a JSON prompt, build a school story. Use the following properties from the JSON to build the story. person_name = the person name, choice = what they chose to do and it can be good or bad, style_score = an old single how-good preset and it can be Worst, 0, 1, 2, 3, 4, 5, blank, 6, 7, 8, 9, 10, or Best. behavior_score = what school behavior score they got on a 1 to 2052 scale where 1000 is the best score, what_happened = what happened next. If the JSON also includes opening, noticeLead, notice, handling, sounded, teacher, classmates, or ending, those are separate user-picked narrator options and they may be mixed on purpose, even if the story does not make sense. In that case, use those exact option phrases as written and do not try to fix their logic or make them match each other. Use exactly 6 sentences and follow this frame: 1. "{person_name} had Behavior Number Day at school and chose {choice} {opening}." 2. "{noticeLead} {what_happened}, and the moment felt {notice}." 3. "{person_name} {handling}, and the moment sounded {sounded}." 4. "The teacher said that choice caused {person_name} to have a school behavior score of {behavior_score}, and the teacher {teacher}." 5. "Other students could see that the moment was {classmates}." 6. "{person_name} ended the day understanding the moment went {ending}."',
      },
      {
        role: 'user',
        content: JSON.stringify(body),
      },
    ],
    model: 'grok-beta',
    stream: true, // Enable streaming
    temperature: 1,
  }

  let json

  try {
    json = JSON.stringify(requestBody)
  } catch (error) {
    console.error('something is wrong with the requestBody', body, error)
    return null
  }

  if (!XAI_API_KEY) {
    return null
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: json,
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    return response.body // Return the readable stream
  } catch (error) {
    console.error('Failed to fetch chat completion:', error)
    throw error
  }
}

// Streaming handler for Astro API route
export const prerender = false

export async function POST({request}: {request: Request}) {
  let body
  try {
    body = await request.json() // Attempt to parse JSON
  } catch (error) {
    console.error('Failed to parse request body as JSON:', error)
    return new Response(JSON.stringify({error: 'Invalid JSON format'}), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    if (hasCustomStoryOptions(body)) {
      return new Response(`data: ${JSON.stringify({
        choices: [{delta: {content: buildFallbackStory(body)}}],
      })}\n\ndata: [DONE]\n\n`, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    const stream = await fetchChatCompletionStream(body)
    if (!stream) {
      return new Response(`data: ${JSON.stringify({
        choices: [{delta: {content: buildFallbackStory(body)}}],
      })}\n\ndata: [DONE]\n\n`, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
      })
    }

    // Stream the response to the client
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Error handling streaming:', error)
    return new Response(
      `data: ${JSON.stringify({
        choices: [{delta: {content: buildFallbackStory(body)}}
        ],
      })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        },
      }
    )
  }
}
